export type Rng = () => number;

/** Seeded uniform generator in [0, 1). */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Standard normal sample (Box-Muller). */
export function normal(rng: Rng): number {
  let u = 0;
  while (u === 0) u = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
}

/** Gamma(shape, 1) sample (Marsaglia-Tsang). */
export function gamma(shape: number, rng: Rng): number {
  if (shape < 1) return gamma(shape + 1, rng) * rng() ** (1 / shape);
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  for (;;) {
    let x: number;
    let v: number;
    do {
      x = normal(rng);
      v = 1 + c * x;
    } while (v <= 0);
    v = v * v * v;
    const u = rng();
    if (u < 1 - 0.0331 * x ** 4) return d * v;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v;
  }
}

/** Beta-PERT sample on [o, p] with mode m. */
export function betaPert(o: number, m: number, p: number, rng: Rng): number {
  if (p === o) return o;
  const alpha = 1 + (4 * (m - o)) / (p - o);
  const beta = 1 + (4 * (p - m)) / (p - o);
  const x = gamma(alpha, rng);
  const y = gamma(beta, rng);
  return o + (p - o) * (x / (x + y));
}
