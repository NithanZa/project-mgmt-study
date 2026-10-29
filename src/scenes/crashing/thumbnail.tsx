import { crashCurve, optimum, totalCostCurve } from "@/engine/crashing/crash";
import { BOOTH, DEFAULT_OVERHEAD } from "@/engine/crashing/fixture";

const curve = crashCurve(BOOTH);
const totals = totalCostCurve(curve, DEFAULT_OVERHEAD);
const best = optimum(curve, DEFAULT_OVERHEAD);
const lo = totals[totals.length - 1].days;
const hi = totals[0].days;
const minTotal = Math.min(...totals.map((p) => p.total));
const maxTotal = Math.max(...totals.map((p) => p.total));
const maxDirect = totals[totals.length - 1].direct;

const sx = (d: number) => 20 + ((d - lo) / (hi - lo)) * 120;
// Schematic: the total's U fills the top band, direct cost rises in the bottom band.
const syTotal = (v: number) => 62 - ((v - minTotal) / (maxTotal - minTotal)) * 42;
const syDirect = (v: number) => 104 - (v / maxDirect) * 36;
const line = (xy: [number, number][]) => xy.map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`).join(" ");

export function CrashingThumbnail() {
  return (
    <svg viewBox="0 0 160 120" aria-hidden>
      <line x1="20" x2="140" y1="104" y2="104" className="stroke-line" />
      <path d={line(totals.map((p) => [sx(p.days), syDirect(p.direct)]))} className="fill-none stroke-buffer" strokeWidth="2" />
      <path d={line(totals.map((p) => [sx(p.days), syTotal(p.total)]))} className="fill-none stroke-accent" strokeWidth="3" strokeLinejoin="round" />
      <circle cx={sx(best.days)} cy={syTotal(best.total)} r="5" className="fill-accent stroke-surface" strokeWidth="2" />
    </svg>
  );
}
