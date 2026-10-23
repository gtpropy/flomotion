import type { AudioEvent, Ledger, LedgerEntry } from "@codecut/core";

import { isNode, walk, type CCNode } from "@codecut/core";

/** File sources of Image, Svg, Video and Clip elements written as plain paths. */
export function collectAssetSrcs(root: CCNode): string[] {
  const out = new Set<string>();
  walk(root, (n) => {
    if (!["Image", "Svg", "Video", "Clip"].includes(n.name)) return;
    const s = n.props.src;
    if (typeof s === "string" && s && !/^data:|^\s*</.test(s)) out.add(s);
  });
  void isNode;
  return [...out];
}

export interface LicenseReport {
  /** Every ledger entry the project uses (sounds, fonts, voices, images). */
  used: LedgerEntry[];
  /** Plain text credits for entries that require attribution; empty when none do. */
  credits: string;
  /** Problems a render must not ignore. */
  problems: string[];
  /** Entries that need attribution. */
  attribution: LedgerEntry[];
  /** Entries whose source asks for a credit although the licence does not require one. */
  recommended: LedgerEntry[];
  /** Project files you supplied yourself (not downloaded): no ledger entry is required, the rights are yours to confirm. */
  own: string[];
}

const sameFile = (e: LedgerEntry, src: string) =>
  !!e.file && (src === e.file || src.endsWith(e.file) || e.file.endsWith(src.replace(/^\.\//, "")));

/** Which ledger entries a build uses, the credits text, and licence problems. */
export function licenseReport(
  ledger: Ledger,
  audio: AudioEvent[],
  fontIds: string[],
  fontFamilies: string[] = [],
  images: string[] = [],
): LicenseReport {
  const used = new Map<string, LedgerEntry>();
  const problems: string[] = [];
  const own = new Set<string>();
  const key = (e: LedgerEntry) => `${e.kind}:${e.source}:${e.id}`;
  for (const ev of audio) {
    const m = ev.src.match(/^(freesound|local):([\w.-]+)$/);
    const e = ledger.entries.find((x) =>
      m ? x.source === m[1] && x.id === m[2] : sameFile(x, ev.src),
    );
    if (e) used.set(key(e), e);
    else if (m || /^https?:/.test(ev.src) || /(^|\/)\.codecut\/assets\//.test(ev.src))
      problems.push(`${ev.src} has no ledger entry`);
    else own.add(ev.src);
  }
  const MANAGED = /^(\.\/)?assets\/(third-party|captures|brand|imported)\//;
  for (const src of images) {
    const e = ledger.entries.find((x) => sameFile(x, src));
    if (e) used.set(key(e), e);
    else if (MANAGED.test(src)) problems.push(`${src} has no ledger entry`);
    else own.add(src);
  }
  const fams = new Set(fontFamilies);
  for (const e of ledger.entries) {
    if (e.kind === "font" && (fontIds.includes(e.id) || (e.family && fams.has(e.family))))
      used.set(key(e), e);
  }
  for (const e of used.values()) {
    if (!e.commercialOk)
      problems.push(`${e.kind} ${e.id} (${e.license}) is not cleared for commercial use`);
    if (e.license === "unknown") problems.push(`${e.kind} ${e.id} has an unknown licence`);
  }
  const attribution = [...used.values()].filter((e) => e.attributionRequired);
  const recommended = [...used.values()].filter(
    (e) => e.creditRecommended && !e.attributionRequired,
  );
  const line = (e: LedgerEntry) =>
    `"${e.title ?? e.id}" by ${e.author ?? "unknown"} (${e.license})${e.url ? ` - ${e.url}` : ""}`;
  const credits =
    attribution.length || recommended.length
      ? [
          ...(attribution.length ? ["Credits", "", ...attribution.map(line), ""] : []),
          ...(recommended.length
            ? [
                "Credits requested by the source (not required by the licence)",
                "",
                ...recommended.map(line),
                "",
              ]
            : []),
        ].join("\n")
      : "";
  return { used: [...used.values()], credits, problems, attribution, recommended, own: [...own] };
}
