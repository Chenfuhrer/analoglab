/**
 * POST /api/tutor —— AI 学习助手（仅服务端部署时存在；静态导出会自动排除本文件）。
 *
 * 环境变量（只在服务端读取，绝不暴露给浏览器）：
 *   AI_PROVIDER   anthropic | openai     （未设置但存在 ANTHROPIC_API_KEY 时默认 anthropic）
 *   AI_API_KEY    提供商密钥（anthropic 也可用 ANTHROPIC_API_KEY）
 *   AI_MODEL      模型 ID（anthropic 默认 claude-opus-5-5；openai 兼容接口必填）
 *   AI_BASE_URL   openai 兼容接口的基地址，如 https://api.deepseek.com/v1
 *   AI_EFFORT     anthropic 的 effort：low | medium | high（默认 medium）
 * 未配置时返回 503 {error:"not_configured"}，前端切换到离线引导模式。
 */
import Anthropic from "@anthropic-ai/sdk";
import { TUTOR_SYSTEM_PROMPT } from "@/lib/tutor-prompt";

interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

const MAX_TURNS = 16;
const MAX_CHARS = 4000;
const MAX_CONTEXT = 6000;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_REQ_PER_WINDOW = 30;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length > MAX_REQ_PER_WINDOW;
}

function resolveProvider(): "anthropic" | "openai" | null {
  const p = process.env.AI_PROVIDER?.toLowerCase();
  if (p === "anthropic" || p === "openai") return p;
  if (process.env.ANTHROPIC_API_KEY || process.env.AI_API_KEY) return "anthropic";
  return null;
}

export async function GET() {
  return Response.json({ configured: resolveProvider() !== null, provider: resolveProvider() });
}

export async function POST(req: Request) {
  const provider = resolveProvider();
  if (!provider) return Response.json({ error: "not_configured" }, { status: 503 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (rateLimited(ip)) return Response.json({ error: "rate_limited" }, { status: 429 });

  let body: { messages?: ChatTurn[]; context?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "bad_json" }, { status: 400 });
  }
  const turns = (body.messages ?? [])
    .filter((m): m is ChatTurn => (m?.role === "user" || m?.role === "assistant") && typeof m.content === "string")
    .slice(-MAX_TURNS)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));
  if (!turns.length || turns[turns.length - 1].role !== "user") return Response.json({ error: "bad_request" }, { status: 400 });
  while (turns.length && turns[0].role !== "user") turns.shift();
  const context = String(body.context ?? "").slice(0, MAX_CONTEXT);

  // 学习上下文附在最后一条学生消息之前（系统提示保持不变，便于缓存）
  const last = turns[turns.length - 1];
  last.content = `【当前学习上下文（由网站自动提供）】\n${context || "（无）"}\n\n【学生的问题】\n${last.content}`;

  try {
    const stream = provider === "anthropic" ? anthropicStream(turns) : await openaiStream(turns);
    return new Response(stream, {
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
    });
  } catch (e) {
    console.error("[tutor] provider error", e);
    return Response.json({ error: "provider_error" }, { status: 502 });
  }
}

function anthropicStream(turns: ChatTurn[]): ReadableStream<Uint8Array> {
  const client = new Anthropic({
    apiKey: process.env.AI_API_KEY || process.env.ANTHROPIC_API_KEY,
  });
  const effort = (["low", "medium", "high"] as const).find((e) => e === process.env.AI_EFFORT) ?? "medium";
  const enc = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      try {
        const stream = client.beta.messages.stream({
          model: process.env.AI_MODEL || "claude-opus-5-5",
          max_tokens: 16000,
          // 安全分类器拒答时，由服务端按类别自动切换到推荐的后备模型
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
          output_config: { effort },
          system: TUTOR_SYSTEM_PROMPT,
          messages: turns,
        });
        for await (const event of stream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(enc.encode(event.delta.text));
          }
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") {
          controller.enqueue(enc.encode("\n\n（这个请求未能得到回答。可以换一种问法，或使用离线提示。）"));
        } else if (final.stop_reason === "max_tokens") {
          controller.enqueue(enc.encode("\n\n（回答过长被截断。）"));
        }
        controller.close();
      } catch (e) {
        if (e instanceof Anthropic.RateLimitError) controller.enqueue(enc.encode("\n\n（模型服务繁忙，请稍后再试。）"));
        else if (e instanceof Anthropic.AuthenticationError) controller.enqueue(enc.encode("\n\n（服务端 AI 密钥无效，请检查部署配置。）"));
        else if (e instanceof Anthropic.APIError) controller.enqueue(enc.encode(`\n\n（AI 服务错误 ${e.status ?? ""}）`));
        else controller.enqueue(enc.encode("\n\n（AI 服务连接失败）"));
        console.error("[tutor] anthropic", e);
        controller.close();
      }
    },
  });
}

/** OpenAI 兼容接口（如 DeepSeek、通义千问、Kimi 等国内模型服务）——非 Claude 模型的可选通道 */
async function openaiStream(turns: ChatTurn[]): Promise<ReadableStream<Uint8Array>> {
  const base = process.env.AI_BASE_URL;
  const model = process.env.AI_MODEL;
  const key = process.env.AI_API_KEY;
  if (!base || !model || !key) throw new Error("openai provider requires AI_BASE_URL, AI_MODEL, AI_API_KEY");
  const res = await fetch(`${base.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      stream: true,
      max_tokens: 4000,
      messages: [{ role: "system", content: TUTOR_SYSTEM_PROMPT }, ...turns],
    }),
  });
  if (!res.ok || !res.body) throw new Error(`upstream ${res.status}`);
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  const enc = new TextEncoder();
  let buf = "";
  return new ReadableStream({
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) {
        controller.close();
        return;
      }
      buf += dec.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        const t = line.trim();
        if (!t.startsWith("data:")) continue;
        const data = t.slice(5).trim();
        if (data === "[DONE]") continue;
        try {
          const j = JSON.parse(data);
          const piece = j?.choices?.[0]?.delta?.content;
          if (typeof piece === "string" && piece) controller.enqueue(enc.encode(piece));
        } catch {
          /* 忽略不完整的行 */
        }
      }
    },
    cancel() {
      reader.cancel().catch(() => {});
    },
  });
}
