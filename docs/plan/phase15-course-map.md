# PM Methods Interactive Course

## Outcome

The site reads as one course rather than thirteen pages. The landing page
is a course map with chapter intros, a live thumbnail per lesson, progress and
a resume button; lessons link forward and back with route transitions; a
keyboard shortcuts dialog exists; every page has metadata, Open Graph images
and a sitemap. The `coming-soon` component is deleted.

## Step-by-step

1. **Course map** `src/components/site/course-map.tsx` (client) rendered by
   `src/app/page.tsx`:
   - Hero: one line ("Thirteen ways to finish sooner."), one sub-line (each
     method is one idea, one interactive model, about ten minutes), and a
     Continue button that links to `lastVisited()` (hidden until mounted or
     when nothing is stored) next to a progress ring `n / 13`.
   - Five chapter sections with numeral, title and blurb (from `CHAPTERS`),
     each a grid of lesson cards: number, title, tagline, `improves` tag, the
     scenario line, a completed tick in `ok`, and the lesson's `Thumbnail`
     (static SVG, 4:3, rendered at 160 px wide, `aria-hidden`).
   - Cards are `Link` around `motion.div` with `whileHover={{ y: -2 }}` and a
     25 ms mount stagger; thumbnails use the same tokens as the scenes.
   - A "How it works" strip: engine → scene → beats, three short lines.

2. **Lesson navigation** in the shell:
   - Top: a slim progress rail of 13 ticks (`layoutId` indicator on the current
     lesson) linking to each lesson.
   - Bottom of the last beat: "Next: n · Title" and "Back to the map".
   - Shortcuts: `n` / `p` next and previous lesson, `?` opens the shortcuts
     dialog (`src/components/site/shortcuts-dialog.tsx`, native `<dialog>`,
     `AnimatePresence` fade, `Esc` closes).

3. **Route transitions.** Wrap the shell's left column and scene panel in
   React's `ViewTransition` with a named class and 200 ms crossfade CSS in
   `globals.css` (`::view-transition-old(.lesson)` / `::view-transition-new(.lesson)`).
   Read `node_modules/next/dist/docs/01-app/02-guides/view-transitions.md`
   first. Verify Motion animations and the view transition do not both run on
   the same element during navigation; browsers without the API simply swap.

4. **Metadata.** `metadataBase` from `NEXT_PUBLIC_SITE_URL` with a localhost
   fallback; `src/app/opengraph-image.tsx` (site) and
   `src/app/learn/[slug]/opengraph-image.tsx` (number, title, tagline, chapter)
   with `ImageResponse`; `src/app/sitemap.ts` from `LESSONS`;
   `src/app/icon.svg` replacing the template favicon; `src/app/robots.ts`.

5. **Delete** `src/components/lesson/coming-soon.tsx` and its registry
   fallback; the registry must be `Record<Slug, ComponentType>` with all 13
   real modules.

6. **Verify** the map on 375 px, 768 px and 1280 px; Continue appears only
   after a lesson visit; progress ring matches completed checks; navigation
   by `n` / `p` crossfades in Chromium and swaps without animation in a browser
   with the View Transitions API disabled.

7. Commit (`feat: course map, lesson navigation, metadata`) and push.

## Acceptance criteria

- [ ] AC1: `/` shows 5 chapters and 13 cards with thumbnails, in registry order; every card links to its lesson; no card uses the coming-soon fallback.
- [ ] AC2: After visiting `/learn/pert` and reloading `/`, Continue points at `/learn/pert` and the ring shows the number of completed checks.
- [ ] AC3: `n` and `p` navigate between lessons in registry order with a crossfade in Chromium; `?` opens and `Esc` closes the shortcuts dialog with focus returned to the trigger.
- [ ] AC4: `/opengraph-image` and `/learn/cpm/opengraph-image` return 1200 × 630 PNGs; `/sitemap.xml` lists 14 URLs; `/robots.txt` allows all.
- [ ] AC5: Lighthouse mobile on `/` scores at least 95 performance and 100 accessibility; CLS is 0.
- [ ] AC6: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` pass and the build lists 13 lesson routes plus their Open Graph routes.
