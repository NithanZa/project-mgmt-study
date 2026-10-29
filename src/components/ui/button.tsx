import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost" | "icon";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-accent text-surface hover:opacity-90 px-4 h-9 font-medium",
  ghost: "border border-line text-fg hover:bg-surface-2 px-3 h-9",
  icon: "border border-line text-fg hover:bg-surface-2 size-9 justify-center",
};

/**
 * `disabled` renders as `aria-disabled`: a button that disables itself while focused
 * (Next, Reset) keeps focus instead of dropping it to <body>, looks disabled and
 * ignores clicks.
 */
export function Button({
  variant = "ghost",
  className = "",
  type = "button",
  disabled,
  onClick,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  const inert = disabled || props["aria-disabled"] === true || props["aria-disabled"] === "true";
  return (
    <button
      type={type}
      {...props}
      aria-disabled={inert || undefined}
      onClick={inert ? undefined : onClick}
      className={`inline-flex items-center gap-2 rounded-md text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent aria-disabled:pointer-events-none aria-disabled:opacity-40 ${VARIANTS[variant]} ${className}`}
    />
  );
}
