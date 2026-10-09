import { chromium } from "@playwright/test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
const browser = await chromium.launch({ headless: true });
try {
  for (const mode of ["desktop", "mobile", "reduced"]) {
    const context = await browser.newContext({
      viewport: { width: mode === "mobile" ? 390 : 1280, height: 800 },
      reducedMotion: mode === "reduced" ? "reduce" : "no-preference",
      hasTouch: mode === "mobile",
      isMobile: mode === "mobile",
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setContent(
      `<html data-motion="on"><head><style>html{scroll-behavior:smooth}body{margin:0}#target{margin-top:1800px}textarea{height:80px}</style></head><body><main><h1 id="hero-title">Turn complexity <span style="color:green">into clarity.</span></h1><a href="#target">Jump</a><textarea>${"Notes\n".repeat(60)}</textarea><nav id="mobile-nav" hidden>Menu</nav><dialog>Dialog</dialog><section id="target">Target</section><div style="height:900px"></div></main></body></html>`,
    );
    await page.addStyleTag({
      path: fileURLToPath(
        new URL("../public/runtime/polish.css", import.meta.url),
      ),
    });
    await page.addScriptTag({
      path: fileURLToPath(
        new URL("../public/runtime/enhancements.js", import.meta.url),
      ),
    });
    await page.waitForTimeout(700);
    assert.equal(
      await page.locator("h1").innerText(),
      "Turn complexity into clarity.",
    );
    assert.equal(
      await page
        .locator("h1 > span[style]")
        .evaluate((el) => getComputedStyle(el).color),
      "rgb(0, 128, 0)",
    );
    if (mode === "desktop") {
      assert.equal(await page.getByRole('heading', { name: 'Turn complexity into clarity.', exact: true }).count(), 1);
      assert.equal(
        await page
          .locator("html")
          .evaluate((el) => el.classList.contains("lenis")),
        true,
      );
      assert.ok((await page.locator("[data-react-bits-heading]").count()) > 0);
      await page.locator("textarea").hover();
      await page.mouse.wheel(0, 350);
      await page.waitForTimeout(150);
      assert.ok(
        (await page.locator("textarea").evaluate((el) => el.scrollTop)) > 0,
      );
      assert.equal(await page.evaluate(() => scrollY), 0);
      await page.evaluate(() => document.querySelector("dialog").showModal());
      await page.waitForTimeout(50);
      assert.equal(
        await page
          .locator("html")
          .evaluate((el) => el.classList.contains("lenis-stopped")),
        true,
      );
      await page.evaluate(() => document.querySelector("dialog").close());
      await page.waitForTimeout(50);
      assert.equal(
        await page
          .locator("html")
          .evaluate((el) => el.classList.contains("lenis-stopped")),
        false,
      );
      await page.getByText("Jump", { exact: true }).click();
      await page.waitForTimeout(1100);
      assert.ok((await page.evaluate(() => scrollY)) > 1500);
    } else
      assert.equal(
        await page
          .locator("html")
          .evaluate((el) => el.classList.contains("lenis")),
        false,
      );
    await page.evaluate(
      () => (document.documentElement.dataset.motion = "off"),
    );
    await page.waitForTimeout(100);
    assert.equal(
      await page
        .locator("html")
        .evaluate((el) => el.classList.contains("lenis")),
      false,
    );
    assert.equal(await page.locator("[data-react-bits-heading]").count(), 0);
    assert.equal(
      await page.locator("h1").innerText(),
      "Turn complexity into clarity.",
    );
    assert.deepEqual(errors, []);
    console.log(`${mode}: heading, scrolling and motion controls passed`);
    await context.close();
  }
} finally {
  await browser.close();
}
