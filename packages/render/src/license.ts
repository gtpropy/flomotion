import type { AudioEvent, Ledger, LedgerEntry } from "@codecut/core";

export interface LicenseReport {
  /** Every ledger entry the project uses (sounds, fonts, voices, images). */
  used: LedgerEntry[];
  /** Plain text credits for entries that require attribution; empty when none do. */
  credits: string;
  /** Problems a render must not ignore. */
  problems: string[];
  /** Entries that need attribution. */
  attribution: LedgerEntry[];
}

const sameFile = (e: LedgerEntry, src: string) =>
  !!e.file && (src === e.file || src.endsWith(e.file) || e.file.endsWith(src.replace(/^\.\//, "")));

/** Which ledger entries a build uses, the credits text, and licence problems. */
export function licenseReport(
  ledger: Ledger,
  audio: AudioEvent[],
  fontIds: string[],
  fontFamilies: string[] = [],
): LicenseReport {
  const used = new Map<string, LedgerEntry>();
  const problems: string[] = [];
  const key = (e: LedgerEntry) => `${e.kind}:${e.source}:${e.id}`;
  for (const ev of audio) {
    const m = ev.src.match(/^freesound:(\d+)$/);
    const e = ledger.entries.find((x) => (m ? x.source === "freesound" && x.id === m[1] : sameFile(x, ev.src)));
    if (e) used.set(key(e), e);
    else problems.push(`${ev.src} has no ledger entry`);
  }
  const fams = new Set(fontFamilies);
  for (const e of ledger.entries) {
    if (e.kind === "font" && (fontIds.includes(e.id) || (e.family && fams.has(e.family)))) used.set(key(e), e);
  }
  for (const e of used.values()) {
    if (!e.commercialOk) problems.push(`${e.kind} ${e.id} (${e.license}) is not cleared for commercial use`);
    if (e.license === "unknown") problems.push(`${e.kind} ${e.id} has an unknown licence`);
  }
  const attribution = [...used.values()].filter((e) => e.attributionRequired);
  const credits = attribution.length
    ? [
        "Credits",
        "",
        ...attribution.map(
          (e) =>
            `"${e.title ?? e.id}" by ${e.author ?? "unknown"} (${e.license})${e.url ? ` - ${e.url}` : ""}`,
        ),
        "",
      ].join("\n")
    : "";
  return { used: [...used.values()], credits, problems, attribution };
}
