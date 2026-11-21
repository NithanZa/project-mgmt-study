"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

const SpotlightValue = createContext<string | null>(null);
const SetSpotlight = createContext<(id: string | null) => void>(() => {});

/** Holds the copy term the learner is pointing at, for the scene to light up. */
export function SpotlightProvider({ children }: { children: ReactNode }) {
  const [spot, setSpot] = useState<string | null>(null);
  return (
    <SetSpotlight value={setSpot}>
      <SpotlightValue value={spot}>{children}</SpotlightValue>
    </SetSpotlight>
  );
}

/** The id of the active term, or null. */
export function useSpotlight(): string | null {
  return useContext(SpotlightValue);
}

export function useSetSpotlight(): (id: string | null) => void {
  return useContext(SetSpotlight);
}

export interface SpotAttributes {
  "data-spot": string;
  "data-lit"?: "";
}

function spotAttributes(ids: string[], current: string | null): SpotAttributes {
  const lit = current !== null && ids.includes(current);
  return lit ? { "data-spot": ids.join(" "), "data-lit": "" } : { "data-spot": ids.join(" ") };
}

/** Attributes for a scene element that a `Term` with this id lights up. */
export function useSpot(id: string): SpotAttributes {
  return spotAttributes([id], useSpotlight());
}

/** Attributes for a scene element that answers to several terms. */
export function useSpots(ids: string[]): SpotAttributes {
  return spotAttributes(ids, useSpotlight());
}
