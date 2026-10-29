const TILES = [52, 88, 124];
const WELD = 1;
const PILES = [2, 3, 2];

export function DbrThumbnail() {
  return (
    <svg viewBox="0 0 160 120" aria-hidden>
      <rect x={12} y={66} width={26} height={24} rx={4} className="fill-surface stroke-muted" strokeDasharray="3 2" />
      {TILES.map((x, i) => (
        <g key={x}>
          {Array.from({ length: PILES[i] }, (_, k) => (
            <rect
              key={k}
              x={x + 6}
              y={56 - k * 7}
              width={12}
              height={5}
              rx={1.5}
              className="fill-accent/20 stroke-accent/70"
              strokeWidth={0.75}
            />
          ))}
          <rect
            x={x}
            y={66}
            width={24}
            height={24}
            rx={4}
            className={i === WELD ? "fill-surface-2 stroke-constraint" : "fill-surface-2 stroke-line"}
            strokeWidth={i === WELD ? 2 : 1}
          />
        </g>
      ))}
      <rect x={TILES[WELD] - 9} y={36} width={5} height={26} rx={1} className="fill-surface-2 stroke-line" strokeWidth={0.75} />
      <rect x={TILES[WELD] - 9} y={44} width={5} height={18} rx={1} className="fill-buffer" />
      <path
        d={`M ${TILES[WELD] + 12} 90 V 100 Q ${TILES[WELD] + 12} 104 ${TILES[WELD] + 8} 104 H 29 Q 25 104 25 100 V 90`}
        className="fill-none stroke-accent"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </svg>
  );
}
