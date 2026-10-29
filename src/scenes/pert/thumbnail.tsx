import { type Bell, bellPath } from "./geometry";

const BELL: Bell = { mean: 15.2, sigma: 1.9, amplitude: 70 };
const x = (d: number) => 8 + ((d - 8) / 16) * 144;

export function PertThumbnail() {
  return (
    <svg viewBox="0 0 160 120" aria-hidden>
      <path d={bellPath(BELL, x, 100, 8, 17, true)} className="fill-accent/25" />
      <path
        d={bellPath(BELL, x, 100, 8, 24, false)}
        className="fill-none stroke-accent"
        strokeWidth={2.5}
      />
      <line x1={x(17)} x2={x(17)} y1={22} y2={100} className="stroke-fg" strokeWidth={1.5} />
      <line x1={8} x2={152} y1={100} y2={100} className="stroke-line" />
    </svg>
  );
}
