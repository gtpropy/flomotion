/** Seeded PRNG (mulberry32). Pure: same seed, same sequence. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Integer lattice hash to [-1, 1]. */
function lattice(i: number, seed: number): number {
  let h = (Math.imul(i | 0, 0x27d4eb2d) ^ Math.imul((seed | 0) + 0x165667b1, 0x85ebca6b)) >>> 0;
  h = (h ^ (h >>> 15)) >>> 0;
  h = Math.imul(h, 0x2c1b3c6d) >>> 0;
  h = (h ^ (h >>> 12)) >>> 0;
  h = Math.imul(h, 0x297a2d39) >>> 0;
  h = (h ^ (h >>> 15)) >>> 0;
  return (h / 4294967296) * 2 - 1;
}

const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);

/** Smooth 1D value noise in [-1, 1]. Pure function of (x, seed). */
export function noise1D(x: number, seed = 1): number {
  const i = Math.floor(x);
  const f = x - i;
  const a = lattice(i, seed);
  const b = lattice(i + 1, seed);
  return a + (b - a) * fade(f);
}

/** Smooth 2D value noise in [-1, 1]. */
export function noise2D(x: number, y: number, seed = 1): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const h = (ix: number, iy: number) => lattice(ix + Math.imul(iy, 0x9e3779b1), seed);
  const u = fade(xf);
  const v = fade(yf);
  const a = h(xi, yi);
  const b = h(xi + 1, yi);
  const c = h(xi, yi + 1);
  const d = h(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

/** Hash string to a 32-bit seed (FNV-1a). Used to derive per-element seeds from ids. */
export function hashSeed(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
