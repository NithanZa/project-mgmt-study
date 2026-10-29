import { useEffect, useState } from "react";

export type Speed = 1 | 4;
const INTERVAL: Record<Speed, number> = { 1: 250, 4: 60 };

/** Steps through a run's ticks; a new `runKey` restarts playback from the first tick. */
export function usePlayback(runKey: string, length: number) {
  const [run, setRun] = useState({ key: runKey, tick: 0, playing: true });
  const [speed, setSpeed] = useState<Speed>(4);
  if (run.key !== runKey) setRun({ key: runKey, tick: 0, playing: true });

  useEffect(() => {
    if (!run.playing) return;
    const id = setInterval(() => {
      setRun((r) => (r.tick >= length - 1 ? { ...r, playing: false } : { ...r, tick: r.tick + 1 }));
    }, INTERVAL[speed]);
    return () => clearInterval(id);
  }, [run.playing, speed, length]);

  const atEnd = run.tick >= length - 1;
  return {
    tick: Math.min(run.tick, length - 1),
    playing: run.playing,
    speed,
    interval: INTERVAL[speed],
    toggle: () => setRun((r) => (atEnd ? { ...r, tick: 0, playing: true } : { ...r, playing: !r.playing })),
    restart: () => setRun((r) => ({ ...r, tick: 0, playing: true })),
    setSpeed,
  };
}
