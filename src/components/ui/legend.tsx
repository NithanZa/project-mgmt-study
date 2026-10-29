export interface LegendItem {
  label: string;
  /** Classes for the swatch, e.g. "bg-accent" or "hatch text-constraint". */
  swatch: string;
}

export function Legend({ items }: { items: LegendItem[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span aria-hidden className={`inline-block size-3 rounded-sm ${item.swatch}`} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
