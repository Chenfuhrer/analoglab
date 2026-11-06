import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Noto_Serif_SC } from "next/font/google";
import "katex/dist/katex.min.css";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

const notoSerifSC = Noto_Serif_SC({
  variable: "--font-noto-serif-sc",
  weight: ["600", "700"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: {
    default: "AnalogLab · 模拟电子技术交互式教学平台",
    template: "%s · AnalogLab",
  },
  description:
    "AnalogLab：面向电子信息类本科生的模拟电子技术交互式教学平台——可交互电路图、实时仿真波形、分步公式推导与自动判题练习。",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f3ec" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0e13" },
  ],
};

/** 在首帧前设置主题，避免闪烁 */
const themeScript = `(function(){try{var t=localStorage.getItem('analoglab-theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="zh-CN"
      suppressHydrationWarning
      className={`${plexSans.variable} ${plexMono.variable} ${notoSerifSC.variable} antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen bg-bg text-ink">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
