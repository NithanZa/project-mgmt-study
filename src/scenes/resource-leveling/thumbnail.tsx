import { useId } from "react";

const BARS = [
  { x: 20, y: 18, w: 36, cls: "fill-accent/20 stroke-accent" },
  { x: 56, y: 30, w: 48, cls: "fill-float/20 stroke-float" },
  { x: 20, y: 42, w: 24, cls: "fill-accent/20 stroke-accent" },
  { x: 44, y: 54, w: 36, cls: "fill-float/20 stroke-float" },
  { x: 20, y: 66, w: 24, cls: "fill-accent/20 stroke-accent" },
];

export function ResourceLevelingThumbnail() {
  const hatch = `rl-thumb-${useId().replace(/[^\w-]/g, "")}`;
  return (
    <svg viewBox="0 0 160 120" aria-hidden>
      <defs>
        <pattern id={hatch} width={5} height={5} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line y2={5} strokeWidth={2.5} className="stroke-constraint" />
        </pattern>
      </defs>
      {BARS.map((b, i) => (
        <rect key={i} x={b.x} y={b.y} width={b.w} height={8} rx={2} className={b.cls} />
      ))}
      <rect x={20} y={84} width={120} height={24} rx={3} className="fill-surface-2" />
      <rect x={21} y={100} width={22} height={7} rx={1} className="fill-accent/55" />
      <rect x={21} y={92} width={22} height={7} rx={1} fill={`url(#${hatch})`} className="stroke-constraint" />
      <rect x={21} y={84.5} width={22} height={7} rx={1} fill={`url(#${hatch})`} className="stroke-constraint" />
      <rect x={45} y={100} width={34} height={7} rx={1} className="fill-accent/55" />
      <line x1={20} x2={140} y1={99.5} y2={99.5} className="stroke-fg" />
    </svg>
  );
}
