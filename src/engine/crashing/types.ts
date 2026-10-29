export interface CrashTask {
  id: string;
  name: string;
  days: number;
  deps: string[];
  /** Crash limit: the task cannot go below this many days. */
  minDays: number;
  /** Direct cost of shortening the task by one day. */
  costPerDay: number;
  /** Grid position in the network drawing. */
  pos: { col: number; row: number };
}
