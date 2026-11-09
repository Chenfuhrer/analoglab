import { expect, test, type Page } from "@playwright/test";

async function setParam(page: Page, key: string, value: string) {
  const input = page.getByTestId(`param-${key}`).getByRole("textbox");
  await input.click();
  await input.fill(value);
  await input.press("Enter");
}

test.describe("页面导航", () => {
  const routes: Array<[string, RegExp]> = [
    ["/", /把模拟电路/],
    ["/learn", /课程目录/],
    ["/learn/ce-amplifier", /共射极放大电路/],
    ["/lab", /电路实验室/],
    ["/lab/ce-amplifier", /共射极放大电路实验室/],
    ["/practice", /练习中心/],
    ["/mistakes", /错题本/],
    ["/progress", /学习进度/],
    ["/formulas", /公式速查/],
    ["/graph", /知识图谱/],
    ["/notation", /符号约定/],
  ];
  for (const [path, h1] of routes) {
    test(`${path} 可访问且无 KaTeX 错误`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await page.goto(path);
      await expect(page.locator("h1").first()).toHaveText(h1);
      await expect(page.locator(".katex-error")).toHaveCount(0);
      expect(errors).toEqual([]);
    });
  }

  test("首页 → 课程 → 实验室", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("cta-learn").click();
    await expect(page).toHaveURL(/\/learn\/semi-carriers/);
    await page.getByRole("navigation", { name: "主导航" }).getByRole("link", { name: "实验室" }).click();
    await expect(page).toHaveURL(/\/lab$/);
  });

  test("课程正文包含 10 个知识点与全部 14 个核心问题", async ({ page }) => {
    await page.goto("/learn/ce-amplifier");
    await expect(page.locator("[data-section]")).toHaveCount(10);
    for (let n = 1; n <= 14; n++) await expect(page.getByText(`Q${n}`, { exact: true })).toHaveCount(1);
  });
});

test.describe("电路实验室", () => {
  test("参数输入 → Q 点更新与工作区判断", async ({ page }) => {
    await page.goto("/lab/ce-amplifier");
    await expect(page.getByTestId("IBQ")).toHaveText("20 µA");
    await expect(page.getByTestId("UCEQ")).toHaveText("6 V");
    await setParam(page, "Rb", "200");
    await expect(page.getByTestId("region-badge").first()).toContainText("饱和区");
    await expect(page.getByTestId("UCEQ")).toHaveText("0.3 V");
    await setParam(page, "Rb", "1000");
    await expect(page.getByTestId("region-badge").first()).toContainText("放大区");
    await expect(page.getByTestId("IBQ")).toHaveText("11.3 µA");
  });

  test("四种分析模式切换", async ({ page }) => {
    await page.goto("/lab/ce-amplifier");
    const sch = page.getByTestId("ce-schematic");
    const sw = page.getByTestId("mode-switch");
    await sw.getByRole("radio", { name: "直流" }).click();
    await expect(sch).toHaveAttribute("data-mode", "dc");
    await expect(sch.getByTestId("dc-annotations")).toBeVisible();
    await sw.getByRole("radio", { name: "交流" }).click();
    await expect(sch).toHaveAttribute("data-mode", "ac");
    await expect(sch.getByTestId("ac-annotations")).toBeVisible();
    await expect(sch.getByText("交流地")).toBeVisible();
    await sw.getByRole("radio", { name: "微变" }).click();
    await expect(sch).toHaveAttribute("data-mode", "ss");
    await sw.getByRole("radio", { name: "完整" }).click();
    await expect(sch).toHaveAttribute("data-mode", "full");
  });

  test("开关状态与外观一致（负载开路开关）", async ({ page }) => {
    await page.goto("/lab/ce-amplifier");
    const sw = page.getByTestId("toggle-open-load").getByRole("switch");
    await expect(sw).toHaveAttribute("aria-checked", "false");
    await expect(sw.locator("[data-knob]")).toHaveAttribute("data-knob", "off");
    const box0 = await sw.locator("[data-knob]").boundingBox();
    await sw.click();
    await expect(sw).toHaveAttribute("aria-checked", "true");
    await expect(page.getByTestId("param-RL")).toHaveCount(0);
    await page.waitForTimeout(300);
    const box1 = await sw.locator("[data-knob]").boundingBox();
    expect(box1!.x - box0!.x).toBeGreaterThan(10);
  });

  test("点击元件显示说明", async ({ page }) => {
    await page.goto("/lab/ce-amplifier");
    await page.locator('[data-testid="ce-schematic"] [data-part="C1"]').click();
    await expect(page.getByTestId("part-info")).toHaveAttribute("data-part", "C1");
    await expect(page.getByTestId("part-info")).toContainText("隔直通交");
  });

  test("电路图缩放与重置", async ({ page }) => {
    await page.goto("/lab/ce-amplifier");
    const svg = page.getByTestId("ce-schematic-svg");
    const before = await svg.getAttribute("data-viewbox");
    await page.getByTestId("zoom-in").click();
    await expect(svg).not.toHaveAttribute("data-viewbox", before!);
    await page.getByTestId("zoom-reset").click();
    await expect(svg).toHaveAttribute("data-viewbox", before!);
  });

  test("波形随输入幅度更新；截止失真预设给出诊断", async ({ page }) => {
    await page.goto("/lab/ce-amplifier");
    const peaks = page.getByTestId("uo-peaks");
    const p1 = await peaks.textContent();
    await setParam(page, "Usm", "1");
    await expect(peaks).not.toHaveText(p1!);
    await page.getByTestId("preset-cutoff").click();
    await expect(page.getByTestId("distortion-panel")).toContainText("截止失真");
    await page.getByTestId("preset-saturation").click();
    await expect(page.getByTestId("distortion-panel")).toContainText("饱和失真");
  });

  test("示波器暂停", async ({ page }) => {
    await page.goto("/lab/ce-amplifier");
    const run = page.getByTestId("scope-run");
    await run.click();
    await expect(run).toHaveAttribute("aria-pressed", "true");
    const t1 = await page.getByTestId("scope-cursor").textContent();
    await page.waitForTimeout(600);
    await expect(page.getByTestId("scope-cursor")).toHaveText(t1!);
  });
});

test.describe("练习与进度", () => {
  test("提交 → 判题 → 错题本 → 订正", async ({ page }) => {
    await page.goto("/practice");
    await page.getByTestId("q-gen-fixed-q").click();
    const card = page.getByTestId("exercise");
    await expect(card).toHaveAttribute("data-key", "gen-fixed-q:1");
    await card.getByTestId("answer-IBQ").fill("10");
    await card.getByTestId("submit").click();
    await expect(card.getByTestId("feedback-IBQ")).toHaveAttribute("data-code", "no_unit");
    await expect(card).toHaveAttribute("data-result", "wrong");

    await page.goto("/mistakes");
    await expect(page.getByTestId("mistake-item")).toHaveCount(1);

    // 从解析读取标准答案并订正
    await page.getByTestId("redo").click();
    const c2 = page.getByTestId("exercise");
    await c2.getByTestId("answer-IBQ").fill("1 uA");
    await c2.getByTestId("submit").click();
    await c2.getByTestId("show-solution").click();
    const answers = await c2.locator("p", { hasText: "参考答案" }).allTextContents();
    const vals = answers.map((a) => a.replace("参考答案：", "").split("（")[0].trim());
    await c2.getByTestId("answer-IBQ").fill(vals[0]);
    await c2.getByTestId("answer-ICQ").fill(vals[1]);
    await c2.getByTestId("answer-UCEQ").fill(vals[2]);
    await c2.getByTestId("submit").click();
    await expect(c2).toHaveAttribute("data-result", "correct");
  });

  test("错因诊断 → 同类错因练习 → 错因画像与错题本", async ({ page }) => {
    await page.goto("/practice");
    await page.getByTestId("q-gen-fixed-q").click();
    const card = page.getByTestId("exercise");
    await expect(card).toHaveAttribute("data-key", "gen-fixed-q:1");
    // 先提交一次，读出参考答案
    await card.getByTestId("answer-IBQ").fill("1 uA");
    await card.getByTestId("submit").click();
    await card.getByTestId("show-solution").click();
    const ref = (await card.locator("p", { hasText: "参考答案" }).first().textContent())!.replace("参考答案：", "").split("（")[0].trim();
    // 单位前缀写错（数值相同、数量级差 1000 倍）
    const wrong = ref.includes("µA") ? ref.replace("µA", "mA") : ref.replace("mA", "A");
    await card.getByTestId("answer-IBQ").fill(wrong);
    await card.getByTestId("submit").click();
    await expect(card.getByTestId("feedback-IBQ")).toHaveAttribute("data-tag", "unit-convert");
    const diag = card.getByTestId("diagnosis");
    await expect(diag.getByTestId("diag-unit-convert")).toBeVisible();
    await expect(diag.locator(".katex-error")).toHaveCount(0);

    await diag.getByTestId("diag-practice").click();
    await expect(page).toHaveURL(/\/practice\?mc=unit-convert/);
    await expect(page.getByTestId("mc-filter")).toHaveAttribute("data-tag", "unit-convert");
    await expect(page.getByTestId("exercise")).toBeVisible();

    await page.goto("/progress");
    const row = page.getByTestId("mc-row-unit-convert");
    await expect(row).toBeVisible();
    await expect(row).toHaveAttribute("data-resolved", "0");

    await page.goto("/mistakes");
    await expect(page.getByTestId("mistake-item").first().getByTestId("diag-chip")).toHaveAttribute("data-tag", "unit-convert");
  });

  test("选择题的错误选项给出错因", async ({ page }) => {
    await page.goto("/practice?topic=fb-judge");
    await page.getByTestId("q-fj-g-oa").click();
    const card = page.getByTestId("exercise");
    // 找一个错误选项：先选第一个，若恰好正确再换第二个
    await card.getByTestId("option-0").click();
    await card.getByTestId("submit").click();
    if ((await card.getAttribute("data-result")) === "correct") {
      await card.getByTestId("option-1").click();
      await card.getByTestId("submit").click();
    }
    await expect(card).toHaveAttribute("data-result", "wrong");
    await expect(card.getByTestId("diag-chip")).toHaveAttribute("data-tag", "feedback-type");
    await expect(card.getByTestId("diagnosis").getByTestId("diag-feedback-type")).toBeVisible();
  });

  test("选择题判题与解释", async ({ page }) => {
    await page.goto("/practice");
    await page.getByTestId("q-c-cutoff-shape").click();
    const card = page.getByTestId("exercise");
    await card.getByTestId("option-1").click();
    await card.getByTestId("submit").click();
    await expect(card).toHaveAttribute("data-result", "wrong");
    await card.getByTestId("option-0").click();
    await card.getByTestId("submit").click();
    await expect(card).toHaveAttribute("data-result", "correct");
  });

  test("“换一组参数”生成新题", async ({ page }) => {
    await page.goto("/practice");
    await page.getByTestId("q-gen-divider-full").click();
    const card = page.getByTestId("exercise");
    const k1 = await card.getAttribute("data-key");
    await card.getByTestId("regenerate").click();
    await expect(page.getByTestId("exercise")).not.toHaveAttribute("data-key", k1!);
  });

  test("知识点完成状态刷新后仍保留", async ({ page }) => {
    await page.goto("/learn/ce-amplifier");
    await page.getByTestId("done-ce-why").click();
    await expect(page.getByTestId("done-ce-why")).toHaveAttribute("aria-pressed", "true");
    await page.reload();
    await expect(page.getByTestId("done-ce-why")).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("nav-progress")).toHaveText(/^1\/\d+$/);
  });
});

test.describe("UI", () => {
  test("深色模式切换并持久化", async ({ page }) => {
    await page.goto("/");
    const html = page.locator("html");
    const wasDark = ((await html.getAttribute("class")) ?? "").includes("dark");
    await page.getByTestId("theme-toggle").click();
    await expect(html).toHaveClass(wasDark ? /^(?!.*\bdark\b)/ : /\bdark\b/);
    await page.reload();
    await expect(html).toHaveClass(wasDark ? /^(?!.*\bdark\b)/ : /\bdark\b/);
  });

  test("AI 助手无配置时进入离线引导模式", async ({ page }) => {
    await page.goto("/learn/ce-amplifier");
    const tutor = page.getByTestId("tutor-panel").first();
    await expect(tutor.getByTestId("tutor-mode")).toHaveText("离线引导");
    await tutor.getByRole("button", { name: "用高中物理解释" }).click();
    await expect(tutor.getByText("离线提示")).toBeVisible();
  });
});
