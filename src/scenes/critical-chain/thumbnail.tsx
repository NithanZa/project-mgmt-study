import { CHAINS, HALF, PLAN, TASKS } from "./model";

const LEFT = 10;
const DAY = 6.4;
const ROW = 16;
const TOP = 14;

/** Static Gantt of the buffered plan: chain bars, a feeding buffer and the project buffer. */
export function CriticalChainThumbnail() {
  const onChain = new Set(CHAINS.buffered.ids);
  const row = (id: string) => TASKS.findIndex((t) => t.id === id);
  const x = (d: number) => LEFT + d * DAY;
  const y = (i: number, h: number) => TOP + i * ROW + (ROW - h) / 2;
  const last = row(CHAINS.buffered.ids[CHAINS.buffered.ids.length - 1]);
  return (
    <svg viewBox="0 0 160 120" aria-hidden>
      {TASKS.map((t, i) => {
        const h = onChain.has(t.id) ? 10 : 6;
        return (
          <rect
            key={t.id}
            x={x(PLAN.start[t.id])}
            y={y(i, h)}
            width={(PLAN.finish[t.id] - PLAN.start[t.id]) * DAY}
            height={h}
            rx={2}
            className={onChain.has(t.id) ? "fill-accent" : "fill-muted/60"}
          />
        );
      })}
      {HALF.feeding.map((f) => (
        <rect
          key={f.from}
          x={x(PLAN.start[f.before] - f.days)}
          y={y(row(f.from), 6)}
          width={f.days * DAY}
          height={6}
          rx={2}
          className="fill-buffer/30 stroke-buffer"
        />
      ))}
      <rect
        x={x(PLAN.makespan)}
        y={y(last, 10)}
        width={HALF.project.days * DAY}
        height={10}
        rx={2}
        className="fill-buffer/30 stroke-buffer"
      />
    </svg>
  );
}
