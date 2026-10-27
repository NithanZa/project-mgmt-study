# PM Methods Interactive Course

## Outcome

Lesson 11, Drum-Buffer-Rope, is complete at `/learn/dbr`. The learner runs a
machine shop where welding is the constraint, replaces push with a rope tied to
the drum, and then sizes the buffer in front of the drum so a noisy feed never
starves it. Insight: schedule the whole line to the constraint's beat, protect
the constraint with a buffer, and release work only as the constraint consumes
it.

Scenario (per day, 60 days). Cut 6, Weld 3 (drum), Paint 5; orders 5 per day.
Verified with the shared line simulator (means over seeds 1 to 8 where
variability is on):

| configuration                     | throughput | cycle time | WIP | weld busy |
| --------------------------------- | ---------- | ---------- | --- | --------- |
| push, no variability              | 3.0        | 15.8       | 80  | 97%       |
| drum, buffer 6, no variability    | 3.0        | 3.0        | 9   | 97%       |
| drum, buffer 6, variability 1.0   | 2.17       | 4.0        | 8.7 | 71%       |
| drum, buffer 9, variability 1.0   | 2.76       | 4.6        | 12.6 | 89%      |
| drum, buffer 12, variability 1.0  | 2.95       | 5.4        | 16.0 | 94%      |
| drum, buffer 15, variability 1.0  | 2.99       | 6.3        | 19.1 | 96%      |
| drum, buffer 18, variability 1.0  | 3.0        | 7.3        | 22.1 | 96%      |
| drum, buffer 6, variability 0.5   | 2.68       | 3.3        | 8.7 | 86%       |
| drum, buffer 9, variability 0.5   | 2.98       | 4.0        | 12.0 | 96%      |

Every three extra buffer units cost about one day of cycle time; past 12 the
drum gains almost nothing.

## Step-by-step

1. **Engine** `src/engine/dbr/`: `fixture.ts` (`SHOP` stations, `ORDERS = 5`,
   `DAYS = 60`), `config.ts` (`push()`, `drum(bufferTarget, variability)`),
   `sweep.ts` (`bufferSweep(variability, seeds = 8): { bufferTarget; throughput; cycleTime; drumUtilization }[]`
   for targets 3 to 18, memoised), `dbr.test.ts` asserting the table within
   ±0.05 on utilisation and ±0.1 on throughput for the 8-seed means, and that
   seed 1 alone gives utilisation below 0.8 at buffer 6 and above 0.9 at 12
   with variability 1.0.

2. **Scene** `src/scenes/dbr/`:
   - `shop.tsx`: three station tiles; the weld tile has a pulsing ring that
     beats once per processed item (a `motion.div` scale pulse driven by the
     tick); queue chips before each station; a release gate at the left.
   - `rope.tsx`: an SVG line from the drum back to the gate that draws itself
     (`pathLength` 0 to 1) when the rope is switched on; the gate shows
     "release n" each tick.
   - `buffer-gauge.tsx`: a vertical gauge next to the weld queue showing items
     in the buffer against the target; it flashes `constraint` on a tick where
     the drum had capacity but nothing to do (starvation).
   - `sweep-chart.tsx`: two lines against buffer target: drum utilisation and
     cycle time; the current target highlighted.
   - `scene.tsx`: simulation in `useMemo`; playback as in the TOC lesson.
     Readouts: "Throughput", "Weld busy", "Cycle time", "WIP". Controls:
     release `Segmented` push / drum (beat 2), variability slider 0 to 1 step
     0.1 (beats 3 to 5), buffer target slider 3 to 18 (beats 3 to 5), Reset.
   - `thumbnail.tsx`: static shop with the rope drawn.

3. **Beats** in `src/content/lessons/dbr.tsx`:
   1. *Without a rope, the pile before the drum grows forever.* Push playback;
      weld queue passes 100; cycle time 16 days.
   2. *The drum sets the beat; the rope releases what it consumed.* Switch to
      drum with buffer 6: the rope draws, WIP settles at 9, cycle time 3.
   3. *A noisy feed starves the drum.* Variability 1.0 with buffer 6: the gauge
      flashes on starved days; weld busy 71%, throughput 2.2.
   4. *The buffer is the drum's insurance.* Buffer 12: busy 94%, throughput
      2.95, cycle time 5.4; the sweep chart shows the knee.
   5. *Try it: find the smallest buffer that keeps the drum fed.* Both sliders;
      the sweep chart updates with variability.
   Check: "What does the rope control?" options the drum's speed / when work
   is released into the line / the paint station, answer the second, why: it
   ties release to what the drum has consumed.

4. **Register**, verify in the browser (the rope draws once and stays; the
   starvation flash is visible in reduced-motion mode as a static mark;
   playback at 4× stays smooth), commit (`feat(lesson): drum buffer rope`),
   push.

## Acceptance criteria

- [ ] AC1: `dbr.test.ts` passes for the table and the seed-1 thresholds.
- [ ] AC2: Beat 1 shows a weld queue over 100 at day 60 and a cycle-time readout of about 16; beat 2 shows WIP 9 and cycle time 3.
- [ ] AC3: Beat 3 shows weld busy about 71% with visible starvation flashes; beat 4 shows about 94% with buffer 12.
- [ ] AC4: The sweep chart's utilisation line rises steeply to buffer 12 and flattens after; the cycle-time line rises by about one day per three units.
- [ ] AC5: The rope line draws when release switches to drum and the gate readout matches the engine's release count each tick.
- [ ] AC6: Scene `aria-label` reports release mode, buffer target, weld utilisation and throughput; the lesson meets the phase 1 quality bar.
- [ ] AC7: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` pass.
