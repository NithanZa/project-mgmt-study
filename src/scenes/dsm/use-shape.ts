import { useLayoutEffect, useRef, useState } from "react";

export interface Shape {
  /** Wide canvas: graph beside the matrix instead of above it. */
  side: boolean;
  /** Room for activity names to the left of the matrix. */
  names: boolean;
  /** Taller than wide: the full-canvas graph runs top to bottom. */
  tall: boolean;
}

/** Graph strip takes this share of the height when stacked above the matrix. */
export const GRAPH_SHARE = 0.24;
export const NAME_W = "8.5rem";

function shapeOf(w: number, h: number): Shape {
  const side = w >= h * 1.3;
  const matrix = Math.min(w, h * (1 - GRAPH_SHARE) - 12);
  return { side, names: !side && w - matrix >= 150, tall: h > w * 1.1 };
}

/**
 * Coarse layout flags for the referenced element. Only flag changes re-render,
 * so resizing (e.g. while controls slide in) is left to CSS.
 */
export function useShape<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [shape, setShape] = useState<Shape | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => {
      const next = shapeOf(el.clientWidth, el.clientHeight);
      setShape((prev) =>
        prev && prev.side === next.side && prev.names === next.names && prev.tall === next.tall
          ? prev
          : next,
      );
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, shape] as const;
}
