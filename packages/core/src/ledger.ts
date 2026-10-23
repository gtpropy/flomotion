/** One downloaded or supplied asset with its licence (sounds, fonts, images, models). */
export interface LedgerEntry {
  source: string;
  kind: "font" | "sound" | "image" | "model" | "video" | "voice";
  /** Source id (Freesound id, font id, ...). */
  id: string;
  family?: string;
  author?: string;
  /** Path relative to the project root. */
  file: string;
  hash: string;
  license: string;
  url?: string;
  attributionRequired: boolean;
  commercialOk: boolean;
  /** Measured loudest moment(s) in seconds, for sounds: `{ main: 0.31, land: 0.31 }` or a number. */
  peak?: number | Record<string, number>;
  duration?: number;
  tags?: string[];
  title?: string;
}

export interface Ledger {
  version: 1;
  entries: LedgerEntry[];
}

export const emptyLedger = (): Ledger => ({ version: 1, entries: [] });

export function upsertEntry(ledger: Ledger, e: LedgerEntry): Ledger {
  const rest = ledger.entries.filter((x) => !(x.kind === e.kind && x.source === e.source && x.id === e.id));
  return { version: 1, entries: [...rest, e].sort((a, b) => (a.kind + a.source + a.id).localeCompare(b.kind + b.source + b.id)) };
}

export const findEntry = (ledger: Ledger, kind: LedgerEntry["kind"], source: string, id: string) =>
  ledger.entries.find((x) => x.kind === kind && x.source === source && x.id === id);

const OPEN_FONT = /open font license|\bOFL\b|apache license|ubuntu font licen[sc]e|sil open|mit license/i;
export function classifyFontLicense(text: string | undefined): { license: string; commercialOk: boolean } {
  if (!text) return { license: "unknown", commercialOk: false };
  if (/SIL Open Font License|Open Font License|\bOFL\b/i.test(text)) return { license: "OFL-1.1", commercialOk: true };
  if (/apache license/i.test(text)) return { license: "Apache-2.0", commercialOk: true };
  if (/ubuntu font licen[sc]e/i.test(text)) return { license: "Ubuntu-font-1.0", commercialOk: true };
  if (/mit license/i.test(text)) return { license: "MIT", commercialOk: true };
  return { license: OPEN_FONT.test(text) ? "open" : "unknown", commercialOk: false };
}
