import type { Resource, Task } from "@/engine/resource-leveling/types";

export const AXIS_DAYS = 12;
/** Most people one lane can show: one task per feature chain at a time. */
export const LANE_UNITS = 3;

export interface Lane {
  top: number;
  bottom: number;
  unit: number;
}

export interface Geometry {
  width: number;
  height: number;
  font: number;
  x0: number;
  dayW: number;
  plotRight: number;
  rowY: Record<string, number>;
  barH: number;
  /** False when rows are too short for text. */
  rowLabels: boolean;
  lanes: Record<Resource, Lane>;
  top: number;
  bottom: number;
  axisY: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Pixel layout for a canvas of `width` x `height`: Gantt rows on top, two load lanes below. */
export function layout(tasks: Task[], width: number, height: number): Geometry {
  const font = clamp(Math.round(height / 28), 9, 12);
  const x0 = font * 5.4;
  const plotRight = width - font * 1.2;
  const dayW = (plotRight - x0) / AXIS_DAYS;

  const axisH = font + 6;
  const gap = font;
  const usable = height - axisH - gap * 1.6;
  const groups = new Set(tasks.map((t) => t.id[0])).size;
  const rowH = Math.min((usable * 0.6) / (tasks.length + (groups - 1) / 2), 44);
  const unit = Math.min((usable * 0.4) / (2 * LANE_UNITS), 28);
  const total = rowH * (tasks.length + (groups - 1) / 2) + gap * 1.6 + unit * 2 * LANE_UNITS + axisH;
  const top = Math.max(0, (height - total) / 2);

  const rowY: Record<string, number> = {};
  let y = top;
  tasks.forEach((t, i) => {
    if (i > 0 && t.id[0] !== tasks[i - 1].id[0]) y += rowH / 2;
    rowY[t.id] = y;
    y += rowH;
  });

  const designerTop = y + gap;
  const developerTop = designerTop + unit * LANE_UNITS + gap * 0.6;
  const bottom = developerTop + unit * LANE_UNITS;

  return {
    width,
    height,
    font,
    x0,
    dayW,
    plotRight,
    rowY,
    barH: rowH * 0.68,
    rowLabels: rowH >= font * 1.15,
    lanes: {
      designer: { top: designerTop, bottom: designerTop + unit * LANE_UNITS, unit },
      developer: { top: developerTop, bottom, unit },
    },
    top,
    bottom,
    axisY: bottom + axisH - 3,
  };
}
