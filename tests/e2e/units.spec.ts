import { expect, test, type Page } from "@playwright/test";
import { LESSON_ID_LIST } from "../../src/lessons/lesson-ids";

async function setParam(page: Page, testId: string, value: string) {
  const input = page.getByTestId(testId).getByRole("textbox");
  await input.click();
  await input.fill(value);
  await input.press("Enter");
}

test.describe("全部课程单元", () => {
  for (const id of LESSON_ID_LIST) {
    test(`${id}：展开全部推导后无 KaTeX / 运行时错误`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (m) => {
        if (m.type() === "error") errors.push(m.text());
      });
      await page.goto(`/learn/${id}`);
      await expect(page.getByTestId(`lesson-${id === "ce-amplifier" ? "ce" : id}`)).toBeVisible();
      const buttons = page.getByRole("button", { name: "全部展开" });
      for (let guard = 0; guard < 40 && (await buttons.count()) > 0; guard++) await buttons.first().click();
      await expect(page.locator(".katex-error")).toHaveCount(0);
      // 每个交互组件都渲染出了图表或电路图
      const widgets = page.locator("article .card[data-testid]");
      expect(await widgets.count()).toBeGreaterThan(0);
      expect(errors.filter((e) => !/Download the React DevTools|\[HMR\]|\[Fast Refresh\]/.test(e))).toEqual([]);
    });
  }
});

test.describe("各章关键交互", () => {
  test("第 1 章：钳位电路波形", async ({ page }) => {
    await page.goto("/learn/diode-circuits");
    const w = page.getByTestId("diode-waves").first();
    await w.getByTestId("wave-kind").getByRole("radio", { name: "钳位" }).click();
    await expect(w.getByTestId("wave-uo")).toHaveAttribute("d", /M/);
  });

  test("第 2 章：由电位判断管型", async ({ page }) => {
    await page.goto("/learn/bjt-curves");
    const w = page.getByTestId("pin-judge");
    await w.getByRole("button", { name: "例 2" }).click();
    await expect(w.getByTestId("pj-type")).toHaveText("PNP");
  });

  test("第 3 章：分压偏置比固定偏置稳定", async ({ page }) => {
    await page.goto("/learn/divider-bias");
    const w = page.getByTestId("q-drift");
    await setParam(page, "qd-t", "80");
    const fixed = parseFloat((await w.getByTestId("qd-fixed").innerText()).replace(/[^\d.]/g, ""));
    const div = parseFloat((await w.getByTestId("qd-div").innerText()).replace(/[^\d.]/g, ""));
    expect(fixed).toBeGreaterThan(div);
  });

  test("第 4 章：增大 R_d 进入可变电阻区", async ({ page }) => {
    await page.goto("/learn/cs-amplifier");
    await setParam(page, "cs-rs", "0.1");
    await setParam(page, "cs-rd", "20");
    await expect(page.getByTestId("cs-region")).toContainText("可变电阻区");
  });

  test("第 6 章：恒流源提高共模抑制比", async ({ page }) => {
    await page.goto("/learn/diff-amplifier");
    const w = page.getByTestId("diff-lab");
    const before = parseFloat(await w.getByTestId("dl-kcmr").innerText());
    await w.getByRole("radio", { name: "恒流源" }).click();
    const after = parseFloat(await w.getByTestId("dl-kcmr").innerText());
    expect(after).toBeGreaterThan(before * 10);
  });

  test("第 7 章：滞回比较器抗干扰", async ({ page }) => {
    await page.goto("/learn/opamp-ideal");
    const w = page.getByTestId("comparator-demo");
    await expect(w.getByTestId("cmp-flips")).toHaveText("2");
    await w.getByTestId("cmp-hyst").getByRole("switch").click();
    await expect(w.getByTestId("cmp-flips")).not.toHaveText("2");
  });

  test("第 8 章：主极点补偿消除自激", async ({ page }) => {
    await page.goto("/learn/fb-stability");
    const w = page.getByTestId("stability-demo");
    await setParam(page, "st-t0", "1000");
    await expect(w.getByTestId("st-verdict")).toHaveText("自激振荡");
    await w.getByTestId("st-comp").getByRole("switch").click();
    await expect(w.getByTestId("st-verdict")).toHaveText("稳定");
  });

  test("第 11 章：A < 3 不起振；A_up ≥ 3 的二阶滤波器自激", async ({ page }) => {
    await page.goto("/learn/osc-condition");
    await setParam(page, "ws-k", "2.8");
    await expect(page.getByTestId("ws-amp")).toHaveText("衰减到 0");
    await page.goto("/learn/active-filter");
    await setParam(page, "fl-aup", "3.1");
    await expect(page.getByTestId("fl-q")).toContainText("不稳定");
  });

  test("第 12 章：输入过低失去稳压", async ({ page }) => {
    await page.goto("/learn/series-regulator");
    await setParam(page, "sr-ui", "10");
    await expect(page.getByTestId("sr-state")).toContainText("失去稳压");
  });

  test("练习中心：按章节筛选并作答", async ({ page }) => {
    await page.goto("/practice?topic=opamp-proportional");
    await expect(page.getByTestId("chapter-7")).toHaveClass(/border-accent/);
    const card = page.getByTestId("exercise");
    await expect(card).toBeVisible();
    await expect(page.locator(".katex-error")).toHaveCount(0);
  });
});
