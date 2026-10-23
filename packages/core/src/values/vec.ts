export type Vec2 = [number, number];
export type Vec3 = [number, number, number];

export const vec2 = (v: number | readonly number[], fallback: Vec2 = [0, 0]): Vec2 =>
  typeof v === "number" ? [v, v] : [v[0] ?? fallback[0], v[1] ?? fallback[1]];

export const vec3 = (v: number | readonly number[], fallback: Vec3 = [0, 0, 0]): Vec3 =>
  typeof v === "number"
    ? [v, v, v]
    : [v[0] ?? fallback[0], v[1] ?? fallback[1], v[2] ?? fallback[2]];
