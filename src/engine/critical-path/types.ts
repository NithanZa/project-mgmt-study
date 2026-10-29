export interface Task {
  id: string;
  name: string;
  weeks: number;
  deps: string[];
  /** Cell in the 5 × 3 network grid. */
  pos: { col: number; row: number };
}

export interface TaskTimes {
  es: number;
  ef: number;
  ls: number;
  lf: number;
  float: number;
  critical: boolean;
}

export interface CpmResult {
  duration: number;
  /** Topological order (Kahn, ties broken by input order). */
  order: string[];
  rows: Record<string, TaskTimes>;
  criticalPaths: string[][];
}
