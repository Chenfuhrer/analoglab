import { expect, test } from "@playwright/test";
import { LESSON_ID_LIST } from "../../src/lessons/lesson-ids";

test.describe("移动端布局", () => {
  test("左栏收起为抽屉；右栏由顶栏按钮打开", async ({ page }) => {
    await page.goto("/learn/ce-amplifier");
    await expect(page.getByRole("complementary", { name: "课程导航" })).toBeHidden();
    await page.getByRole("button", { name: "打开课程导航" }).click();
    await expect(page.getByRole("dialog", { name: "课程导航" })).toBeVisible();
    await page.getByRole("dialog", { name: "课程导航" }).getByRole("button", { name: "关闭" }).click();
    await page.getByTestId("rail-fab").click();
    await expect(page.getByRole("dialog", { name: "辅助面板" }).getByTestId("tutor-panel")).toBeVisible();
  });

  const units = LESSON_ID_LIST.filter((id) => id !== "ce-amplifier").map((id) => `/learn/${id}`);
  for (const path of ["/", "/learn", "/learn/ce-amplifier", "/lab", "/lab/ce-amplifier", "/practice", "/mistakes", "/progress", "/formulas", "/graph", "/notation", ...units]) {
    test(`${path} 在手机宽度下无横向溢出`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(1);
    });
  }
});
