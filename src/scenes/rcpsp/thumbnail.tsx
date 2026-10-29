const HISTOGRAM: [days: number, orders: number][] = [
  [20, 616],
  [22, 540],
  [23, 28],
  [24, 3036],
  [25, 70],
  [26, 230],
  [28, 520],
];
const RULE_DOTS: [days: number, level: number][] = [
  [22, 0],
  [22, 1],
  [24, 0],
  [24, 1],
  [28, 0],
  [28, 1],
];
const x = (days: number) => 14 + ((days - 12.5) / 18) * 132;
const h = (orders: number) => (orders / 3036) * 56;

/** Static strip: makespans over all orders, rule dots, optimum and lower bound. */
export function RcpspThumbnail() {
  return (
    <svg viewBox="0 0 160 120" aria-hidden>
      {HISTOGRAM.map(([d, n]) => (
        <rect key={d} x={x(d) - 2.6} y={84 - h(n)} width={5.2} height={h(n)} rx={1} className="fill-muted/45" />
      ))}
      <line x1={14} x2={146} y1={84} y2={84} className="stroke-fg/60" />
      <line x1={x(13)} x2={x(13)} y1={24} y2={84} strokeDasharray="3 2" strokeWidth={1.5} className="stroke-constraint" />
      <line x1={x(20)} x2={x(20)} y1={26} y2={84} strokeWidth={1.5} className="stroke-ok" />
      <rect x={x(20) - 3} y={21} width={6} height={6} transform={`rotate(45 ${x(20)} 24)`} className="fill-ok" />
      {RULE_DOTS.map(([d, level], i) => (
        <circle
          key={`${d}-${level}`}
          cx={x(d)}
          cy={94 + level * 5}
          r={i === 0 ? 3.5 : 2.5}
          strokeWidth={1.5}
          className={i === 0 ? "fill-accent stroke-accent" : "fill-surface stroke-muted"}
        />
      ))}
    </svg>
  );
}
