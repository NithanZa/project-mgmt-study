/** Day span of the Gantt and lane axis. */
export const AXIS_DAYS = 30;

export const atDay = (day: number) => `${(day / AXIS_DAYS) * 100}%`;
