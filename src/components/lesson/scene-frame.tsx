"use client";

import { motion } from "motion/react";
import { useLayoutEffect, useRef, type FocusEvent, type ReactNode } from "react";
import { FADE } from "@/components/transitions";

export interface SceneFrameProps {
  /** Summary of the scene's current state for assistive tech. */
  label: string;
  /** Readouts shown in the top-right strip. */
  readouts?: ReactNode;
  /** Controls for the current beat; pass nothing on beats without controls. */
  controls?: ReactNode;
  children: ReactNode;
}

const TABBABLE =
  ':is(button, input, select, textarea, a[href], [tabindex]):not([disabled], [tabindex="-1"])';

export function SceneFrame({ label, readouts, controls, children }: SceneFrameProps) {
  const scene = useRef<HTMLDivElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  /** The control that holds keyboard focus, while it holds it. */
  const focused = useRef<Element | null>(null);

  // A beat change can unmount or swap the focused control. Hand focus to the new strip's
  // first control, else to the scene, so it never drops to <body>. Runs after every
  // commit; it is a ref check unless a control had focus.
  useLayoutEffect(() => {
    const control = focused.current;
    if (!control || control.isConnected) return;
    const active = document.activeElement;
    if (active !== null && active !== document.body) return;
    focused.current = null;
    const next = controls ? strip.current?.querySelector<HTMLElement>(TABBABLE) : null;
    (next ?? scene.current)?.focus();
  });

  const onFocusIn = (e: FocusEvent<HTMLDivElement>) => {
    focused.current = e.target;
  };
  // Focus moving elsewhere (or a click on empty page) clears the record, so a later
  // unmount never pulls focus back. Removal leaves the control disconnected, which
  // keeps the record for the effect above.
  const onFocusOut = (e: FocusEvent<HTMLDivElement>) => {
    if (e.target.isConnected) focused.current = null;
  };

  return (
    <div className="flex h-full min-h-0 flex-col p-3 sm:p-4">
      <div className="flex min-h-12 items-start justify-end">
        {/* Not a live region: the lesson shell announces the scene label, which carries
            these numbers, once per burst of changes. */}
        <div data-readouts aria-live="off" className="flex flex-wrap justify-end gap-x-5 gap-y-1">
          {readouts}
        </div>
      </div>
      <div
        ref={scene}
        role="group"
        aria-label={label}
        data-scene
        tabIndex={-1}
        className="relative min-h-0 flex-1 rounded-md outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent focus-visible:outline-solid"
      >
        {children}
      </div>
      {/* Mounts at full height and only fades: animating its height would resize the
          canvas every frame and keep the scene's springs chasing it past 600 ms. */}
      {controls ? (
        <motion.div
          ref={strip}
          data-controls
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={FADE}
          onFocus={onFocusIn}
          onBlur={onFocusOut}
          className="flex flex-wrap items-end gap-x-4 gap-y-3 border-t border-line pt-3"
        >
          {controls}
        </motion.div>
      ) : null}
    </div>
  );
}
