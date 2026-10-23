import type { AnyControl } from "@codecut/components";

/** A valid sample value for any control, derived from its declaration. */
export function sample(c: AnyControl): unknown {
  const o = c.opts as { default?: unknown; min?: number; max?: number };
  if (o.default !== undefined) return o.default;
  switch (c.kind) {
    case "num":
    case "int":
    case "angle":
      return o.min !== undefined && o.max !== undefined
        ? Math.round((o.min + o.max) / 2)
        : (o.min ?? 1);
    case "bool":
      return true;
    case "enum":
      return c.values![0];
    case "text":
    case "richText":
      return "sample";
    case "color":
    case "fill":
      return "#ff3366";
    case "color3":
      return [0.1, 0.2, 0.3];
    case "vec2":
      return [1, 2];
    case "vec3":
      return [1, 2, 3];
    case "curve":
      return [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ];
    case "curves":
      return {
        rgb: [
          { x: 0, y: 0 },
          { x: 1, y: 1 },
        ],
      };
    case "ease":
      return "expo.out";
    case "file":
      return "a.cube";
    case "asset":
      return "./a.png";
    case "ref":
      return "#a";
    case "time":
      return "1s";
    case "length":
      return "10%";
    case "list":
      return [sample(c.item!)];
    case "group":
      return Object.fromEntries(Object.entries(c.fields!).map(([k, f]) => [k, sample(f)]));
    default:
      return undefined;
  }
}

