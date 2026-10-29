const trim = (n: number, digits: number) =>
  Number.isInteger(n) ? String(n) : n.toFixed(digits);

export function days(n: number, digits = 1): string {
  const value = trim(Math.round(n * 10 ** digits) / 10 ** digits, digits);
  return `${value} ${value === "1" ? "day" : "days"}`;
}

export function money(n: number): string {
  return `${n < 0 ? "-" : ""}$${Math.round(Math.abs(n)).toLocaleString("en-US")}`;
}

export function pct(x: number, digits = 0): string {
  return `${(x * 100).toFixed(digits)}%`;
}
