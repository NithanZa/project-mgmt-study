# PM Methods Interactive Course

## Outcome

Lesson 10, Theory of Constraints, is complete at `/learn/toc`. The learner runs
a bakery line, finds the oven setting the pace of everything, tries investing
in other stations to no effect, then elevates the oven until the constraint
moves to the market. Insight: improving anything other than the current
constraint does nothing for throughput; find it, exploit it, subordinate to
it, elevate it, repeat.

Scenario (per hour, simulated for 80 hours). Mix 60, Proof 40, Bake 25, Cool
50, Pack 45; orders 38 per hour. Verified with the line simulator below:

| configuration                       | throughput / h | cycle time h | WIP (avg) | note                         |
| ----------------------------------- | -------------- | ------------ | --------- | ---------------------------- |
| push                                | 25             | 18.7         | 716       | oven queue 1039 at hour 80   |
| Pack +50%                           | 25             | 18.7         | 716       | nothing changes              |
| Proof +50%                          | 25             | 18.7         | 716       | nothing changes              |
| Bake +50% (37)                      | 37             | 6.1          | 230       |                              |
| Bake ×2 (50)                        | 38             | 5.0          | 190       | demand-limited; oven 73% busy |
| subordinate: release at oven pace   | 25             | 5.0          | 125       | same throughput, no pile     |
| exploit: oven loses 20% to cleaning | 20             |              |           | fix the loss before buying   |

## Step-by-step

1. **Shared line simulator** `src/lib/line-sim.ts` (created here, reused by
   the DBR and Kanban lessons with their own fixtures and scenes):
   ```ts
   interface Station { id: string; name: string; capacity: number }
   interface LineConfig {
     stations: Station[]; arrivalsPerTick: number; ticks: number; seed: number;
     release: "push" | "drum"; bufferTarget?: number;   // drum: rope caps WIP at or before the constraint
     wipLimit?: number;                                  // per-station pull limit including items in work
     variability: number;                                // 0..1 scales per-tick capacity noise
     outage?: { station: string; from: number; to: number };
     efficiency?: Record<string, number>;                // capacity multiplier per station, default 1
   }
   interface TickState { tick: number; queues: number[]; wip: number; exited: number }
   interface LineResult {
     ticks: TickState[]; throughput: number; avgCycleTime: number; avgWip: number;
     utilization: number[]; constraint: string;
     cfd: { tick: number; cumulativeIn: number; cumulativeOut: number[] }[];
     items: { id: number; enteredTick: number; exitedTick?: number; history: number[] }[];
   }
   simulateLine(config): LineResult
   ```
   Semantics (fixed; the three flow lessons' numbers depend on them): one tick
   per step; a station processes at most `cap` items that were in its queue at
   the start of the tick (so an item spends at least one tick per station);
   stations process downstream first; `cap = round(capacity × efficiency × (1 + u))`
   with `u` uniform in `±variability` drawn every tick for every station (drawn
   even when variability is 0 so seeds align), `outage` forces 0; push releases
   `arrivalsPerTick` at the end of each tick; pull (`wipLimit`) only moves an
   item while the next station holds fewer than the limit and release obeys the
   same limit; drum: the constraint is the smallest nominal capacity and
   release is `max(0, bufferTarget − wipAtOrBeforeConstraint)` capped by
   arrivals; `utilization = processed / (capacity × ticks)`; throughput, cycle
   time and WIP average after a warm-up of `min(10, ticks / 6)` ticks; items are
   capped at 5000. `line-sim.test.ts` asserts the bakery table (±2% on
   throughput, ±0.5 on cycle time) and conservation (arrived = exited + wip on
   every tick).

2. **Engine** `src/engine/toc/`: `fixture.ts` (`BAKERY` stations, `DEMAND = 38`,
   `HOURS = 80`), `scenarios.ts` (`invest(stationId)` applies +50%,
   `elevate(stationId, factor)`, `subordinate()` sets drum release with
   `bufferTarget = 3 × oven capacity`, `exploitLoss(on)` sets oven efficiency
   0.8), `toc.test.ts` for the table rows through the simulator.

3. **Scene** `src/scenes/toc/`:
   - `line.tsx`: five stations as rounded tiles in a row with a capacity dial
     (`motion.div` arc) and a queue pile in front of each (stacked chips up to
     12 plus a `+n` badge); batches flow as chips with `layoutId`; the
     constraint tile pulses softly and carries a "constraint" tag; a
     utilisation bar under each tile.
   - `invest-panel.tsx`: five "Invest +50%" buttons (one per station) with the
     resulting throughput shown as a delta badge after a run.
   - `focusing-steps.tsx`: a five-step rail (Identify, Exploit, Subordinate,
     Elevate, Repeat) with a `layoutId` highlight that follows the beat.
   - `scene.tsx`: whole-run simulation in `useMemo` keyed by config; playback
     scrubs `ticks[t]` on an interval (250 ms per hour at 1×, 60 ms at 4×);
     play, pause, speed, reset. Readouts: "Throughput / h", "Cycle time h",
     "WIP". Controls: invest buttons (beat 4), cleaning-loss toggle and
     subordinate toggle (beat 3), oven multiplier `Segmented` ×1 / ×1.5 / ×2
     (beat 5), capacity sliders for all stations (beat 5 "try it"), Reset.
   - `thumbnail.tsx`: static line with a pile before the oven.

4. **Beats** in `src/content/lessons/toc.tsx`:
   1. *The oven sets the pace of the whole bakery.* Play: a pile grows before
      the oven; throughput 25 against orders of 38.
   2. *Identify: the constraint is where work waits.* The oven tile is tagged;
      the other stations show spare capacity.
   3. *Exploit and subordinate before you spend.* Cleaning loss on: 20 per
      hour, the cheapest fix is to stop losing oven time; subordinate on:
      release at oven pace, same 25 per hour but cycle time 18.7 → 5 and WIP
      716 → 125.
   4. *Elevate where it moves throughput.* Invest in Pack: 25. Proof: 25.
      Oven: 37.
   5. *Repeat: the constraint moves.* Oven ×2: throughput 38 equals demand and
      the oven sits at 73% busy; the constraint is now the market.
   Check: "Doubling a non-constraint's capacity raises throughput by…" options
   0 / half its gain / its gain, answer 0, why: output is set by the constraint.

5. **Register**, verify in the browser (playback at 4× holds 60 fps with chips
   using transforms only; the invest badges animate once), commit
   (`feat(lesson): theory of constraints`), push.

## Acceptance criteria

- [x] AC1: `simulateLine` reproduces the bakery table within tolerance in `line-sim.test.ts` and `toc.test.ts`, and conservation holds on every tick.
- [x] AC2: Beat 1 playback shows the pile growing only before the oven and a throughput readout of 25.
- [x] AC3: Beat 3 toggles give 20 per hour with cleaning loss on, and 25 per hour with cycle time 5 h and WIP 125 with subordinate on.
- [x] AC4: Beat 4's invest buttons show deltas of 0 for Pack and Proof and +12 for the oven.
- [x] AC5: Beat 5's ×2 control shows 38 per hour, oven utilisation under 80%, and the constraint tag moves to "Market".
- [x] AC6: Playback holds 55 fps or better at 4× in a 10-second performance sample; scene `aria-label` reports the constraint and throughput; the lesson meets the phase 1 quality bar.
- [x] AC7: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` pass.
