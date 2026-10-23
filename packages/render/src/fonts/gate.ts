import { join } from "node:path";
import { CodeCutError, type ResolvedFont } from "@codecut/core";
import { openFontPage, remoteRequests } from "./chrome.js";

export interface GateReport {
  checked: Array<{ id: string; family: string; faces: number }>;
}

/**
 * Before the first frame: every used font must load in headless Chrome (document.fonts.load for each
 * family, weight and style) or the render fails naming the font id and path. Never falls back silently.
 */
export async function fontGate(
  root: string,
  fonts: ResolvedFont[],
  used: string[],
  samples: Record<string, string> = {},
): Promise<GateReport> {
  const targets = fonts.filter((f) => used.includes(f.id));
  const report: GateReport = { checked: [] };
  for (const f of targets) {
    if (f.source === "system") continue;
    if (!f.files.length)
      throw new CodeCutError("font_error", `Font "${f.id}" (${f.family}) has no files on disk`, {
        fix: "Run `codecut fonts sync`.",
        details: { id: f.id },
      });
  }
  const live = targets.filter((f) => f.source !== "system");
  if (!live.length) return report;
  const session = await openFontPage(root, live);
  try {
    for (const f of live) {
      const sample = samples[f.id] || "Aa";
      const combos = new Set<string>();
      for (const file of f.files) {
        const weights = Array.isArray(file.weight)
          ? [file.weight[0], file.weight[1]]
          : [file.weight];
        for (const w of weights)
          combos.add(`${file.style ?? "normal"} ${w} 20px ${JSON.stringify(f.family)}`);
      }
      for (const file of f.files) {
        const url = `file://${join(root, file.path)}`;
        const ok = await session.page.evaluate(
          async (family, u, fmt) => {
            try {
              const ff = new FontFace(
                family,
                `url(${JSON.stringify(u)}) format(${JSON.stringify(fmt)})`,
              );
              await ff.load();
              return ff.status === "loaded";
            } catch {
              return false;
            }
          },
          f.family,
          url,
          file.format,
        );
        if (!ok)
          throw new CodeCutError("font_error", `Font "${f.id}" failed to load: ${file.path}`, {
            fix: "The file is corrupt or not a font. Re-run `codecut fonts sync --force`.",
            details: { id: f.id, path: file.path },
          });
      }
      let faces = 0;
      for (const c of combos) {
        const loaded = await session.page.evaluate(
          async (spec, text) => (await document.fonts.load(spec, text)).length,
          c,
          sample,
        );
        faces += loaded;
        if (loaded === 0 && !f.files.some((x) => x.unicodeRange)) {
          throw new CodeCutError(
            "font_error",
            `Font "${f.id}" (${f.family}): no face matched "${c}"`,
            { fix: "Declare the weight/style you use in <Font weights=…>.", details: { id: f.id } },
          );
        }
      }
      report.checked.push({ id: f.id, family: f.family, faces });
    }
    const remote = remoteRequests(session);
    if (remote.length)
      throw new CodeCutError(
        "font_error",
        `Fonts tried to reach the network at render time: ${remote[0]}`,
        { fix: "All font files must be local." },
      );
  } finally {
    await session.close();
  }
  return report;
}
