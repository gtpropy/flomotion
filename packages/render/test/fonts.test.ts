import { describe, expect, it } from "vitest";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { FontDecl } from "@codecut/core";
import {
  css2FamilySpec,
  fontGate,
  missingGlyphs,
  parseGoogleCss,
  readLedger,
  readLock,
  resolveFromLock,
  syncFonts,
  measureInChrome,
  fontSalt,
} from "../src/index.js";

const online = await fetch("https://fonts.googleapis.com/css2?family=Inter", {
  signal: AbortSignal.timeout(8000),
}).then(
  (r) => r.ok,
  () => false,
);

describe("css2 query builder (per developers.google.com/fonts/docs/css2)", () => {
  it("builds static, variable and italic specs with sorted axes", () => {
    expect(
      css2FamilySpec({ id: "a", family: "Inter", source: "google", weights: [600, 400] }),
    ).toBe("Inter:wght@400;600");
    expect(
      css2FamilySpec({
        id: "a",
        family: "Space Grotesk",
        source: "google",
        variable: true,
        axes: { wght: [300, 700] },
      }),
    ).toBe("Space+Grotesk:wght@300..700");
    expect(
      css2FamilySpec({
        id: "a",
        family: "Inter",
        source: "google",
        weights: [400, 700],
        styles: ["normal", "italic"],
      }),
    ).toBe("Inter:ital,wght@0,400;0,700;1,400;1,700");
    expect(
      css2FamilySpec({
        id: "a",
        family: "Roboto Flex",
        source: "google",
        variable: true,
        axes: { wght: [100, 900], opsz: [8, 144] },
      }),
    ).toBe("Roboto+Flex:opsz,wght@8..144,100..900");
  });
  it("parses @font-face blocks per subset", () => {
    const faces = parseGoogleCss(
      `/* latin */\n@font-face {\n font-family: 'X';\n font-style: normal;\n font-weight: 300 700;\n src: url(https://fonts.gstatic.com/a.woff2) format('woff2');\n unicode-range: U+0000-00FF;\n}`,
    );
    expect(faces).toEqual([
      {
        subset: "latin",
        family: "X",
        style: "normal",
        weight: [300, 700],
        url: "https://fonts.gstatic.com/a.woff2",
        unicodeRange: "U+0000-00FF",
      },
    ]);
  });
});

describe.skipIf(!online)("font sync, lock, gate, glyphs, layout (live Google Fonts)", () => {
  const root = mkdtempSync(join(tmpdir(), "cc-fonts-"));
  const decls: FontDecl[] = [
    {
      id: "display",
      family: "Space Grotesk",
      source: "google",
      variable: true,
      axes: { wght: [300, 700] },
      subsets: ["latin"],
    },
    {
      id: "deva",
      family: "Noto Sans Devanagari",
      source: "google",
      weights: [400],
      subsets: ["devanagari"],
    },
  ];
  it("syncs, locks, ledgers and resolves offline", async () => {
    const r = await syncFonts({ projectRoot: root, decls });
    expect(r.synced.map((s) => s.id)).toEqual(["display", "deva"]);
    const lock = readLock(root);
    expect(Object.keys(lock.fonts)).toEqual(["display", "deva"]);
    const ledger = readLedger(root);
    expect(ledger.entries.every((e) => e.kind === "font" && e.license !== "")).toBe(true);
    expect(ledger.entries.some((e) => e.license === "OFL-1.1")).toBe(true);
    const f = resolveFromLock(root, decls[0]!);
    expect(f.variable).toBe(true);
    expect(f.axes?.wght).toEqual([300, 700]);
    // second sync is a no-op against the lock
    const again = await syncFonts({ projectRoot: root, decls });
    expect(again.synced.every((s) => s.skipped)).toBe(true);
  }, 120_000);

  it("passes the gate, measures text deterministically, and finds missing glyphs", async () => {
    const fonts = decls.map((d) => resolveFromLock(root, d));
    const gate = await fontGate(root, fonts, ["display", "deva"], {
      display: "Ship videos",
      deva: "नमस्ते",
    });
    expect(gate.checked).toHaveLength(2);
    const style = { fontFamily: '"Space Grotesk"', fontSize: 80, fontWeight: 700, lineHeight: 1.1 };
    const req = {
      text: "Ship videos as code that keeps going on",
      style,
      opts: { maxWidth: 500 },
      key: "k1",
    };
    const a = await measureInChrome(root, fonts, [req]);
    const b = await measureInChrome(root, fonts, [req]);
    expect(a.k1!.lines.length).toBeGreaterThan(1);
    expect(a.k1!.lines.map((l) => l.text)).toEqual(b.k1!.lines.map((l) => l.text));
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    expect(fontSalt(fonts)).toBe(fontSalt(fonts));
    // glyph coverage: Devanagari is not in the latin subset of Space Grotesk
    expect(missingGlyphs(root, fonts[0]!, "Hello नमस्ते")).toEqual(
      expect.arrayContaining(["न", "म"]),
    );
    expect(missingGlyphs(root, fonts[1]!, "नमस्ते")).toEqual([]);
    expect(missingGlyphs(root, fonts[0]!, "Hello")).toEqual([]);
  }, 120_000);

  it("fails with the font id when a file is missing or changed, and on a stale lock", async () => {
    const lock = readLock(root);
    const file = join(root, lock.fonts.display!.files[0]!.path);
    const backup = readFileSync(file);
    writeFileSync(file, Buffer.concat([backup, Buffer.from("x")]));
    expect(() => resolveFromLock(root, decls[0]!)).toThrow(/changed on disk/);
    rmSync(file);
    expect(() => resolveFromLock(root, decls[0]!)).toThrow(/Font "display".*missing/);
    writeFileSync(file, backup);
    expect(() => resolveFromLock(root, { ...decls[0]!, weights: [900] })).toThrow(
      /changed since it was locked/,
    );
    expect(() => resolveFromLock(root, { id: "nope", family: "Nope", source: "google" })).toThrow(
      /not in .codecut\/fonts.lock.json/,
    );
  });

  it("local fonts need a licence and variable fonts report axes", async () => {
    const lock = readLock(root);
    const src = join(root, lock.fonts.display!.files[0]!.path);
    mkdirSync(join(root, "fonts"), { recursive: true });
    copyFileSync(src, join(root, "fonts", "Acme.woff2"));
    await expect(
      syncFonts({
        projectRoot: root,
        decls: [{ id: "brand", family: "Acme", source: "./fonts/Acme.woff2" }],
      }),
    ).rejects.toThrow(/needs a license/);
    const r = await syncFonts({
      projectRoot: root,
      decls: [{ id: "brand", family: "Acme", source: "./fonts/Acme.woff2", license: "OFL-1.1" }],
    });
    expect(r.synced[0]!.route).toBe("local");
    expect(existsSync(join(root, "fonts", "Acme.woff2"))).toBe(true);
  });
});
