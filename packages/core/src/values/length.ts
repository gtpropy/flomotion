import { CodeCutError } from "../errors.js";

/** 120 (px), "50%", "10vw", "10vh", "120px". */
export type Length = number | string;
export interface ParsedLength {
  unit: "px" | "%" | "vw" | "vh";
  value: number;
}
export interface LengthBasis {
  parent: number;
  vw: number;
  vh: number;
}

export function parseLength(input: Length): ParsedLength {
  if (typeof input === "number") return { unit: "px", value: input };
  const m = input.trim().match(/^(-?\d+(?:\.\d+)?|-?\.\d+)\s*(px|%|vw|vh)?$/);
  if (!m) {
    throw new CodeCutError("invalid_value", `Invalid length: ${JSON.stringify(input)}`, {
      fix: 'Use pixels (120), "50%", "10vw" or "10vh".',
    });
  }
  return { unit: (m[2] ?? "px") as ParsedLength["unit"], value: Number(m[1]) };
}

/** Resolve to pixels. `%` is relative to `basis.parent`, vw/vh to the composition. */
export function resolveLength(input: Length, basis: LengthBasis): number {
  const { unit, value } = parseLength(input);
  switch (unit) {
    case "px":
      return value;
    case "%":
      return (value / 100) * basis.parent;
    case "vw":
      return (value / 100) * basis.vw;
    case "vh":
      return (value / 100) * basis.vh;
  }
}
