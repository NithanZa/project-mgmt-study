"use client";

import { motion } from "motion/react";
import { useId } from "react";

export interface SegmentedProps<T extends string | number> {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

export function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: SegmentedProps<T>) {
  const id = useId();
  const index = options.findIndex((o) => o.value === value);

  const move = (delta: number) => {
    const from = index < 0 ? 0 : index;
    onChange(options[(from + delta + options.length) % options.length].value);
  };

  return (
    <div className="flex flex-col gap-1">
      <span id={`${id}-label`} className="text-xs text-muted">
        {label}
      </span>
      <div
        role="radiogroup"
        aria-labelledby={`${id}-label`}
        className="inline-flex w-fit rounded-md border border-line bg-surface-2 p-0.5"
        onKeyDown={(e) => {
          const delta =
            e.key === "ArrowRight" || e.key === "ArrowDown"
              ? 1
              : e.key === "ArrowLeft" || e.key === "ArrowUp"
                ? -1
                : 0;
          if (delta === 0) return;
          e.preventDefault();
          e.stopPropagation();
          move(delta);
        }}
      >
        {options.map((o, i) => {
          const selected = o.value === value;
          return (
            <button
              key={String(o.value)}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected || (index < 0 && i === 0) ? 0 : -1}
              onClick={() => onChange(o.value)}
              className={`relative rounded-[0.55rem] px-3 py-1 text-sm focus-visible:outline-2 focus-visible:outline-accent ${selected ? "text-fg" : "text-muted hover:text-fg"}`}
            >
              {selected && (
                <motion.span
                  layoutId={`${id}-indicator`}
                  className="absolute inset-0 rounded-[0.55rem] bg-surface shadow-sm"
                />
              )}
              <span className="relative">{o.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
