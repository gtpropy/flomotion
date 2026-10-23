import type { TypeToken } from "./resolve/types.js";

/** A font declaration as data (also what `<Font>` carries). */
export interface FontDecl {
  id: string;
  family: string;
  source: string;
  weights?: number[];
  styles?: string[];
  variable?: boolean;
  axes?: Record<string, [number, number]>;
  subsets?: string[];
  license?: string;
  fallback?: string[];
}

/** A Look is data: palette, fonts, type scale, easing, signature transition, texture, sounds. */
export interface LookSpec {
  id: string;
  name: string;
  description?: string;
  /** Colours addressable as $brand.<key> / $color.<key>. */
  palette: Record<string, string>;
  fonts: FontDecl[];
  /** Type tokens: $type.display, $type.body, $type.mono, $type.numerals. */
  type: Record<string, TypeToken>;
  easing: Record<string, string>;
  transition: { type: string; duration: number };
  /** Grain amount 0..1. */
  grain: number;
  /** Sound palette by tag: "hit/land" -> "freesound:123". */
  sound: Record<string, string>;
  background?: string;
}

const looks = new Map<string, LookSpec>();

export function defineLook(look: LookSpec): LookSpec {
  looks.set(look.id, look);
  return look;
}
export const getLook = (id: string): LookSpec | undefined => looks.get(id);
export const listLooks = (): LookSpec[] => [...looks.values()];
