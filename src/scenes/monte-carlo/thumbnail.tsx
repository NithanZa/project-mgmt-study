import { pertTotal } from "@/engine/monte-carlo/simulate";
import { DEFAULT_STREAMS, simFor } from "./model";

const X0 = 9;
const X1 = 18;
const x = (v: number) => 12 + ((v - X0) / (X1 - X0)) * 136;

/** Lesson card art: the default network's finish histogram with P50 past PERT. */
export function Thumbnail() {
  const sim = simFor(DEFAULT_STREAMS);
  const bins = sim.histogram.filter((b) => b.from >= X0 && b.to <= X1);
  const top = Math.max(...bins.map((b) => b.count));
  const pert = x(pertTotal({ streams: DEFAULT_STREAMS }));
  const p50 = x(sim.p50);
  return (
    <svg viewBox="0 0 160 120" aria-hidden>
      {bins.map((b) => {
        const h = (b.count / top) * 80;
        return <rect key={b.from} x={x(b.from) + 0.75} y={100 - h} width={x(b.to) - x(b.from) - 1.5} height={h} rx={1} className="fill-fg/20" />;
      })}
      <line x1={12} x2={148} y1={100} y2={100} className="stroke-line" />
      <line x1={pert} x2={pert} y1={14} y2={100} strokeWidth={1.5} strokeDasharray="4 3" className="stroke-float" />
      <line x1={p50} x2={p50} y1={14} y2={100} strokeWidth={2} className="stroke-accent" />
    </svg>
  );
}
