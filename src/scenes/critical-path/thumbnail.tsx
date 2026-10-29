import { computeCriticalPath } from "@/engine/critical-path/cpm";
import { COFFEE_SHOP } from "@/engine/critical-path/fixture";

const W = 22;
const H = 14;
const at = (col: number, row: number) => ({ x: 16 + col * 32, y: 24 + row * 36 });
const result = computeCriticalPath(COFFEE_SHOP);
const byId = new Map(COFFEE_SHOP.map((t) => [t.id, t]));

export function Thumbnail() {
  return (
    <svg viewBox="0 0 160 120" aria-hidden>
      {COFFEE_SHOP.flatMap((t) =>
        t.deps.map((d) => {
          const a = at(byId.get(d)!.pos.col, byId.get(d)!.pos.row);
          const b = at(t.pos.col, t.pos.row);
          const critical = result.rows[d].critical && result.rows[t.id].critical;
          return (
            <line
              key={`${d}-${t.id}`}
              x1={a.x + W / 2}
              y1={a.y}
              x2={b.x - W / 2}
              y2={b.y}
              className={critical ? "stroke-accent" : "stroke-muted"}
              strokeWidth={critical ? 3 : 1}
            />
          );
        }),
      )}
      {COFFEE_SHOP.map((t) => {
        const c = at(t.pos.col, t.pos.row);
        const critical = result.rows[t.id].critical;
        return (
          <rect
            key={t.id}
            x={c.x - W / 2}
            y={c.y - H / 2}
            width={W}
            height={H}
            rx={4}
            className={critical ? "fill-accent-soft stroke-accent" : "fill-surface-2 stroke-line"}
            strokeWidth={critical ? 2 : 1}
          />
        );
      })}
    </svg>
  );
}
