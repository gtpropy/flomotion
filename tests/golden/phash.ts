import { readFileSync } from "node:fs";
import { PNG } from "pngjs";

/** Grayscale box-downscale of a PNG to w×h. */
export function downscale(png: PNG, w: number, h: number): number[] {
  const out: number[] = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const x0 = Math.floor((x * png.width) / w);
      const x1 = Math.max(x0 + 1, Math.floor(((x + 1) * png.width) / w));
      const y0 = Math.floor((y * png.height) / h);
      const y1 = Math.max(y0 + 1, Math.floor(((y + 1) * png.height) / h));
      let sum = 0;
      let n = 0;
      for (let yy = y0; yy < y1; yy++) {
        for (let xx = x0; xx < x1; xx++) {
          const i = (yy * png.width + xx) * 4;
          sum += 0.299 * png.data[i]! + 0.587 * png.data[i + 1]! + 0.114 * png.data[i + 2]!;
          n++;
        }
      }
      out.push(sum / n);
    }
  }
  return out;
}

/** 256-bit difference hash (17×16 grayscale, horizontal gradients) as hex. */
export function dHash(file: string): string {
  const png = PNG.sync.read(readFileSync(file));
  const g = downscale(png, 17, 16);
  let bits = "";
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) bits += g[y * 17 + x]! > g[y * 17 + x + 1]! ? "1" : "0";
  let hex = "";
  for (let i = 0; i < 256; i += 4) hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
  return hex;
}

export function hamming(a: string, b: string): number {
  let d = 0;
  for (let i = 0; i < a.length; i++) {
    let x = parseInt(a[i]!, 16) ^ parseInt(b[i]!, 16);
    while (x) {
      d += x & 1;
      x >>= 1;
    }
  }
  return d;
}

/** Standard deviation of luma over a 32×32 downscale: a flat or blank frame scores ~0. */
export function contrastScore(file: string): number {
  const g = downscale(PNG.sync.read(readFileSync(file)), 32, 32);
  const mean = g.reduce((a, b) => a + b, 0) / g.length;
  return Math.sqrt(g.reduce((a, b) => a + (b - mean) ** 2, 0) / g.length);
}

/** Small thumbnail PNG (for human review of baselines). */
export function thumbnail(file: string, w = 108): Buffer {
  const png = PNG.sync.read(readFileSync(file));
  const h = Math.round((w * png.height) / png.width);
  const out = new PNG({ width: w, height: h });
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const x0 = Math.floor((x * png.width) / w);
      const x1 = Math.max(x0 + 1, Math.floor(((x + 1) * png.width) / w));
      const y0 = Math.floor((y * png.height) / h);
      const y1 = Math.max(y0 + 1, Math.floor(((y + 1) * png.height) / h));
      let r = 0,
        g = 0,
        b = 0,
        n = 0;
      for (let yy = y0; yy < y1; yy++)
        for (let xx = x0; xx < x1; xx++) {
          const i = (yy * png.width + xx) * 4;
          r += png.data[i]!;
          g += png.data[i + 1]!;
          b += png.data[i + 2]!;
          n++;
        }
      const o = (y * w + x) * 4;
      out.data[o] = r / n;
      out.data[o + 1] = g / n;
      out.data[o + 2] = b / n;
      out.data[o + 3] = 255;
    }
  }
  return PNG.sync.write(out);
}
