"use client";

import { useAnimate, useReducedMotion } from "motion/react";
import { useEffect, useId, type ReactNode } from "react";
import type { Station, TickState } from "@/lib/line-sim";
import { BufferGauge } from "./buffer-gauge";
import { Rope } from "./rope";

const SLOTS = 12;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export type ShopGeometry = ReturnType<typeof shopGeometry>;

export function shopGeometry(width: number, height: number, stationCount: number) {
  const font = height < 160 ? 10 : height < 260 ? 11 : 13;
  const gateW = clamp(width * 0.15, 42, 96);
  const colW = (width - gateW) / stationCount;
  const lane = clamp(height * 0.12, 12, 26);
  const tileH = clamp(height * 0.3, 28, 76);
  const tileY = height - lane - tileH;
  const pileTop = font * 1.7;
  const pileBottom = tileY - font * 0.9;
  const pileW = clamp(colW * 0.28, 10, 34);
  const gaugeW = clamp(colW * 0.08, 6, 12);
  return { width, height, font, gateW, colW, lane, tileH, tileY, pileTop, pileBottom, pileW, gaugeW };
}

export interface ShopProps {
  geometry: ShopGeometry;
  stations: Station[];
  drum: number;
  state: TickState;
  tick: number;
  /** Milliseconds per day of playback. */
  interval: number;
  arrivals: number;
  rope: boolean;
  bufferTarget: number;
  gaugeMax: number;
}

export function Shop({ geometry: g, stations, drum, state, tick, interval, arrivals, rope, bufferTarget, gaugeMax }: ShopProps) {
  const hatch = useId();
  const colX = (i: number) => g.gateW + i * g.colW;
  const centre = (i: number) => colX(i) + g.colW / 2;
  const tileBottom = g.tileY + g.tileH;
  const upstream = state.queues.slice(0, drum + 1).reduce((a, b) => a + b, 0);
  const starved = state.caps[drum] > state.processed[drum];

  return (
    <svg width={g.width} height={g.height} className="block overflow-visible select-none" aria-hidden>
      <defs>
        <pattern id={hatch} width={5} height={5} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width={5} height={5} className="fill-constraint/15" />
          <line y2={5} strokeWidth={2.5} className="stroke-constraint" />
        </pattern>
      </defs>

      <Gate g={g} arrivals={arrivals} released={state.released} />
      {stations.map((s, i) => (
        <g key={s.id} data-station={s.id} data-queue={state.queues[i]}>
          <Chevron x={colX(i)} y={g.tileY + g.tileH / 2} />
          <Pile g={g} x={centre(i)} count={state.queues[i]} hatch={hatch} />
          <Tile g={g} x={colX(i) + 4} width={g.colW - 8} station={s} isDrum={i === drum}>
            {i === drum && (
              <DrumParts
                g={g}
                x={colX(i) + 4}
                width={g.colW - 8}
                cap={state.caps[i]}
                processed={state.processed[i]}
                tick={tick}
                interval={interval}
              />
            )}
          </Tile>
        </g>
      ))}
      <BufferGauge
        x={centre(drum) - g.pileW / 2 - g.gaugeW - g.font * 0.9}
        top={g.pileTop}
        bottom={g.pileBottom}
        width={g.gaugeW}
        count={upstream}
        target={bufferTarget}
        max={gaugeMax}
        starved={starved}
        visible={rope}
        font={g.font}
        hatchId={hatch}
      />
      <Rope
        drumX={centre(drum)}
        gateX={g.gateW / 2}
        from={tileBottom}
        laneY={tileBottom + g.lane * 0.55}
        font={g.font}
        on={rope}
      />
    </svg>
  );
}

function Gate({ g, arrivals, released }: { g: ShopGeometry; arrivals: number; released: number }) {
  const cx = g.gateW / 2;
  const small = { fontSize: g.font * 0.85 };
  // Short tiles show only the count, with its label above the tile.
  const roomy = g.tileH >= 40;
  return (
    <g data-gate data-release={released}>
      {g.pileBottom - g.pileTop >= g.font * 3.5 && (
        <text x={cx} y={g.pileTop + g.font} textAnchor="middle" className="fill-muted" style={small}>
          <tspan>orders</tspan>
          <tspan x={cx} dy="1.2em" className="tabular-nums">
            {arrivals}/day
          </tspan>
        </text>
      )}
      <rect
        x={4}
        y={g.tileY}
        width={g.gateW - 8}
        height={g.tileH}
        rx={8}
        className="fill-surface stroke-muted"
        strokeDasharray="4 3"
      />
      <text
        x={cx}
        y={roomy ? g.tileY + g.tileH * 0.34 : g.tileY - 4}
        dy={roomy ? "0.35em" : 0}
        textAnchor="middle"
        className="fill-muted"
        style={{ fontSize: g.font * 0.8 }}
      >
        release
      </text>
      <text
        x={cx}
        y={g.tileY + g.tileH * (roomy ? 0.68 : 0.5)}
        dy="0.35em"
        textAnchor="middle"
        className="fill-fg font-semibold tabular-nums"
        style={{ fontSize: g.font * 1.15 }}
      >
        {released}
      </text>
    </g>
  );
}

function Chevron({ x, y }: { x: number; y: number }) {
  return (
    <path d={`M ${x - 2} ${y - 4} L ${x + 2} ${y} L ${x - 2} ${y + 4}`} className="fill-none stroke-muted" strokeWidth={1.25} />
  );
}

/** One chip per item at the station; past twelve the pile is overloaded and hatched. */
function Pile({ g, x, count, hatch }: { g: ShopGeometry; x: number; count: number; hatch: string }) {
  const h = g.pileBottom - g.pileTop;
  const gap = h > 90 ? 2 : 1;
  const chipH = Math.max(1, (h - (SLOTS - 1) * gap) / SLOTS);
  const overload = count > SLOTS;
  return (
    <g>
      {count > 0 && (
        <text
          x={x}
          y={g.pileTop - g.font * 0.45}
          textAnchor="middle"
          className={`font-semibold tabular-nums ${overload ? "fill-constraint" : "fill-fg"}`}
          style={{ fontSize: g.font }}
        >
          {count}
        </text>
      )}
      {Array.from({ length: Math.min(count, SLOTS) }, (_, k) => (
        <rect
          key={k}
          x={x - g.pileW / 2}
          y={g.pileBottom - (k + 1) * chipH - k * gap}
          width={g.pileW}
          height={chipH}
          rx={Math.min(2, chipH / 2)}
          fill={overload ? `url(#${hatch})` : undefined}
          className={overload ? "stroke-constraint" : "fill-accent/20 stroke-accent/70"}
          strokeWidth={0.75}
        />
      ))}
    </g>
  );
}

interface TileProps {
  g: ShopGeometry;
  x: number;
  width: number;
  station: Station;
  isDrum: boolean;
  children?: ReactNode;
}

function Tile({ g, x, width, station, isDrum, children }: TileProps) {
  const withPips = isDrum && g.tileH >= 40;
  return (
    <g>
      <rect
        x={x}
        y={g.tileY}
        width={width}
        height={g.tileH}
        rx={8}
        className={`fill-surface-2 ${isDrum ? "stroke-constraint" : "stroke-line"}`}
        strokeWidth={isDrum ? 2 : 1}
      />
      <text
        x={x + width / 2}
        y={g.tileY + g.tileH * (withPips ? 0.36 : 0.5)}
        dy="0.35em"
        textAnchor="middle"
        style={{ fontSize: g.font }}
      >
        <tspan className="fill-fg font-semibold">{station.name}</tspan>
        <tspan className="fill-muted tabular-nums"> {station.capacity}/day</tspan>
      </text>
      {children}
    </g>
  );
}

interface DrumPartsProps {
  g: ShopGeometry;
  x: number;
  width: number;
  cap: number;
  processed: number;
  tick: number;
  interval: number;
}

/** The drum's tag, a ring that beats with each day's output, and one pip per unit of today's capacity, filled when used. */
function DrumParts({ g, x, width, cap, processed, tick, interval }: DrumPartsProps) {
  const [ring, animate] = useAnimate<SVGRectElement>();
  const reduce = useReducedMotion();
  useEffect(() => {
    if (!processed) return;
    const duration = Math.min(0.4, (interval * 0.9) / 1000);
    const keyframes = reduce ? { opacity: [0.9, 0] } : { opacity: [0.9, 0], scale: [1, 1 + 0.025 * processed] };
    const controls = animate(ring.current, keyframes, { duration, ease: "easeOut" });
    return () => controls.stop();
  }, [tick, processed, interval, reduce, animate, ring]);

  const cx = x + width / 2;
  const step = g.font * 0.85;
  const tagW = g.font * 3.2;
  return (
    <g data-drum-processed={processed} data-drum-cap={cap}>
      <rect
        ref={ring}
        x={x - 3}
        y={g.tileY - 3}
        width={width + 6}
        height={g.tileH + 6}
        rx={10}
        className="fill-none stroke-constraint"
        strokeWidth={2}
        style={{ opacity: 0, transformBox: "fill-box", transformOrigin: "center" }}
      />
      <rect
        x={cx - tagW / 2}
        y={g.tileY - g.font * 0.65}
        width={tagW}
        height={g.font * 1.3}
        rx={g.font * 0.65}
        className="fill-constraint"
      />
      <text
        x={cx}
        y={g.tileY}
        dy="0.35em"
        textAnchor="middle"
        className="fill-surface font-medium"
        style={{ fontSize: g.font * 0.8 }}
      >
        drum
      </text>
      {g.tileH >= 40 &&
        Array.from({ length: cap }, (_, k) => (
          <circle
            key={k}
            cx={cx + (k - (cap - 1) / 2) * step}
            cy={g.tileY + g.tileH * 0.7}
            r={g.font * 0.27}
            className={k < processed ? "fill-constraint stroke-constraint" : "fill-surface stroke-constraint"}
            strokeWidth={1}
          />
        ))}
    </g>
  );
}
