import type { Metadata } from "next";

export const metadata: Metadata = { title: "学习进度" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
