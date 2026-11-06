import katex from "katex";
import { Fragment, type ReactNode } from "react";

/** 全站 KaTeX 宏 */
export const TEX_MACROS: Record<string, string> = {
  "\\para": "\\mathbin{/\\mkern-5mu/}",
  "\\Uo": "\\dot U_{\\mathrm o}",
  "\\Ui": "\\dot U_{\\mathrm i}",
  "\\Ib": "\\dot I_{\\mathrm b}",
  "\\Ic": "\\dot I_{\\mathrm c}",
  "\\Au": "\\dot A_{u}",
  "\\rbe": "r_{be}",
  "\\rbb": "r_{bb'}",
  "\\RLp": "R_{L}'",
  "\\kO": "\\,\\mathrm{k\\Omega}",
  "\\unit": "\\,\\mathrm{#1}",
};

const cache = new Map<string, string>();

export function renderTex(src: string, display = false): string {
  const key = (display ? "D|" : "I|") + src;
  const hit = cache.get(key);
  if (hit) return hit;
  const html = katex.renderToString(src, {
    displayMode: display,
    throwOnError: false,
    strict: "ignore",
    trust: false,
    macros: { ...TEX_MACROS },
    output: "htmlAndMathml",
  });
  if (cache.size > 2000) cache.clear();
  cache.set(key, html);
  return html;
}

export function Tex({ children, block = false, className }: { children: string; block?: boolean; className?: string }) {
  const html = renderTex(children, block);
  if (block) return <div className={`tex-block ${className ?? ""}`} dangerouslySetInnerHTML={{ __html: html }} />;
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

/** String.raw 的简写，用于书写含反斜杠的 LaTeX */
export const r = String.raw;

const TOKEN = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$|\*\*[^*]+?\*\*|`[^`]+?`)/g;

/**
 * 富文本：支持 $inline$、$$display$$、**粗体**、`code`。
 * 用于题干、选项、提示、解析等字符串内容。
 */
export function Rich({ text, className }: { text: string; className?: string }) {
  const parts = text.split(TOKEN);
  const out: ReactNode[] = parts.map((part, i) => {
    if (!part) return null;
    if (part.startsWith("$$") && part.endsWith("$$") && part.length > 4)
      return <Tex key={i} block>{part.slice(2, -2)}</Tex>;
    if (part.startsWith("$") && part.endsWith("$") && part.length > 2) return <Tex key={i}>{part.slice(1, -1)}</Tex>;
    if (part.startsWith("**") && part.endsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith("`") && part.endsWith("`"))
      return (
        <code key={i} className="num rounded bg-sunken px-1 text-[0.92em]">
          {part.slice(1, -1)}
        </code>
      );
    return <Fragment key={i}>{part}</Fragment>;
  });
  return <span className={className}>{out}</span>;
}

/** 段落：children 为字符串（可含 $...$） */
export function P({ children, className }: { children: string; className?: string }) {
  // 含块级公式时不能放在 <p> 内（HTML 不允许 <p> 嵌套 <div>）
  if (children.includes("$$"))
    return (
      <div className={`my-[0.7em] ${className ?? ""}`}>
        <Rich text={children} />
      </div>
    );
  return (
    <p className={className}>
      <Rich text={children} />
    </p>
  );
}
