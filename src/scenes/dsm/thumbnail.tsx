import { BEST, MARKS, blockRows } from "./model";

const N = BEST.order.length;
const CELL = 11;
const X0 = 80 - (N * CELL) / 2;
const Y0 = 60 - (N * CELL) / 2;
const POS = new Map(BEST.order.map((id, i) => [id, i]));
const BLOCK = blockRows(BEST.order);

export function DsmThumbnail() {
  return (
    <svg viewBox="0 0 160 120" aria-hidden>
      <rect x={X0} y={Y0} width={N * CELL} height={N * CELL} rx={3} className="fill-surface-2 stroke-line" />
      {BEST.order.map((id, i) => (
        <rect key={id} x={X0 + i * CELL} y={Y0 + i * CELL} width={CELL} height={CELL} className="fill-fg/10" />
      ))}
      {MARKS.map((m) => {
        const r = POS.get(m.row)!;
        const c = POS.get(m.col)!;
        const cx = X0 + (c + 0.5) * CELL;
        const cy = Y0 + (r + 0.5) * CELL;
        return c > r ? (
          <circle key={`${m.row}${m.col}`} cx={cx} cy={cy} r={3} strokeWidth={1.5} className="fill-none stroke-constraint" />
        ) : (
          <circle key={`${m.row}${m.col}`} cx={cx} cy={cy} r={2.4} className="fill-accent" />
        );
      })}
      <rect
        x={X0 + BLOCK.first * CELL}
        y={Y0 + BLOCK.first * CELL}
        width={(BLOCK.last - BLOCK.first + 1) * CELL}
        height={(BLOCK.last - BLOCK.first + 1) * CELL}
        rx={2}
        strokeWidth={1.75}
        className="fill-none stroke-fg"
      />
    </svg>
  );
}
