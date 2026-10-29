/** Little's law: average time in the system = average items in it ÷ average exit rate. */
export const cycleTimeFromLittle = (wip: number, throughput: number): number =>
  throughput > 0 ? wip / throughput : 0;
