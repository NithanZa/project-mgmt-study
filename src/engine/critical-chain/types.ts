export type ResourceId = "writer" | "designer" | "developer" | "manager";

export interface Task {
  id: string;
  name: string;
  /** Padded estimate people give, in days. */
  safe: number;
  /** 50%-confidence estimate, in days. */
  aggressive: number;
  deps: string[];
  resource: ResourceId;
}

export type Mode = "safe" | "aggressive";

export interface Schedule {
  mode: Mode;
  start: Record<string, number>;
  finish: Record<string, number>;
  makespan: number;
}

export type LinkKind = "dependency" | "resource";

export interface Link {
  from: string;
  to: string;
  kind: LinkKind;
}

export interface Chain {
  ids: string[];
  links: Link[];
}

export type BufferMethod = "half" | "rss";

export interface FeedingBuffer {
  /** Chain task the buffer protects. */
  before: string;
  /** Last task of the feeding path. */
  from: string;
  days: number;
}

export interface Buffers {
  project: { days: number; method: BufferMethod };
  feeding: FeedingBuffer[];
}

export type Zone = "green" | "yellow" | "red";

export interface FeverPoint {
  /** Share of planned chain days finished, 0 to 1. */
  chainComplete: number;
  /** Chain delay as a share of the project buffer; above 1 means overrun. */
  bufferUsed: number;
}
