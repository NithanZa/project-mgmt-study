const COLUMNS = [
  { x: 10, cards: 3, full: true },
  { x: 47, cards: 3, full: true },
  { x: 84, cards: 2, full: false },
  { x: 121, cards: 1, full: false },
];

export function KanbanThumbnail() {
  return (
    <svg viewBox="0 0 160 120" aria-hidden>
      {COLUMNS.map((c) => (
        <g key={c.x}>
          <rect x={c.x} y={14} width={30} height={92} rx={5} className="fill-surface-2 stroke-line" strokeWidth={1} />
          <rect x={c.x + 12} y={20} width={14} height={8} rx={4} className={c.full ? "fill-constraint" : "fill-surface stroke-line"} strokeWidth={0.75} />
          {Array.from({ length: c.cards }, (_, i) => (
            <rect key={i} x={c.x + 4} y={34 + i * 15} width={22} height={11} rx={2} className="fill-surface stroke-accent" strokeWidth={1} />
          ))}
        </g>
      ))}
    </svg>
  );
}
