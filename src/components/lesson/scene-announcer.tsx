"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

const DELAY_MS = 400;

/**
 * Reads the scene's `aria-label` aloud once it has held still for 400 ms: after every
 * beat change (even when the label is unchanged) and after controls or playback change
 * it. One trailing announcement per burst, so dragging a slider or playing a
 * simulation never floods the queue.
 */
export function SceneAnnouncer({
  panel,
  beat,
}: {
  panel: RefObject<HTMLElement | null>;
  beat: number;
}) {
  const [message, setMessage] = useState({ id: 0, text: "" });
  const announced = useRef("");

  useEffect(() => {
    const root = panel.current;
    if (!root) return;
    let repeat = true;
    let timer = 0;
    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const text = root.querySelector("[data-scene]")?.getAttribute("aria-label") ?? "";
        if (!text || (text === announced.current && !repeat)) return;
        announced.current = text;
        repeat = false;
        setMessage((m) => ({ id: m.id + 1, text }));
      }, DELAY_MS);
    };
    schedule();
    const observer = new MutationObserver(schedule);
    observer.observe(root, { subtree: true, attributes: true, attributeFilter: ["aria-label"] });
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, [panel, beat]);

  // A fresh node per message, so a repeated label is announced again.
  return (
    <div aria-live="polite" className="sr-only" data-scene-announcer>
      <p key={message.id}>{message.text}</p>
    </div>
  );
}
