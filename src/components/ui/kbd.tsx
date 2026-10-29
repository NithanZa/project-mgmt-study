import type { ReactNode } from "react";

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex min-w-5 items-center justify-center rounded border border-line bg-surface-2 px-1 font-mono text-[0.7rem] leading-4 text-muted">
      {children}
    </kbd>
  );
}
