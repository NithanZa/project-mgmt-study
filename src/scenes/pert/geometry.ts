import { betaPertPdf } from "@/engine/pert/pert";
import type { Estimate } from "@/engine/pert/types";

/** Every row and the project curve share this day axis, so markers never jump. */
export const AXIS_MAX = 24;
export const AXIS_H = 22;
export const PAD = 14;
/** Room above the project curve for the deadline pill and the mean label. */
const HEADROOM = 32;
/** Below this curve-area height the mean label hides and the pill overlaps the curve. */
const ROOMY = 120;
const SAMPLES = 48;
const BELL_SAMPLES = 120;

export const SPRING = { type: "spring", bounce: 0.2, visualDuration: 0.4 } as const;
export const FADE = { duration: 0.18, ease: "easeOut" } as const;
export const MOTION = { default: SPRING, opacity: FADE } as const;

export type Scale = (days: number) => number;

export const scaleX =
  (width: number): Scale =>
  (days) =>
    PAD + (days / AXIS_MAX) * (width - 2 * PAD);

export const invertX = (width: number, px: number): number =>
  ((px - PAD) / (width - 2 * PAD)) * AXIS_MAX;

export interface RowBox {
  y: number;
  h: number;
  labels: boolean;
}

export interface SceneLayout {
  rows: RowBox[];
  /** Top of the project-curve area; equals `base` while rows fill the canvas. */
  curveTop: number;
  /** Baseline of the project curve, just above the axis. */
  base: number;
  /** Peak height of the reference bell; zero while rows fill the canvas. */
  amplitude: number;
  /** Too short for the mean label above the peak. */
  compact: boolean;
}

/** Rows fill the canvas, or shrink into a strip above the project curve. */
export function sceneLayout(height: number, curveMode: boolean, count: number): SceneLayout {
  const base = height - AXIS_H;
  const strip = !curveMode ? base : height >= 150 ? Math.min(height * 0.3, 170) : 0;
  const h = strip / count;
  const curveTop = curveMode ? strip + 6 : base;
  const room = base - curveTop;
  const compact = room < ROOMY;
  return {
    rows: Array.from({ length: count }, (_, i) => ({ y: i * h, h, labels: h >= 26 })),
    curveTop,
    base,
    amplitude: Math.max(room - (compact ? 14 : HEADROOM), 0),
    compact,
  };
}

const f = (n: number) => n.toFixed(1);

/** Closed outline of a beta-PERT density scaled to `height` above `baseline`. */
export function betaPath(e: Estimate, x: Scale, baseline: number, height: number): string {
  const peak = betaPertPdf(e, e.m);
  let d = `M${f(x(e.o))} ${f(baseline)}`;
  for (let i = 0; i <= SAMPLES; i++) {
    const day = e.o + ((e.p - e.o) * i) / SAMPLES;
    d += `L${f(x(day))} ${f(baseline - (betaPertPdf(e, day) / peak) * height)}`;
  }
  return `${d}L${f(x(e.p))} ${f(baseline)}Z`;
}

export interface Bell {
  mean: number;
  sigma: number;
  /** Height of the bell's peak in px. */
  amplitude: number;
}

const bellY = (b: Bell, baseline: number, day: number) =>
  baseline - b.amplitude * Math.exp(-0.5 * ((day - b.mean) / b.sigma) ** 2);

/** Normal curve from `from` to `to` days; `closed` drops to the baseline to make an area. */
export function bellPath(
  b: Bell,
  x: Scale,
  baseline: number,
  from: number,
  to: number,
  closed: boolean,
): string {
  let d = closed ? `M${f(x(from))} ${f(baseline)}` : "";
  for (let i = 0; i <= BELL_SAMPLES; i++) {
    const day = from + ((to - from) * i) / BELL_SAMPLES;
    d += `${i === 0 && !closed ? "M" : "L"}${f(x(day))} ${f(bellY(b, baseline, day))}`;
  }
  return closed ? `${d}L${f(x(to))} ${f(baseline)}Z` : d;
}

export const bellTop = (b: Bell, baseline: number) => baseline - b.amplitude;
