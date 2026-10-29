import { test as base, expect, type ConsoleMessage, type Page } from "@playwright/test";
import { LESSONS, nextLesson } from "@/content/meta";
import type { Lesson, Slug } from "@/content/types";

/** The site ships `icon.svg`, but browsers still probe this URL and log its 404. */
const FAVICON = "/favicon.ico";

/** Fails the test on any console error or warning, or an uncaught page error. */
const test = base.extend<{ allowedConsoleUrls: string[]; consoleGuard: void }>({
  allowedConsoleUrls: [[], { option: true }],
  consoleGuard: [
    async ({ page, baseURL, allowedConsoleUrls }, use) => {
      const allowed = new Set([FAVICON, ...allowedConsoleUrls].map((p) => new URL(p, baseURL).href));
      const problems: string[] = [];
      page.on("console", (msg: ConsoleMessage) => {
        if (msg.type() !== "error" && msg.type() !== "warning") return;
        if (allowed.has(msg.location().url)) return;
        problems.push(`[${msg.type()}] ${msg.text()} (${msg.location().url})`);
      });
      page.on("pageerror", (error) => problems.push(`[pageerror] ${error.message}`));
      await use();
      expect(problems, "console errors or warnings").toEqual([]);
    },
    { auto: true },
  ],
});

async function loadLesson(slug: Slug): Promise<Lesson> {
  const mod = (await import(`../../src/content/lessons/${slug}`)) as { lesson: Lesson };
  return mod.lesson;
}

async function open(page: Page, path: string) {
  const response = await page.goto(path);
  await page.waitForLoadState("networkidle");
  return response;
}

/** Changes the first visible slider, segmented radio or switch in the scene's panel. */
async function operateControl(page: Page): Promise<boolean> {
  const panel = page.locator('section[aria-label="Interactive model"]:visible');
  const control = panel
    .locator('input[type="range"]:visible, [role="radio"]:visible, [role="switch"]:visible')
    .first();
  if ((await control.count()) === 0) return false;

  if ((await control.getAttribute("type")) === "range") {
    const before = await control.inputValue();
    const atMax = before === (await control.getAttribute("max"));
    await control.focus();
    await control.press(atMax ? "Home" : "End");
    await expect(control).not.toHaveValue(before);
  } else if ((await control.getAttribute("role")) === "switch") {
    const before = await control.getAttribute("aria-checked");
    await control.click();
    await expect(control).not.toHaveAttribute("aria-checked", before ?? "");
  } else {
    const radios = panel.locator('[role="radio"]:visible');
    const states = await radios.evaluateAll((els) => els.map((el) => el.getAttribute("aria-checked")));
    // Pin by index: a locator filtered on aria-checked="false" would re-resolve after the click.
    const radio = radios.nth(states.indexOf("false"));
    await radio.click();
    await expect(radio).toHaveAttribute("aria-checked", "true");
  }
  // Return focus to the page so the shell's arrow keys are not swallowed by the control.
  await control.blur();
  return true;
}

test("home lists all 13 lessons", async ({ page }) => {
  await open(page, "/");
  await expect(page.locator('main section ul > li > a[href^="/learn/"]')).toHaveCount(13);
});

test.describe("unknown lesson", () => {
  test.use({ allowedConsoleUrls: ["/learn/nope"] });

  test("returns 404", async ({ page }) => {
    const response = await open(page, "/learn/nope");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "That page is not part of the course." })).toBeVisible();
  });
});

test("n moves to the next lesson", async ({ page }) => {
  const [first, second] = LESSONS;
  await open(page, `/learn/${first.slug}`);
  await expect(page.locator("h1:visible")).toContainText(first.title);
  await page.keyboard.press("n");
  // Client navigation fetches the next route first; `next dev` may compile it on demand.
  await expect(page).toHaveURL(new RegExp(`/learn/${second.slug}$`), { timeout: 15_000 });
  await expect(page.locator("h1:visible")).toContainText(`Lesson ${second.number} · ${second.title}`);
});

for (const meta of LESSONS) {
  test(`lesson ${meta.number}: ${meta.slug}`, async ({ page }) => {
    const { check } = await loadLesson(meta.slug);
    await open(page, `/learn/${meta.slug}`);

    const scene = page.locator("[data-scene]:visible");
    await expect(scene).toHaveCount(1);
    await expect(scene).toHaveAttribute("aria-label", /\S/);

    const title = page.locator("article h2:visible");
    const counter = page.locator("article p:visible", { hasText: /^Step \d+ of \d+$/ });
    await expect(counter).toHaveText(/^Step 1 of \d+$/);
    const total = Number((await counter.textContent())!.match(/of (\d+)/)![1]);
    expect(total).toBeGreaterThan(1);

    for (let step = 2; step <= total; step++) {
      const previous = (await title.textContent())!;
      await page.keyboard.press("ArrowRight");
      await expect(counter).toHaveText(`Step ${step} of ${total}`);
      await expect(title).not.toHaveText(previous);
      await expect(scene).toHaveAttribute("aria-label", /\S/);
    }

    const operated = await operateControl(page);
    test.info().annotations.push({
      type: "control",
      description: operated ? "operated a control on the final beat" : "final beat has no control",
    });

    const card = page.locator("fieldset:visible", { hasText: check.question });
    await card.getByRole("radio", { name: check.options[check.answer], exact: true }).check();
    await expect(card.getByText("Correct.")).toBeVisible();
    await expect(card.getByText("✓ completed")).toBeVisible();

    const nextLink = page.locator("a:visible", { hasText: /^Next: / });
    const next = nextLesson(meta.slug);
    if (next) {
      await expect(nextLink).toHaveText(`Next: ${next.number} · ${next.title} →`);
      await expect(nextLink).toHaveAttribute("href", `/learn/${next.slug}`);
    } else {
      await expect(nextLink).toHaveCount(0);
    }
  });
}
