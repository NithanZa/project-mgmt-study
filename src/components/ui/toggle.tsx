"use client";

import { motion } from "motion/react";

export interface ToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function Toggle({ label, checked, onChange }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2 rounded-md text-sm text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <span
        className={`flex h-5 w-9 items-center rounded-full border border-line p-0.5 ${checked ? "justify-end bg-accent" : "justify-start bg-surface-2"}`}
      >
        <motion.span layout className="size-3.5 rounded-full bg-surface shadow-sm" />
      </span>
      {label}
    </button>
  );
}
