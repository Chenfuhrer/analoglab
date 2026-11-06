"use client";

import { useEffect, useRef, useState } from "react";
import { describeContext, useTutorContext } from "@/lib/tutor-context";
import { CE_OFFLINE, findSectionByKeyword } from "@/lessons/ce-amplifier/offline-tutor";
import { CE_SECTIONS } from "@/content/course";
import { Rich } from "@/components/math/Tex";

const COMMANDS = ["用高中物理解释", "详细推导这个公式", "给我一个直观例子", "解释我的错误", "再出一道类似的题"] as const;
type Command = (typeof COMMANDS)[number];

interface Msg {
  role: "user" | "assistant";
  content: string;
  offline?: boolean;
}

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
/** 静态部署时可指向自建代理（密钥保存在代理服务端） */
const EXTERNAL = process.env.NEXT_PUBLIC_TUTOR_ENDPOINT;
const ENDPOINT = EXTERNAL || `${BASE}/api/tutor`;

let statusCache: Promise<boolean> | null = null;
function checkOnline(): Promise<boolean> {
  if (!statusCache) {
    statusCache = fetch(ENDPOINT, { method: "GET" })
      .then(async (r) => (r.ok ? Boolean((await r.json()).configured) : false))
      .catch(() => false);
  }
  return statusCache;
}

export function TutorPanel() {
  const [open, setOpen] = useState(true);
  const [online, setOnline] = useState<boolean | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    checkOnline().then((ok) => alive && setOnline(ok));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs]);

  const ask = async (text: string, cmd?: Command) => {
    if (!text.trim() || busy) return;
    const ctxState = useTutorContext.getState();
    const next: Msg[] = [...msgs, { role: "user", content: text }];
    setMsgs(next);
    setInput("");
    if (!online) {
      setMsgs([...next, { role: "assistant", content: offlineAnswer(text, cmd), offline: true }]);
      if (cmd === "再出一道类似的题") ctxState.exercise?.regenerate?.();
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          messages: next.filter((m) => !m.offline).map(({ role, content }) => ({ role, content })),
          context: describeContext(ctxState),
        }),
      });
      if (!res.ok || !res.body) {
        if (res.status === 503) setOnline(false);
        setMsgs([...next, { role: "assistant", content: offlineAnswer(text, cmd), offline: true }]);
        return;
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let acc = "";
      setMsgs([...next, { role: "assistant", content: "" }]);
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += dec.decode(value, { stream: true });
        setMsgs([...next, { role: "assistant", content: acc }]);
      }
    } catch {
      setMsgs([...next, { role: "assistant", content: offlineAnswer(text, cmd), offline: true }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card overflow-hidden" aria-label="AI 学习助手" data-testid="tutor-panel">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 border-b border-line px-3 py-2.5 text-left"
      >
        <span className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-ink text-[12px] text-bg" aria-hidden>
            ?
          </span>
          <span className="text-[14px] font-semibold">AI 学习助手</span>
        </span>
        <span className="flex items-center gap-2">
          <span
            className={`num rounded-full px-2 py-[1px] text-[10.5px] ${online ? "bg-ok-soft text-ok" : "bg-sunken text-ink-3"}`}
            data-testid="tutor-mode"
          >
            {online === null ? "检测中" : online ? "在线" : "离线引导"}
          </span>
          <span className="text-ink-3">{open ? "−" : "+"}</span>
        </span>
      </button>
      {open && (
        <div className="space-y-2.5 p-3">
          <div className="flex flex-wrap gap-1.5">
            {COMMANDS.map((c) => (
              <button
                key={c}
                type="button"
                disabled={busy}
                onClick={() => ask(c, c)}
                className="rounded-full border border-line bg-bg px-2.5 py-0.5 text-[12px] text-ink-2 hover:border-accent hover:text-ink disabled:opacity-50"
              >
                {c}
              </button>
            ))}
          </div>
          <div ref={listRef} className="thin-scroll max-h-[360px] space-y-2 overflow-y-auto" aria-live="polite">
            {msgs.length === 0 && (
              <p className="text-[12.5px] leading-relaxed text-ink-3">
                助手会读取你当前所在的知识点、实验室参数和正在做的题目，用提问引导你自己想明白，而不是直接给答案。
                {online === false && " 当前未配置 AI 接口：使用课程内置的分层提示（核心功能不受影响）。"}
              </p>
            )}
            {msgs.map((m, i) => (
              <div
                key={i}
                className={`rounded-lg px-3 py-2 text-[13px] leading-relaxed ${
                  m.role === "user" ? "ml-6 bg-accent-soft text-ink" : "mr-2 border border-line-2 bg-bg text-ink"
                }`}
              >
                {m.role === "assistant" && m.offline && <div className="eyebrow mb-1">离线提示</div>}
                <div className="whitespace-pre-wrap">
                  <Rich text={m.content || "…"} />
                </div>
              </div>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
            className="flex gap-1.5"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={online ? "问一个问题…" : "离线模式：输入关键词，如“交流接地”"}
              aria-label="向 AI 学习助手提问"
              className="min-w-0 flex-1 rounded-md border border-line bg-bg px-2.5 py-1.5 text-[13px] focus:border-accent focus:outline-none"
            />
            <button type="submit" disabled={busy || !input.trim()} className="rounded-md bg-ink px-3 text-[13px] font-medium text-bg disabled:opacity-40">
              {busy ? "…" : "发送"}
            </button>
          </form>
          {online === false && (
            <p className="text-[11px] leading-snug text-ink-3">
              部署者可在服务端配置 <code className="num">AI_PROVIDER</code> 与 <code className="num">AI_API_KEY</code> 启用在线助手（见 README）。密钥只保存在服务端。
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function offlineAnswer(text: string, cmd?: Command): string {
  const { lesson, exercise, lab } = useTutorContext.getState();
  const sectionId = lesson?.sectionId ?? findSectionByKeyword(text) ?? (lab ? "ce-distortion" : null);
  const hints = sectionId ? CE_OFFLINE[sectionId] : null;
  const secTitle = CE_SECTIONS.find((s) => s.id === sectionId)?.title;
  switch (cmd) {
    case "用高中物理解释":
      return hints ? `【${secTitle}】${hints.intuition}` : "先打开一个知识点（课程页面），我会给出对应的直观解释。";
    case "详细推导这个公式":
      return hints ? `【${secTitle}】${hints.derivation}\n\n完整的分步推导在课程正文的“分步推导”卡片中，可以逐步展开。` : "打开课程中的任一“分步推导”卡片，点击“下一步”逐步展开。";
    case "给我一个直观例子":
      return hints ? `【${secTitle}】${hints.example}` : "去电路实验室试试“截止失真”和“饱和失真”两个预设。";
    case "解释我的错误":
      if (exercise?.lastFeedback)
        return `判题反馈：${exercise.lastFeedback}\n\n${exercise.hints.length ? `提示 1：${exercise.hints[0]}` : ""}\n\n先自己对照提示检查一遍，再重新提交。`;
      return "目前没有检测到你的作答记录。在练习中心提交一次答案后再问我。";
    case "再出一道类似的题":
      if (exercise?.regenerate) return "已生成一道同类型、参数不同的新题（见题目区域）。";
      return "在练习中心打开一道 Level 2/3 的参数化题目，再点这个按钮即可换一组参数。";
    default: {
      if (hints)
        return `离线模式无法理解自由提问，但你的问题可能与「${secTitle}」有关：\n\n${hints.intuition}\n\n继续阅读该知识点，或用上方的指令按钮获取分层提示。`;
      return "离线模式只能根据关键词给出课程内置提示。可以试试：“为什么电容开路”“交流接地”“r_be”“截止失真”。";
    }
  }
}
