"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, type RefObject } from "react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { FADE } from "@/components/transitions";

const SHORTCUTS: { keys: string[]; label: string }[] = [
  { keys: ["←", "→"], label: "Previous / next step" },
  { keys: ["p", "n"], label: "Previous / next lesson" },
  { keys: ["?"], label: "Show shortcuts" },
  { keys: ["Esc"], label: "Close this dialog" },
];

export interface ShortcutsDialogProps {
  open: boolean;
  onClose: () => void;
  /** Receives focus once the dialog has faded out. */
  returnFocus: RefObject<HTMLElement | null>;
}

export function ShortcutsDialog({ open, onClose, returnFocus }: ShortcutsDialogProps) {
  return (
    <AnimatePresence onExitComplete={() => returnFocus.current?.focus()}>
      {open && <Panel key="shortcuts" onClose={onClose} />}
    </AnimatePresence>
  );
}

function Panel({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    // The dialog stays modal while it fades out; AnimatePresence removes it afterwards.
    <motion.dialog
      ref={ref}
      aria-labelledby="shortcuts-title"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={FADE}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 m-0 flex size-full max-h-none max-w-none items-center justify-center bg-black/40 p-4 backdrop:bg-transparent"
    >
      <div className="w-full max-w-sm rounded-lg border border-line bg-surface p-5 text-fg shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="shortcuts-title" className="text-base font-semibold">
            Keyboard shortcuts
          </h2>
          <Button variant="icon" aria-label="Close" onClick={onClose} className="size-8">
            ×
          </Button>
        </div>
        <dl className="flex flex-col gap-2.5 text-sm">
          {SHORTCUTS.map(({ keys, label }) => (
            <div key={label} className="flex items-center justify-between gap-4">
              <dt className="flex gap-1">
                {keys.map((k) => (
                  <Kbd key={k}>{k}</Kbd>
                ))}
              </dt>
              <dd className="text-muted">{label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </motion.dialog>
  );
}
