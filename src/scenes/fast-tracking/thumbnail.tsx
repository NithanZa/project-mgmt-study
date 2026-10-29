export function FastTrackingThumbnail() {
  return (
    <svg viewBox="0 0 160 120" aria-hidden>
      <defs>
        <pattern id="ft-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="2" height="6" className="fill-buffer" />
        </pattern>
      </defs>
      <rect x="16" y="22" width="40" height="14" rx="3" className="fill-accent-soft stroke-accent" />
      <rect x="44" y="46" width="30" height="14" rx="3" className="fill-accent-soft stroke-accent" strokeWidth="2" />
      <rect x="44" y="46" width="12" height="14" fill="url(#ft-hatch)" />
      <rect x="74" y="70" width="40" height="14" rx="3" className="fill-accent-soft stroke-accent" />
      <rect x="114" y="94" width="30" height="14" rx="3" className="fill-accent-soft stroke-accent" />
    </svg>
  );
}
