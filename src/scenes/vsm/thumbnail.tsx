import { HIRING, HOURS_PER_DAY } from "@/engine/vsm/fixture";
import { summary } from "@/engine/vsm/vsm";

const TRACK = { x: 14, w: 132, top: 42, bottom: 78 };
const BAR = 6;

interface Segment {
  id: string;
  work: boolean;
  x: number;
  w: number;
}

function segments(): Segment[] {
  const scale = TRACK.w / summary(HIRING).leadTimeDays;
  const out: Segment[] = [];
  let x = TRACK.x;
  for (const s of HIRING) {
    const wait = s.waitDays * scale;
    out.push({ id: `${s.id}-wait`, work: false, x, w: wait });
    x += wait;
    const work = Math.max(2, (s.processHours / HOURS_PER_DAY) * scale);
    out.push({ id: `${s.id}-work`, work: true, x, w: work });
    x += work;
  }
  return out;
}

const SEGMENTS = segments();

export function VsmThumbnail() {
  return (
    <svg viewBox="0 0 160 120" aria-hidden>
      {SEGMENTS.map((g) =>
        g.work ? (
          <g key={g.id}>
            <line x1={g.x} x2={g.x} y1={TRACK.top} y2={TRACK.bottom} className="stroke-muted" />
            <line x1={g.x + g.w} x2={g.x + g.w} y1={TRACK.top} y2={TRACK.bottom} className="stroke-muted" />
            <rect x={g.x} y={TRACK.top} width={g.w} height={BAR} className="fill-accent" />
          </g>
        ) : (
          <rect key={g.id} x={g.x} y={TRACK.bottom - BAR} width={g.w} height={BAR} className="fill-constraint" />
        ),
      )}
    </svg>
  );
}
