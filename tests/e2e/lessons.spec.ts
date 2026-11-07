import { test as base, expect, type ConsoleMessage, type Page } from "@playwright/test";
import { LESSONS, nextLesson } from "@/content/meta";
import type { Beat, Lesson, Slug } from "@/content/types";
import { lesson as cpm } from "@/content/lessons/cpm";
import { lesson as pert } from "@/content/lessons/pert";
import { lesson as monteCarlo } from "@/content/lessons/monte-carlo";
import { lesson as fastTracking } from "@/content/lessons/fast-tracking";
import { lesson as crashing } from "@/content/lessons/crashing";
import { lesson as dsm } from "@/content/lessons/dsm";
import { lesson as resourceLeveling } from "@/content/lessons/resource-leveling";
import { lesson as rcpsp } from "@/content/lessons/rcpsp";
import { lesson as criticalChain } from "@/content/lessons/critical-chain";
import { lesson as toc } from "@/content/lessons/toc";
import { lesson as dbr } from "@/content/lessons/dbr";
import { lesson as kanban } from "@/content/lessons/kanban";
import { lesson as vsm } from "@/content/lessons/vsm";

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

// Static imports: a lesson loaded through `import()` resolves its own `@/` imports outside
// Playwright's TypeScript path mapping and fails to load.
const LESSON_MODULES: Record<Slug, Lesson> = {
  cpm,
  pert,
  "monte-carlo": monteCarlo,
  "fast-tracking": fastTracking,
  crashing,
  dsm,
  "resource-leveling": resourceLeveling,
  rcpsp,
  "critical-chain": criticalChain,
  toc,
  dbr,
  kanban,
  vsm,
};

function loadLesson(slug: Slug): Lesson {
  return LESSON_MODULES[slug];
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

/** Returns focus to the page so the shell's arrow keys are not swallowed by a control. */
async function blurActive(page: Page) {
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
}

/**
 * Exercises the beat's teaching primitives: opens its why, answers its predict, and
 * hovers every spotlight term, checking that each lights the scene and then clears.
 */
async function exerciseBeat(page: Page, beat: Beat) {
  const article = page.locator("article");
  const model = page.locator('section[aria-label="Interactive model"]:visible');

  const why = article.getByRole("button", { name: "Why?", exact: true });
  await expect(why, `${beat.id}: why`).toHaveCount(beat.why ? 1 : 0);
  if (beat.why) {
    await why.click();
    await expect(why).toHaveAttribute("aria-expanded", "true");
  }

  const predict = article.locator("fieldset:visible", {
    has: page.locator("legend", { hasText: /^Predict$/ }),
  });
  await expect(predict, `${beat.id}: predict`).toHaveCount(beat.predict ? 1 : 0);
  if (beat.predict) {
    const { options, answer } = beat.predict;
    await predict.getByRole("radio", { name: options[answer], exact: true }).check();
    await expect(predict.getByText("Right.")).toBeVisible();
  }
  await blurActive(page);

  const ids = await article
    .locator("button[data-term]:visible")
    .evaluateAll((els) => els.map((el) => el.getAttribute("data-term")!));
  const scene = model.locator("[data-scene]");
  for (const id of ids) {
    await article.locator(`button[data-term="${id}"]:visible`).first().hover();
    // Not `:visible`: a lit horizontal stroke has a zero-height box, which Playwright calls hidden.
    await expect
      .poll(
        () =>
          model.locator(`[data-spot~="${id}"][data-lit]`).evaluateAll((els) =>
            els.some((el) => {
              const box = el.getBoundingClientRect();
              return (box.width > 0 || box.height > 0) && getComputedStyle(el).visibility !== "hidden";
            }),
          ),
        { message: `${beat.id}: term "${id}" lights the scene` },
      )
      .toBe(true);
    await page.mouse.move(1, 1);
    await expect(scene, `${beat.id}: term "${id}" clears`).not.toHaveAttribute("data-spotlight");
  }
  return ids.length;
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
    const { beats, check, recap } = loadLesson(meta.slug);
    await open(page, `/learn/${meta.slug}`);

    const scene = page.locator("[data-scene]:visible");
    await expect(scene).toHaveCount(1);
    await expect(scene).toHaveAttribute("aria-label", /\S/);

    const title = page.locator("article h2:visible");
    const counter = page.locator("article p:visible", { hasText: /^Step \d+ of \d+$/ });
    await expect(counter).toHaveText(/^Step 1 of \d+$/);
    const total = Number((await counter.textContent())!.match(/of (\d+)/)![1]);
    expect(total).toBeGreaterThan(1);

    expect(total).toBe(beats.length);

    let terms = 0;
    for (let step = 1; step <= total; step++) {
      if (step > 1) {
        const previous = (await title.textContent())!;
        await page.keyboard.press("ArrowRight");
        await expect(counter).toHaveText(`Step ${step} of ${total}`);
        await expect(title).not.toHaveText(previous);
        await expect(scene).toHaveAttribute("aria-label", /\S/);
      }
      terms += await exerciseBeat(page, beats[step - 1]);
    }
    test.info().annotations.push({ type: "terms", description: `hovered ${terms} terms` });

    const steps = page.getByRole("list", { name: "How to apply the method" }).locator("li");
    const count = await steps.count();
    expect(count).toBeGreaterThanOrEqual(3);
    expect(count).toBeLessThanOrEqual(6);
    const target = beats.findIndex((b) => b.id === recap[0].beat) + 1;
    await steps.first().getByRole("button").click();
    await expect(counter).toHaveText(`Step ${target} of ${total}`);
    await page.locator(`nav[aria-label="Lesson steps"] button[aria-label^="Step ${total}:"]`).click();
    await expect(counter).toHaveText(`Step ${total} of ${total}`);
    await blurActive(page);

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
