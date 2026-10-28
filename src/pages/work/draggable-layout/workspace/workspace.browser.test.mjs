import assert from "node:assert/strict";
import { createRequire } from "node:module";
import test from "node:test";

// Requires a running Vite server and a Playwright installation. An existing
// installation can be supplied through PLAYWRIGHT_MODULE_PATH without adding
// a browser dependency to the application. LAYOUT_TEST_URL overrides the URL.
const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || "playwright"));
} catch (error) {
  if (error.code !== "MODULE_NOT_FOUND") throw error;
}
const url = process.env.LAYOUT_TEST_URL || "http://127.0.0.1:5173/portfolio/#/work/layout";

test(
  "Workspace preserves state across widget unmounts and breakpoint remounts",
  {
    skip:
      !chromium && "Playwright is optional; set PLAYWRIGHT_MODULE_PATH to run browser regressions",
  },
  async (t) => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
    const errors = [];
    page.on("pageerror", (error) => {
      errors.push(error.message);
    });
    const button = (name) => page.getByRole("button", { name, exact: true });
    const undo = () => page.getByRole("button", { name: /^Undo/ });
    async function columns(width, count) {
      await page.setViewportSize({ width, height: 1100 });
      await page.waitForFunction(
        (count) =>
          document.querySelector(".column-count")?.textContent.includes(`${count} COLUMNS`),
        count,
      );
      await page.waitForTimeout(250);
    }
    async function resizeCamera(delta) {
      const handle = page.locator(".widget-cameras .react-resizable-handle");
      await handle.scrollIntoViewIfNeeded();
      await page.waitForTimeout(250);
      const box = await handle.boundingBox();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + delta, { steps: 12 });
      await page.mouse.up();
      await page.waitForTimeout(250);
    }
    const cameraHeight = () =>
      page.locator(".widget-cameras").evaluate((el) => el.getBoundingClientRect().height);
    try {
      await page.goto(url);
      await page.locator(".camera-feed").first().waitFor();
      await t.test(
        "camera presets, feedback, memo draft, filter and logs survive removing widgets",
        async () => {
          await page.locator(".camera-feed").first().click();
          await page.keyboard.down("w");
          await page.keyboard.up("w");
          await page.locator(".preset-grid button").first().click();
          await button("선택 슬롯에 저장").click();
          await button("녹화 시작").click();
          await page.getByRole("textbox", { name: "녹화 메모" }).fill("보존할 메모 초안");
          await button("잘했어요").click();
          await button("녹화 중단").click();
          const title = page.getByRole("textbox", { name: "제목", exact: true });
          await title.waitFor();
          assert.equal(
            await title.evaluate((el) => el.selectionEnd - el.selectionStart),
            (await title.inputValue()).length,
          );
          await button("제목 저장").click();
          await page.getByRole("tab", { name: "PTZ", exact: true }).click();
          const logCount = await page.locator(".event-entry").count();
          await button("레이아웃 수정하기").click();
          for (const name of ["카메라 컨트롤러", "메모", "이벤트 히스토리"])
            await button(`${name} 위젯 삭제`).click();
          for (const name of ["카메라 컨트롤러", "메모", "이벤트 히스토리"])
            await button(`+ ${name}`).click();
          await button("저장").click();
          assert.equal(
            await page.getByRole("textbox", { name: "녹화 메모" }).inputValue(),
            "보존할 메모 초안",
          );
          assert.equal(
            await page.getByRole("tab", { name: "PTZ", exact: true }).getAttribute("aria-selected"),
            "true",
          );
          assert.equal(await page.locator(".event-entry").count(), logCount);
          assert.match(await page.locator(".preset-grid button").first().textContent(), /저장됨/);
          assert.match(await page.locator(".camera-feed").first().textContent(), /프리셋 1 · 저장/);
          assert.equal(await button("위").isDisabled(), false);
        },
      );
      await t.test(
        "breakpoint changes stop PTZ, preserve shared state and reset local slot selection",
        async () => {
          await page.locator(".preset-grid button").first().click();
          await page.locator(".camera-feed").first().click();
          await page.keyboard.down("e");
          await columns(980, 6);
          await page.keyboard.up("e");
          assert.match(await page.locator(".camera-feed").first().textContent(), /줌인 · 종료/);
          assert.equal(await page.locator(".preset-grid button[aria-pressed='true']").count(), 0);
          assert.match(await page.locator(".preset-grid button").first().textContent(), /저장됨/);
          assert.equal(
            await page.getByRole("textbox", { name: "녹화 메모" }).inputValue(),
            "보존할 메모 초안",
          );
          await columns(1440, 8);
        },
      );
      await t.test(
        "breakpoint geometry and edit history survive round trips, undo, redo and cancel",
        async () => {
          await button("레이아웃 수정하기").click();
          await page.getByLabel("영상 개수").selectOption("6");
          await resizeCamera(80);
          const desktop = await cameraHeight();
          assert.equal(await undo().textContent(), "Undo (2)");
          await columns(980, 6);
          const originalMedium = await cameraHeight();
          await resizeCamera(40);
          const medium = await cameraHeight();
          assert.ok(medium > originalMedium);
          assert.equal(await undo().textContent(), "Undo (3)");
          await columns(480, 4);
          assert.equal(await undo().textContent(), "Undo (3)");
          await columns(1440, 8);
          assert.equal(await cameraHeight(), desktop);
          await undo().click();
          await columns(980, 6);
          assert.equal(await cameraHeight(), originalMedium);
          await page.getByRole("button", { name: /^Redo/ }).click();
          await page.waitForTimeout(250);
          assert.equal(await cameraHeight(), medium);
          await button("취소").click();
          assert.equal(await page.locator(".camera-feed").count(), 4);
          await page.waitForFunction(
            (height) =>
              document.querySelector(".widget-cameras")?.getBoundingClientRect().height === height,
            originalMedium,
          );
          assert.equal(await cameraHeight(), originalMedium);
        },
      );
      assert.deepEqual(errors, []);
    } finally {
      await browser.close();
    }
  },
);
