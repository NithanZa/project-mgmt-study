"use client";

import { motion } from "motion/react";
import { useState } from "react";
import { BEST, BLOCK, FADE, NAME, SPRING } from "./model";

/** The partition order with the coupled block folded into one step. */
const STEPS = BEST.order.flatMap((id) =>
  BLOCK.includes(id) ? (id === BLOCK[0] ? [BLOCK] : []) : [[id]],
);
const CHIP =
  "flex items-center justify-center rounded-md border font-semibold [height:clamp(1.25rem,22cqmin,2.5rem)] [min-width:clamp(1.25rem,22cqmin,2.5rem)] [font-size:clamp(0.65rem,9cqmin,1rem)]";

export function IterationPlan() {
  const [open, setOpen] = useState(false);

  return (
    <ol
      aria-label="Iteration plan"
      className="flex size-full flex-wrap content-center items-center justify-center gap-[clamp(0.25rem,4cqmin,0.75rem)]"
    >
      {STEPS.map((ids) =>
        ids.length === 1 ? (
          <motion.li
            key={ids[0]}
            layout="position"
            transition={SPRING}
            aria-label={NAME[ids[0]]}
            data-step={ids[0]}
            className={`${CHIP} border-line bg-surface-2 px-1`}
          >
            {ids[0]}
          </motion.li>
        ) : (
          <li key="loop">
            <button
              type="button"
              aria-expanded={open}
              aria-label={`Iterate ${ids.map((id) => NAME[id]).join(", ")}`}
              onClick={() => setOpen((o) => !o)}
              data-step="iterate"
              className={`${CHIP} gap-1.5 border-constraint bg-surface px-2 text-constraint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent`}
            >
              <span aria-hidden>↻</span>
              <motion.span
                key={open ? "open" : "closed"}
                className="flex items-center gap-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={FADE}
              >
                {open ? (
                  <>
                    {ids.map((id, i) => (
                      <span key={id} className="flex items-center gap-1 text-fg">
                        {i > 0 && <span aria-hidden className="text-muted">→</span>}
                        <span data-loop={id}>{id}</span>
                      </span>
                    ))}
                    <span aria-hidden>↺</span>
                  </>
                ) : (
                  "iterate"
                )}
              </motion.span>
            </button>
          </li>
        ),
      )}
    </ol>
  );
}
