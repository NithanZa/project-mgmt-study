"use client";

import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import type { Station } from "@/lib/line-sim";
import { COLUMNS } from "./line";

export interface InvestPanelProps {
  stations: Station[];
  /** Throughput change per station id from investing in it. */
  deltas: Record<string, number>;
  invested: string | null;
  tried: string[];
  onInvest: (stationId: string) => void;
}

const signed = (n: number) => (n > 0 ? `+${n}` : String(n));

export function InvestPanel({ stations, deltas, invested, tried, onInvest }: InvestPanelProps) {
  return (
    <div className={`${COLUMNS} w-full items-end`}>
      <span className="pb-1 text-xs leading-tight text-muted">Invest +50% in</span>
      {stations.map((s) => {
        const delta = Math.round(deltas[s.id]);
        const shown = tried.includes(s.id);
        return (
          <div key={s.id} className="flex min-w-0 flex-col items-stretch gap-1">
            <span className="flex h-4 justify-center sm:h-5">
              {shown && (
                <motion.span
                  data-delta={s.id}
                  className={`rounded-full px-1.5 text-xs leading-4 font-semibold sm:leading-5 tabular-nums ${delta > 0 ? "bg-ok/15 text-ok" : "bg-surface-2 text-muted"}`}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ opacity: { duration: 0.18, ease: "easeOut" } }}
                >
                  {signed(delta)}
                </motion.span>
              )}
            </span>
            <Button
              aria-pressed={invested === s.id}
              aria-label={`Invest +50% in ${s.name}${shown ? `, throughput ${signed(delta)} per hour` : ""}`}
              onClick={() => onInvest(s.id)}
              className={`h-8! justify-center px-0! text-xs sm:h-9! ${invested === s.id ? "border-accent bg-accent-soft" : ""}`}
            >
              {s.name}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
