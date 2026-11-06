# AnalogLab — Interactive Analog Electronics Learning Platform

**模拟电子技术交互式教学平台**：面向电子信息类本科生，对照《模拟电子技术基础》（童诗白、华成英）课程体系。课程讲“为什么”，实验室里的每个波形、每个工作点都由经过单元测试的电路模型实时计算，练习题按量纲与误差自动判分并诊断常见错误。

> 当前版本：Phase 1–2 完成，**共射极放大电路**为第一个完整样板单元；其余 11 章已建立课程架构与知识图谱（规划中）。详见 [PROGRESS.md](PROGRESS.md)。

## 功能

| 模块 | 说明 |
|------|------|
| 课程 | 12 章 / 49 个单元的目录与先修关系；共射单元 10 个知识点，按“物理直觉 → 概念 → 电路分析 → 分步推导 → 可视化验证 → 例题 → 练习 → 总结”组织，回答 14 个核心问题 |
| 交互电路图 | SVG 规范符号（IEC 矩形电阻），元件可点击；**完整 / 直流 / 交流 / 微变等效** 四种模式带过渡动画；电流路径、电压极性、缩放/平移/重置 |
| 共射实验室 | 固定偏置 / 分压偏置；调 V_CC、R_b、R_c、R_e、R_L、R_s、β、U_BEQ、输入幅度与频率；Q 点与工作区、示波器（暂停 / 时基 / 峰值 / 有效值 / 相位 / THD）、输出特性 + 直流/交流负载线 + 动态轨迹、失真诊断、实时数值推导 |
| 公式推导 | KaTeX；逐步展开，每步写依据、近似条件、数值代入与单位检查 |
| 练习 | 三级难度共 31 个题型（11 个参数化生成器，可无限换参数）；单位/量纲检查、分步提示、常见错误识别（如“漏了 r_bb′”“忘了负载”“符号错误”）、错题本、进度记录 |
| AI 学习助手 | 读取当前知识点 / 电路参数 / 题目与作答状态，苏格拉底式引导；密钥只在服务端；**未配置时自动切换为离线引导模式**，核心功能不受影响 |
| 其他 | 学习进度、公式速查、知识图谱、符号约定与教材对照、深色模式（示波器屏幕风格）、移动端适配 |

## 快速开始

```bash
npm install
npm run dev            # http://localhost:3000
```

常用命令：

```bash
npm test               # 计算核心 + 判题器 + 出题器（Vitest）
npm run typecheck
npm run lint
npm run test:e2e       # Playwright 端到端（本地默认使用已安装的 Google Chrome）
npm run build          # 生产构建（含 /api/tutor）
npm run build:static   # 静态导出到 out/（GitHub Pages，不含 AI 路由）
```

> 本地已有 `next dev` 在运行时，Next 16 不允许同目录再起第二个 dev 服务器。可用 `E2E_PORT=<端口> npm run test:e2e` 复用正在运行的服务器。

## 部署

### 方式一：GitHub Pages（静态，免费）
仓库已包含 `.github/workflows/pages.yml`。在仓库 **Settings → Pages → Source** 选择 **GitHub Actions**，推送到 `main` 后自动构建发布到 `https://<用户名>.github.io/<仓库名>/`。静态部署没有服务端，AI 助手为离线引导模式（可选：设置 `NEXT_PUBLIC_TUTOR_ENDPOINT` 指向你自建的代理）。

### 方式二：Node 服务器 / Vercel（支持在线 AI 助手）
```bash
npm run build && npm start
```
在部署平台配置环境变量（见 [.env.example](.env.example)）：

| 变量 | 说明 |
|------|------|
| `AI_PROVIDER` | `anthropic`（默认，使用官方 SDK）或 `openai`（任意 OpenAI 兼容接口，如国内模型服务） |
| `AI_API_KEY` | 提供商密钥（anthropic 也可用 `ANTHROPIC_API_KEY`） |
| `AI_MODEL` | anthropic 默认 `claude-opus-5-5`；openai 兼容接口必填 |
| `AI_BASE_URL` | openai 兼容接口地址，如 `https://api.example.com/v1` |
| `AI_EFFORT` | anthropic 的推理强度 `low` / `medium` / `high`（默认 `medium`） |

密钥只在服务端读取；路由带有简单的按 IP 限流（10 分钟 30 次）。anthropic 通道启用了服务端拒答回退（`fallbacks: "default"`），由 API 按类别自动切换到推荐的后备模型。

## 计算模型（简述）

- **静态**：恒压降模型 + 放大区 `I_C = βI_B`；`U_CE < U_CES` 时按饱和联立求解；分压偏置同时给出教材估算法与戴维南精确解。
- **动态**：中频 h 参数简化模型，`r_be = r_bb' + (1+β)U_T/I_EQ`；未旁路射极电阻按 `(1+β)` 折算。
- **波形**：准静态大信号求解——电容电压保持静态值，发射结为在 Q 点校准的指数特性，每个采样点解非线性方程。小信号时与 `A_us` 误差 < 0.5%（有测试），大信号时自然出现截止/饱和削波与指数非线性失真。
- 所有假设在页面上写明。详见 [ARCHITECTURE.md](ARCHITECTURE.md)。

## 项目文档

[PROJECT_PLAN.md](PROJECT_PLAN.md) · [ARCHITECTURE.md](ARCHITECTURE.md) · [PROGRESS.md](PROGRESS.md) · [CONTENT_GUIDELINES.md](CONTENT_GUIDELINES.md) · [TEST_PLAN.md](TEST_PLAN.md) · [CLAUDE.md](CLAUDE.md)

## 版权说明

课程讲解与题目均为原创。符号体系参照童诗白、华成英《模拟电子技术基础》，本仓库不包含任何教材或试卷原文、原题、原图。

## License

MIT
