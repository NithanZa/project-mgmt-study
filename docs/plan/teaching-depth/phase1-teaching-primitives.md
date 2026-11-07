# Teaching Depth

## Outcome

The lesson shell gains four shared teaching primitives that every later phase
uses to explain a method more carefully without adding walls of text. After
this phase they exist, are wired into `LessonShell`, are covered by a content
test, and no lesson uses them yet (every lesson still renders exactly as
before).

1. **Spotlight terms.** `<Term id="x">word</Term>` in beat copy is a
   hoverable, focusable, tappable word. While it is active the scene can read
   `useSpotlight()` (returns `"x"`) and light the matching element; every other
   tagged element dims. Copy stays short because a term points at the picture
   instead of describing it.
2. **Predict prompts.** `beat.predict` renders a small card under the body that
   asks the learner to guess before they act or see the result, then reveals
   the answer with a one-clause why.
3. **Why disclosures.** `beat.why` renders a "Why?" toggle under the body that
   reveals the mechanism in at most two sentences / forty words.
4. **Method recap.** `lesson.recap` renders, on the last beat, a numbered
   "do it yourself" list; each step jumps to the beat that showed it.

Rules for later phases (also added to the README quality bar in phase 7):

- A `Term` id must map to at least one element with `data-spot="<id>"` in the
  scene on that beat.
- A predict sits before the learner acts; its answer is not stated in the body
  of the same beat. At most three predicts per lesson.
- A why is at most two sentences and forty words and states a mechanism, never
  a restatement of the body.
- A recap has three to six steps, each at most twelve words, each pointing at
  an existing beat id.
- Every beat still has exactly one focal change; a new beat brings its own.

Dependencies were installed with `pnpm install --frozen-lockfile` during
planning; every phase assumes `node_modules` is present.

## Step-by-step

0. **Baseline.** Confirm `pnpm lint`, `pnpm typecheck`, `pnpm test` and
   `pnpm build` pass on the untouched tree before changing anything. If
   `next typegen` complains, run `pnpm build` once first (it writes
   `next-env.d.ts`).

1. **Content types** in `src/content/types.ts`. Add:
   ```ts
   export interface Predict {
     prompt: string;
     options: string[]; // 2 or 3
     answer: number;
     why: string; // one clause
   }
   export interface RecapStep {
     step: string; // at most 12 words
     beat: string; // a Beat id in this lesson
   }
   ```
   Extend `Beat` with `why?: ReactNode` and `predict?: Predict`. Extend
   `Lesson` with `recap?: RecapStep[]`.

2. **Spotlight context** `src/components/lesson/spotlight.tsx` (`"use client"`):
   - `SpotlightProvider({ children })` holds `useState<string | null>` and
     provides two contexts: the value and the setter.
   - `useSpotlight(): string | null`.
   - `useSetSpotlight(): (id: string | null) => void`.
   - `useSpot(id: string): { "data-spot": string; "data-lit"?: "" }` returns
     attributes to spread on a scene element: always `data-spot={id}`, and
     `data-lit` when the current spotlight equals `id`. Scenes may tag several
     elements with the same id.
   - `useSpots(ids: string[])` is the same for an element that answers to
     several terms: `data-spot` is the ids joined by spaces and `data-lit` is
     set when the current spotlight is any of them. The CSS in step 3 only
     tests for the presence of `data-spot` and `data-lit`, so no selector
     change is needed.

3. **Spotlight styling** in `src/app/globals.css`, after the `@utility hatch`
   block:
   ```css
   /* Spotlight: while a copy term is active the scene dims every tagged
      element except the lit one. Opacity only, 180 ms, off under reduced
      motion. */
   [data-scene][data-spotlight] [data-spot] {
     transition: opacity 180ms ease-out;
   }
   [data-scene][data-spotlight] [data-spot]:not([data-lit]) {
     opacity: 0.3;
   }
   [data-scene][data-spotlight] [data-lit] {
     animation: spot-pulse 600ms ease-out 1;
   }
   @keyframes spot-pulse {
     from { opacity: 0.35; }
     to { opacity: 1; }
   }
   @media (prefers-reduced-motion: reduce) {
     [data-scene][data-spotlight] [data-spot] { transition: none; }
     [data-scene][data-spotlight] [data-lit] { animation: none; }
   }
   ```
   In `src/components/lesson/scene-frame.tsx`, read `useSpotlight()` and set
   `data-spotlight={spot ?? undefined}` on the `[data-scene]` div. Nothing else
   in SceneFrame changes.

4. **`Term`** `src/components/lesson/term.tsx` (`"use client"`):
   - Props `{ id: string; children: ReactNode }`.
   - Renders `<button type="button" data-term={id} aria-pressed={active}>`
     styled as inline text: `inline cursor-help rounded-sm text-fg underline
     decoration-accent/60 decoration-dotted underline-offset-4 hover:decoration-accent
     focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent
     aria-pressed:decoration-accent aria-pressed:decoration-solid`.
     Font inherits from the body; no padding, so the sentence does not reflow.
   - `onPointerEnter` sets the spotlight to `id`; `onPointerLeave` clears it if
     it is still `id`; `onFocus` / `onBlur` do the same; `onClick` toggles
     (touch devices have no hover).
   - The Prev/Next arrow keys in `LessonShell` must still work while a term is
     focused: a `<button>` is not matched by `isEditable`, so nothing to do.

5. **`Readout` spotlight prop** in `src/components/ui/readout.tsx`: add
   `spot?: string`. When given, spread `useSpot(spot)` on the root div. The
   root must therefore render inside `SpotlightProvider`; readouts always do.

6. **`PredictCard`** `src/components/lesson/predict-card.tsx` (`"use client"`):
   - Props `{ predict: Predict }`. Local `picked` state; the shell remounts it
     per beat with `key={beat.id}`.
   - Markup mirrors `check-card.tsx`: a `fieldset` with legend "Predict" (small
     uppercase, muted), the prompt as `<p id>`, a `radiogroup` of options.
     Border is `border-dashed border-line` so it reads as lighter than the
     Check.
   - After a pick, reveal in an `aria-live="polite"` block: on the correct
     option "Right." in `text-ok`, otherwise "Not quite." in `text-constraint`;
     both followed by `predict.why` and both mark the correct option with a
     check glyph (a predict is low stakes, so the answer is always shown).
     Options become `disabled` after the pick. The reveal fades in with `FADE`.
   - Nothing is written to the progress store.

7. **`WhyDisclosure`** `src/components/lesson/why-disclosure.tsx`
   (`"use client"`):
   - Props `{ children: ReactNode }`. Local `open` state; remounted per beat by
     the shell.
   - A `<button type="button" aria-expanded aria-controls>` labelled "Why?"
     with a triangle glyph that rotates when open (transform only), styled as
     a small muted text button. Below it `<div id>` with the children, shown
     with `AnimatePresence` + opacity `FADE` (no height animation).

8. **`MethodRecap`** `src/components/lesson/method-recap.tsx` (`"use client"`):
   - Props `{ steps: RecapStep[]; beats: Beat[]; onJump: (index: number) => void }`.
   - An `<ol aria-label="How to apply the method">` inside a bordered panel
     with the legend-style label "The method in {n} steps". Each `<li>` shows
     the step number, the text, and a ghost-styled `button` "step N"
     (`aria-label="Go to step N: {beat title}"`) that calls `onJump` with the
     beat's index (`beats.findIndex((b) => b.id === step.beat)`).

9. **Shell integration** in `src/components/lesson/lesson-shell.tsx`:
   - Wrap everything the component returns in `<SpotlightProvider>`; the
     provider must be above both the `<Scene>` and the article.
   - Clear the spotlight whenever `index` changes (a `useEffect` in a small
     inner component that has access to `useSetSpotlight`, or lift the shell
     body into `LessonShellInner`).
   - Under `beat.body`, render `{beat.why && <WhyDisclosure key={beat.id}>{beat.why}</WhyDisclosure>}`
     and then `{beat.predict && <PredictCard key={beat.id} predict={beat.predict} />}`.
     Both live inside the `AnimatePresence` motion block so they fade with the
     beat.
   - On the last beat, render `<MethodRecap>` above `<CheckCard>` when
     `lesson.recap` exists; `onJump` calls `setBeat(meta.slug, i)`.
   - The `min-h-36` body container may grow; keep it `min-h-36`, not a fixed
     height.

10. **Content test** `src/content/teaching.test.ts` (Vitest, node
    environment). For every slug in `LESSONS`, dynamically import
    `./lessons/<slug>` and read `lesson`. Use `renderToStaticMarkup` from
    `react-dom/server` to turn a `ReactNode` into text (strip tags, collapse
    whitespace). Assert:
    - every beat body is at most 40 words;
    - every `why` is at most 40 words;
    - every `predict` has 2 or 3 options and `answer` in range, and its
      `why` is non-empty;
    - every recap, when present, has 3 to 6 steps, each at most 12 words,
      each `beat` matching a beat id of that lesson;
    - every `Term` id used in a beat's `body` or `why` is a non-empty
      kebab-case string (walk the React element tree: `props.children`
      recursively; an element whose `type === Term` contributes `props.id`).
    Put the helpers `textOf(node)`, `wordCount(node)` and `termIds(node)` in
    `src/content/teaching.ts` so the e2e test can reuse them in phase 7.
    If a lesson module cannot be imported under Vitest's node environment,
    fix the import rather than adding jsdom; the Playwright suite already
    imports these modules in node.

11. **Verify.** `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`.
    Open `/learn/dsm` and `/learn/cpm` with `pnpm dev` and confirm nothing
    visual changed (no lesson uses the primitives yet).

## Acceptance criteria

- [x] AC1: `Beat` has optional `why` and `predict`, `Lesson` has optional `recap`, and the `Predict` and `RecapStep` types exist in `src/content/types.ts`.
- [x] AC2: `src/components/lesson/spotlight.tsx` exports `SpotlightProvider`, `useSpotlight`, `useSetSpotlight` and `useSpot`; `SceneFrame` sets `data-spotlight` on `[data-scene]` while a spotlight is active; the CSS in `globals.css` dims `[data-spot]` elements that are not `[data-lit]`.
- [x] AC3: `src/components/lesson/term.tsx` renders a `button[data-term]` that sets the spotlight on hover, focus and click, and clears it on leave and blur.
- [x] AC4: `PredictCard`, `WhyDisclosure` and `MethodRecap` exist under `src/components/lesson/` and `LessonShell` renders them from `beat.why`, `beat.predict` and `lesson.recap`; the spotlight is cleared on every beat change.
- [x] AC5: `Readout` accepts `spot` and renders `data-spot` (and `data-lit` when active).
- [x] AC6: `src/content/teaching.test.ts` runs under `pnpm test`, imports all 13 lessons, and enforces the word limits, predict shape, recap shape and `Term` id shape.
- [x] AC7: `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build` pass, and every lesson renders exactly as before.
