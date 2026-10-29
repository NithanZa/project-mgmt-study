const TILES = [14, 42, 70, 98, 126];
const OVEN = 2;

export function TocThumbnail() {
  return (
    <svg viewBox="0 0 160 120" aria-hidden>
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <rect key={i} x={TILES[OVEN] + 3} y={66 - i * 7} width={14} height={5} rx={1.5} className="fill-constraint/40 stroke-constraint" strokeWidth={0.75} />
      ))}
      {TILES.map((x, i) => (
        <rect
          key={x}
          x={x}
          y={74}
          width={20}
          height={24}
          rx={4}
          className={i === OVEN ? "fill-surface-2 stroke-constraint" : "fill-surface-2 stroke-line"}
          strokeWidth={i === OVEN ? 2 : 1}
        />
      ))}
      <path d="M 14 106 H 146" className="stroke-accent" strokeWidth={2} strokeLinecap="round" strokeDasharray="6 6" />
    </svg>
  );
}
