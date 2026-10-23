import { CodeCutError } from "../errors.js";

/** Degrees (45), "45deg", "0.25turn", "1rad". */
export type Angle = number | string;

export function parseAngle(input: Angle): number {
  if (typeof input === "number") return input;
  const m = input.trim().match(/^(-?\d+(?:\.\d+)?|-?\.\d+)\s*(deg|turn|rad|grad)?$/);
  if (!m) {
    throw new CodeCutError("invalid_value", `Invalid angle: ${JSON.stringify(input)}`, {
      fix: 'Use degrees (45) or "0.25turn".',
    });
  }
  const v = Number(m[1]);
  switch (m[2]) {
    case "turn":
      return v * 360;
    case "rad":
      return (v * 180) / Math.PI;
    case "grad":
      return v * 0.9;
    default:
      return v;
  }
}
