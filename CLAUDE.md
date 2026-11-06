# AnalogLab — 项目长期开发规范（给 Claude / 任何 AI 协作者）

> 每次开始工作：先读 `PROGRESS.md` → `ARCHITECTURE.md` → `CONTENT_GUIDELINES.md`，再动代码。
> 不要重新设计已完成模块；不要未经检查覆盖已有文件。

@AGENTS.md

## 项目一句话
模拟电子技术交互式教学平台。Next.js 16 (App Router) + React 19 + TypeScript + Tailwind 4 + KaTeX + 自研 SVG 电路图/图表。

## 硬规则
1. **计算正确性优先**：所有电路数值必须来自 `src/simulations/` 中经过单元测试的函数。UI、题目、课程正文不得各自重复实现公式。
2. **禁止伪造仿真**：波形、工作点、特性曲线必须由当前参数实时计算；任何简化模型必须在 UI 上写明假设。
3. **符号约定**：沿用童诗白/华成英《模拟电子技术基础》的符号体系（见 `src/content/notation.ts`）。
   - 直流/静态：`I_{BQ}`、`U_{CEQ}`；总瞬时：`i_B`、`u_{CE}`；交流瞬时：`i_b`、`u_{ce}`；交流有效值/相量：`I_b`、`\dot U_o`。
   - 分压偏置：`R_{b1}` 为下偏置电阻（基极→地），`R_{b2}` 为上偏置电阻（`V_{CC}`→基极）。
4. **公式四要素**：变量定义、单位、适用条件、近似假设。新增公式写进 `src/formulas/`，不要只写在正文里。
5. **测试**：`npm test`（Vitest，计算核心）必须全绿；改动 UI 交互后跑 `npm run test:e2e`。测试失败不得宣称完成。
6. **不新增重型依赖**：图表与电路图都是自研 SVG。新增依赖前在 `ARCHITECTURE.md` 记录理由。
7. **API 密钥只在服务端**：`src/app/api/tutor/route.server.ts` 读取环境变量；客户端代码不得出现密钥或 `NEXT_PUBLIC_*_KEY`。
8. **动画**：入场动画用 CSS keyframes + IntersectionObserver；不使用 motion/react 的 `initial`/`animate`。遵守 `prefers-reduced-motion`。
9. **版权**：`../` 目录里的教材 PDF、试卷仅作调研参考，不得复制原文、原题、原图进仓库；题目与讲解必须原创。

## 常用命令
```bash
npm run dev          # 开发服务器 http://localhost:3000
npm test             # Vitest 计算核心 + 判题 + 单位解析
npm run test:e2e     # Playwright 端到端（会自动起 dev server）
npm run typecheck    # tsc --noEmit
npm run lint
npm run build        # 生产构建（含 /api/tutor）
npm run build:static # 静态导出到 out/（GitHub Pages，无 /api/tutor）
```

## 目录职责
- `src/simulations/` 纯函数计算核心（无 React）。每个模型配 `*.test.ts`。
- `src/circuits/` 电路图版图数据 + 模式变换规则（无计算）。
- `src/components/` UI 组件；`circuit/` 符号库与原理图渲染；`plot/` 图表；`lab/` 实验室。
- `src/lessons/` 课程正文（TSX）；`src/content/` 课程目录、知识图谱、符号表。
- `src/exercises/` 题库、参数化题目生成器、判题器。
- `src/lib/` 状态（zustand persist）、富文本/公式解析、通用工具。

## 写作风格
中文讲解，代码/专有名词保留英文。每个知识点按「物理直觉 → 概念 → 电路分析 → 数学推导 → 可视化验证 → 例题 → 练习 → 总结」组织。
