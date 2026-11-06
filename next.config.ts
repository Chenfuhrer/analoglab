import type { NextConfig } from "next";

/**
 * 两种构建模式：
 *  - 默认（服务端）：`next build && next start`，包含 POST /api/tutor（AI 辅导，密钥只在服务端）。
 *  - 静态导出：NEXT_OUTPUT=export（`npm run build:static`），用于 GitHub Pages。
 *    AI 路由文件命名为 route.server.ts，只有在服务端模式才把 "server.ts" 加入 pageExtensions，
 *    因此静态导出时该路由被自动排除。
 */
const isStatic = process.env.NEXT_OUTPUT === "export";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  output: isStatic ? "export" : undefined,
  basePath: basePath || undefined,
  trailingSlash: isStatic,
  images: { unoptimized: true },
  pageExtensions: isStatic ? ["tsx", "ts"] : ["tsx", "ts", "server.ts"],
  turbopack: {
    // 固定项目根目录（避免上层目录中的 package-lock.json 被误判为工作区根）
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
