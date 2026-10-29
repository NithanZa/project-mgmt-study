/** Three-point estimate in days: optimistic, most likely, pessimistic. */
export interface Estimate {
  o: number;
  m: number;
  p: number;
}

export interface PertTask {
  id: string;
  name: string;
  estimate: Estimate;
}
