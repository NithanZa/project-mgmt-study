"use client";

import { useId } from "react";

export interface SliderProps {
  label: string;
  unit: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
}

export function Slider({
  label,
  unit,
  value,
  min,
  max,
  step = 1,
  onChange,
  format = (v) => String(v),
}: SliderProps) {
  const id = useId();
  const text = `${format(value)} ${unit}`;
  return (
    <div className="flex min-w-40 flex-1 flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <label htmlFor={id} className="text-muted">
          {label}
        </label>
        <output htmlFor={id} className="font-medium tabular-nums text-fg">
          {text}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={text}
        onChange={(e) => onChange(Number(e.currentTarget.value))}
        className="h-5 w-full cursor-pointer accent-[var(--accent)]"
      />
    </div>
  );
}
