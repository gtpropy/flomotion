export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight?: number | string;
  fontStyle?: string;
  letterSpacing?: number;
  wordSpacing?: number;
  lineHeight?: number;
  textTransform?: string;
  fontFeatureSettings?: string;
  fontVariationSettings?: string;
  direction?: "ltr" | "rtl";
  lang?: string;
  whiteSpace?: string;
  textAlign?: string;
  hyphens?: string;
  textWrap?: string;
}

export interface GlyphBox {
  /** The character(s) in this box (grapheme cluster). */
  ch: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Index into the source string. */
  index: number;
}

export interface LineBox {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  baseline: number;
  glyphs: GlyphBox[];
  /** Words on the line, with boxes. */
  words: Array<{
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
    index: number;
  }>;
}

export interface TextMetrics {
  lines: LineBox[];
  width: number;
  height: number;
  /** Cache key: hash of text + style + font hashes + width. */
  key: string;
}

export interface MeasureOptions {
  maxWidth?: number;
}

/** Measures laid-out text. Implemented in @flomotion/render with headless Chrome. */
export interface TextMeasurer {
  measureText(text: string, style: TextStyle, opts?: MeasureOptions): TextMetrics;
}
