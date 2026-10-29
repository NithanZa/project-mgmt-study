/** Three-point estimate in days: optimistic, most likely, pessimistic. */
export interface Estimate {
  o: number;
  m: number;
  p: number;
}

export interface Stream {
  id: string;
  name: string;
  shortlist: Estimate;
  confirm: Estimate;
}

export interface Config {
  streams: number;
  runs: number;
  seed: number;
  /** Rushed Speakers: their Confirm becomes 3 / 6 / 12. */
  rush?: boolean;
}

export interface Bin {
  from: number;
  to: number;
  count: number;
}

/** Sampled task durations of one run, indexed by stream. */
export interface RunSample {
  shortlist: number[];
  confirm: number[];
  prep: number;
  finish: number;
  /** Index of the stream that set the finish. */
  longest: number;
}

export interface Summary {
  runs: number;
  mean: number;
  p50: number;
  p80: number;
  p90: number;
  histogram: Bin[];
  /** Share of runs in which each stream was the longest; sums to 1. */
  criticality: number[];
}

export interface Simulation extends Summary {
  durations: Float64Array;
  sample(run: number): RunSample;
  /** Summary of the first `runs` runs, without re-simulating. */
  upTo(runs: number): Summary;
}

export interface ConvergencePoint {
  runs: number;
  /** Mean P80 across seeds. */
  p80: number;
  /** Standard deviation of P80 across seeds. */
  sd: number;
}
