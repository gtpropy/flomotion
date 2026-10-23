import { afterAll, beforeAll, describe, expect, it } from "vitest";
import http from "node:http";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { PNG } from "pngjs";
import { licenseReport, readLedger } from "@codecut/render";
import { assertSafeSvg, classifyAssetLicense } from "../src/providers/assets.js";
import { classifyColors } from "../src/assets.js";
import { cleanup, connect, doubles, ToolError, tmpProject, type Harness } from "./harness.js";

const fails = async (p: Promise<unknown>, code: string) => {
  try {
    await p;
  } catch (e) {
    expect(e).toBeInstanceOf(ToolError);
    expect((e as ToolError).code).toBe(code);
    return e as ToolError;
  }
  throw new Error(`expected ${code}`);
};
const probe = (f: string) =>
  JSON.parse(
    execFileSync(
      "ffprobe",
      ["-v", "error", "-show_entries", "stream=width,height", "-of", "json", f],
      { encoding: "utf8" },
    ),
  ).streams[0] as { width: number; height: number };

describe("licences and safety of assets", () => {
  it("classifies licences: open, CC-BY, and everything else blocked", () => {
    for (const s of ["CC0-1.0", "cc0", "PDM-1.0", "Unlicense", "0BSD"])
      expect(classifyAssetLicense(s), s).toBe("CC0");
    for (const s of ["MIT", "Apache-2.0", "ISC", "BSD-3-Clause", "OFL-1.1"])
      expect(classifyAssetLicense(s), s).toBe("permissive");
    for (const s of ["CC-BY-4.0", "CC-BY-3.0", "by", "CC-BY"])
      expect(classifyAssetLicense(s), s).toBe("CC-BY");
    for (const s of ["CC-BY-SA-4.0", "CC-BY-NC-4.0", "CC-BY-ND-2.0", "GPL-3.0", "unknown", "by-sa"])
      expect(classifyAssetLicense(s), s).toBe("other");
  });
  it("rejects SVG that could run code or load things", () => {
    const ok =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="#fff"/><use href="#a"/></svg>';
    expect(() => assertSafeSvg(ok)).not.toThrow();
    for (const bad of [
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
      '<svg xmlns="http://www.w3.org/2000/svg" onload="x()"><path d="M0 0"/></svg>',
      '<svg xmlns="http://www.w3.org/2000/svg"><foreignObject><div/></foreignObject></svg>',
      '<svg xmlns="http://www.w3.org/2000/svg"><image href="https://evil.example/x.png"/></svg>',
      '<svg xmlns="http://www.w3.org/2000/svg"><a href="javascript:alert(1)"><path d="M0 0"/></a></svg>',
      "<html></html>",
    ])
      expect(() => assertSafeSvg(bad), bad.slice(0, 50)).toThrowError();
  });
  it("splits page colours into accents and neutrals, merges near duplicates, and gives contrast", () => {
    const r = classifyColors([
      { hex: "#4b5cff", uses: 30, where: { "action-bg": 6 } },
      { hex: "#4a5bfe", uses: 4, where: { svg: 4 } },
      { hex: "#ffffff", uses: 400, where: { bg: 400 } },
      { hex: "#111827", uses: 90, where: { "heading-text": 5, text: 85 } },
      { hex: "#ff7a45", uses: 3, where: { bg: 3 } },
    ]);
    expect(r.accents.map((a) => a.hex)).toEqual(["#4b5cff", "#ff7a45"]);
    expect(r.accents[0]!.uses).toBe(34); // the near duplicate was merged into the most used one
    expect(r.accents[0]!.onWhite).toBeGreaterThan(4);
    expect(r.neutrals.map((n) => n.hex)).toEqual(expect.arrayContaining(["#ffffff", "#111827"]));
    expect(r.neutrals.find((n) => n.hex === "#ffffff")!.onWhite).toBe(1);
  });
});

describe("icons, logos and photos (sources stood in by test doubles)", () => {
  let root: string;
  let h: Harness;
  let d: ReturnType<typeof doubles>;
  const ledger = () => readLedger(root);
  beforeAll(async () => {
    root = tmpProject("assets-src");
    d = doubles(root);
    h = await connect(root, d.deps);
    await h.call("project_create", { name: "Asset Test", size: "540x960", duration: 6 });
  });
  afterAll(async () => {
    await h.close();
    cleanup(root);
  });

  it("finds icons across sets, with each set's licence, and marks what the project allows", async () => {
    const r = await h.call("asset_search", { query: "calendar", kind: "icon", limit: 6 });
    const by = Object.fromEntries(r.results.map((x: any) => [x.ref, x]));
    expect(by["iconify:lucide/calendar"]).toMatchObject({
      license: "ISC",
      licenseClass: "permissive",
      allowed: true,
      creator: "Lucide Contributors",
      format: "svg",
    });
    expect(by["iconify:tabler/calendar"]).toMatchObject({ license: "MIT", allowed: true });
    expect(by["iconify:solar/calendar-bold"]).toMatchObject({
      licenseClass: "CC-BY",
      attributionRequired: true,
      allowed: true,
    });
    expect(by["iconify:bi/calendar3"]).toMatchObject({ licenseClass: "other", allowed: false });
    expect(by["iconify:bi/calendar3"].caution).toContain("not allowed");
    expect(r.results[r.results.length - 1].allowed).toBe(false); // blocked ones sort last
    expect(r.note).toContain("text matches");
  });

  it("downloads an icon recoloured to the look's colour, records the ledger, and gives the snippet", async () => {
    const r = await h.call("asset_get", {
      ref: "iconify:lucide/calendar",
      color: "#4B5CFF",
      height: 96,
    });
    expect(r.path).toBe("assets/third-party/iconify/lucide-calendar-4b5cff.svg");
    const svg = readFileSync(join(root, r.path), "utf8");
    expect(svg).toContain('stroke="#4B5CFF"');
    expect(r.entry).toMatchObject({
      source: "iconify",
      kind: "image",
      id: "lucide/calendar@#4b5cff#96",
      license: "ISC",
      commercialOk: true,
      attributionRequired: false,
      assetKind: "icon",
      author: "Lucide Contributors",
    });
    expect(r.entry.note).toContain("licence: https://example.test/lucide/LICENSE");
    expect(r.use).toContain('src="./assets/third-party/iconify/lucide-calendar-4b5cff.svg"');
    expect(
      d.assetLog.some(
        (c) => c.url.includes("/lucide/calendar.svg") && c.url.includes("color=%234B5CFF"),
      ),
    ).toBe(true);
    // a second colour is a second file and a second entry
    const r2 = await h.call("asset_get", { ref: "iconify:lucide/calendar", color: "#ffffff" });
    expect(r2.path).toBe("assets/third-party/iconify/lucide-calendar-ffffff.svg");
    expect(
      ledger().entries.filter((e) => e.source === "iconify" && e.id.startsWith("lucide/calendar")),
    ).toHaveLength(2);
  });

  it("blocks share-alike licences and respects an assetLicenses setting", async () => {
    const e = await fails(h.call("asset_get", { ref: "iconify:bi/calendar3" }), "license_blocked");
    expect(e.message).toContain("CC-BY-SA-4.0");
    expect(e.fix).toContain("assetLicenses");
    writeFileSync(
      join(root, "codecut.json"),
      JSON.stringify({ name: "x", assetLicenses: ["CC0"] }),
    );
    await fails(h.call("asset_get", { ref: "iconify:tabler/calendar" }), "license_blocked");
    writeFileSync(join(root, "codecut.json"), JSON.stringify({ name: "x" }));
    const ok = await h.call("asset_get", { ref: "iconify:tabler/calendar" });
    expect(ok.entry.license).toBe("MIT");
  });

  it("CC-BY icons are recorded as needing a credit", async () => {
    const r = await h.call("asset_get", { ref: "iconify:solar/calendar-bold" });
    expect(r.entry).toMatchObject({
      license: "CC-BY-4.0",
      attributionRequired: true,
      author: "480 Design",
    });
    expect(r.note).toContain("Credit required");
  });

  it("brand logos are trademarks: they need the person's permission", async () => {
    const s = await h.call("asset_search", { query: "slack", kind: "logo" });
    expect(s.results[0]).toMatchObject({
      ref: "iconify:logos/slack",
      trademark: true,
      licenseClass: "CC0",
    });
    expect(s.results[0].caution).toContain("trademark");
    const e = await fails(h.call("asset_get", { ref: "iconify:logos/slack" }), "license_blocked");
    expect(e.message).toContain("trademark");
    expect(e.fix).toContain("permission:true");
    expect(existsSync(join(root, "assets/third-party/iconify/logos-slack.svg"))).toBe(false);
    const ok = await h.call("asset_get", { ref: "iconify:logos/slack", permission: true });
    expect(ok.entry).toMatchObject({ assetKind: "logo", license: "CC0-1.0" });
    expect(ok.entry.note).toContain("brand logo: permission asserted by the person");
  });

  it("photos: Openverse CC0/CC-BY and Pexels, share-alike filtered out, big files scaled down", async () => {
    const s = await h.call("asset_search", { query: "laptop desk", kind: "photo", limit: 5 });
    const refs = s.results.map((x: any) => x.ref);
    expect(refs).toEqual(
      expect.arrayContaining([
        "openverse:11111111-1111-4111-8111-111111111111",
        "openverse:22222222-2222-4222-8222-222222222222",
        "pexels:555",
      ]),
    );
    expect(refs).not.toContain("openverse:33333333-3333-4333-8333-333333333333"); // CC BY-SA never requested
    expect(s.sources).toEqual(["openverse", "pexels"]);
    const cc0 = await h.call("asset_get", {
      ref: "openverse:11111111-1111-4111-8111-111111111111",
    });
    expect(cc0.entry).toMatchObject({
      license: "CC0-1.0",
      attributionRequired: false,
      assetKind: "photo",
      author: "Dana",
    });
    const dims = probe(join(root, cc0.path));
    expect(Math.max(dims.width, dims.height)).toBe(2400); // 3000x2000 scaled down
    expect(dims.width / dims.height).toBeCloseTo(1.5, 1);
    const by = await h.call("asset_get", { ref: "openverse:22222222-2222-4222-8222-222222222222" });
    expect(by.entry).toMatchObject({
      license: "CC-BY-2.0",
      attributionRequired: true,
      author: "Lee",
    });
    expect(by.entry.note).toContain('"Team at a whiteboard" by Lee is licensed under CC BY 2.0');
    const px = await h.call("asset_get", { ref: "pexels:555" });
    expect(px.entry).toMatchObject({
      license: "Pexels License",
      commercialOk: true,
      attributionRequired: false,
      creditRecommended: true,
      author: "Pat Pexel",
    });
    expect(probe(join(root, px.path))).toMatchObject({ width: 1600, height: 2400 }); // 4000x6000 scaled down
    expect(d.assetLog.find((c) => c.url.includes("pexels.test/v1/search"))!.auth).toBe("px-key");
  });

  it("explains a missing source or a bad ref instead of failing quietly", async () => {
    await fails(h.call("asset_get", { ref: "nowhere:123" }), "invalid_edit");
    await fails(h.call("asset_get", { ref: "iconify:not a ref" }), "invalid_edit");
    await fails(
      h.call("asset_search", { query: "x", kind: "icon", source: "pexels" }),
      "missing_dependency",
    );
    const bare = await connect(root, {
      env: { FLOMOTION_CONFIG: join(root, ".none.json") } as NodeJS.ProcessEnv,
    });
    try {
      const e = await fails(
        bare.call("asset_search", { query: "desk", kind: "photo", source: "pexels" }),
        "missing_dependency",
      );
      expect(e.fix).toContain("iconify");
    } finally {
      await bare.close();
    }
  });

  it("the licence report credits what needs credit, lists what the source asks for, and flags unrecorded files", () => {
    const l = ledger();
    const srcs = l.entries.filter((e) => e.kind === "image").map((e) => `./${e.file}`);
    const rep = licenseReport(l, [], [], [], srcs);
    expect(rep.attribution.map((e) => e.license).sort()).toEqual(["CC-BY-2.0", "CC-BY-4.0"]);
    expect(rep.recommended.map((e) => e.author)).toEqual(["Pat Pexel"]);
    expect(rep.credits).toContain('"Team at a whiteboard" by Lee (CC-BY-2.0)');
    expect(rep.credits).toContain("Credits requested by the source (not required by the licence)");
    expect(rep.credits).toContain("Pat Pexel");
    expect(rep.problems).toEqual([]);
    const missing = licenseReport(
      l,
      [],
      [],
      [],
      ["./assets/third-party/iconify/never-recorded.svg", "./assets/mine.png"],
    );
    expect(missing.problems).toEqual([
      "./assets/third-party/iconify/never-recorded.svg has no ledger entry",
    ]);
    expect(missing.own).toEqual(["./assets/mine.png"]); // the person's own file outside the managed folders needs no entry
  });

  it("lint knows pulled assets: they must be in the ledger with a licence that allows commercial use", async () => {
    await h.call("element_add", {
      parent: "main",
      type: "Image",
      props: {
        id: "ic",
        src: "./assets/third-party/iconify/lucide-calendar-4b5cff.svg",
        width: 96,
        height: 96,
        fit: "contain",
      },
    });
    const rules = async () =>
      (await h.call("lint")).issues
        .filter((i: any) =>
          ["asset-no-ledger", "license-blocked", "asset-missing"].includes(i.rule),
        )
        .map((i: any) => i.rule);
    expect(await rules()).toEqual([]);
    const file = join(root, ".codecut/ledger.json");
    const original = readFileSync(file, "utf8");
    const j = JSON.parse(original);
    j.entries = j.entries.filter(
      (e: any) => e.file !== "assets/third-party/iconify/lucide-calendar-4b5cff.svg",
    );
    writeFileSync(file, JSON.stringify(j));
    expect(await rules()).toEqual(["asset-no-ledger"]);
    const k = JSON.parse(original);
    k.entries.find(
      (e: any) => e.file === "assets/third-party/iconify/lucide-calendar-4b5cff.svg",
    ).commercialOk = false;
    writeFileSync(file, JSON.stringify(k));
    expect(await rules()).toEqual(["license-blocked"]);
    writeFileSync(file, original);
    rmSafe(join(root, "assets/third-party/iconify/lucide-calendar-4b5cff.svg"));
    expect(await rules()).toEqual(["asset-missing"]);
  });

  it("asset_import takes the person's own files from anywhere, with their statement of rights", async () => {
    const outside = tmpProject("assets-own");
    try {
      execFileSync("ffmpeg", [
        "-y",
        "-v",
        "error",
        "-f",
        "lavfi",
        "-i",
        "color=c=0x4b5cff:s=400x160",
        "-frames:v",
        "1",
        join(outside, "Acme Logo.png"),
      ]);
      writeFileSync(
        join(outside, "mark.svg"),
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4"/></svg>',
      );
      const r = await h.call("asset_import", {
        source: join(outside, "Acme Logo.png"),
        rights: "own",
        kind: "logo",
        name: "Acme logo",
      });
      expect(r.imported[0]).toMatchObject({ path: "assets/imported/acme-logo.png" });
      expect(r.imported[0].entry).toMatchObject({
        source: "own",
        assetKind: "logo",
        license: "owned by the person",
        commercialOk: true,
        note: "rights asserted by the person: own",
      });
      const many = await h.call("asset_import", {
        source: outside,
        rights: "licensed",
        license: "Brand kit licence",
      });
      expect(many.imported.map((x: any) => x.path).sort()).toEqual([
        "assets/imported/acme-logo.png",
        "assets/imported/mark.svg",
      ]);
      expect(ledger().entries.find((e) => e.id === "mark")!.license).toBe("Brand kit licence");
      expect((await h.raw("asset_import", { source: join(outside, "mark.svg") })).isError).toBe(
        true,
      ); // rights are required
      writeFileSync(
        join(outside, "bad.svg"),
        '<svg xmlns="http://www.w3.org/2000/svg"><script>1</script></svg>',
      );
      await fails(
        h.call("asset_import", { source: join(outside, "bad.svg"), rights: "own" }),
        "asset_missing",
      );
      writeFileSync(join(outside, "readme.txt"), "x");
      await fails(
        h.call("asset_import", { source: join(outside, "readme.txt"), rights: "own" }),
        "invalid_edit",
      );
      writeFileSync(join(outside, ".env"), "SECRET=1");
      await fails(
        h.call("asset_import", { source: join(outside, ".env"), rights: "own" }),
        "path_outside_project",
      );
    } finally {
      cleanup(outside);
    }
  });
});

function rmSafe(p: string) {
  execFileSync("rm", ["-f", p]);
}

describe("screenshots and brand from the person's own site (a local site stands in)", () => {
  let root: string;
  let h: Harness;
  let server: http.Server;
  let site: string;
  beforeAll(async () => {
    root = tmpProject("site");
    const png = join(root, "logo.png");
    execFileSync("ffmpeg", [
      "-y",
      "-v",
      "error",
      "-f",
      "lavfi",
      "-i",
      "color=c=0xff7a45:s=240x80",
      "-frames:v",
      "1",
      png,
    ]);
    const pngBytes = readFileSync(png);
    const page = (
      body: string,
      head = "",
    ) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Acme Pulse: project boards</title>
<meta name="description" content="Boards for small teams"><meta name="theme-color" content="#4b5cff">
<link rel="icon" href="/favicon.png"><link rel="apple-touch-icon" sizes="180x180" href="/apple.png">${head}
<style>
body{margin:0;font-family:'Inter',sans-serif;background:#ffffff;color:#1f2937}
header{display:flex;gap:16px;align-items:center;padding:16px 32px;border-bottom:1px solid #e5e7eb}
h1{font-family:'Space Grotesk',sans-serif;color:#111827;font-size:56px;margin:0 0 12px}
.btn{background:#4b5cff;color:#fff;padding:12px 20px;border-radius:8px;display:inline-block;font-family:'Inter',sans-serif;text-decoration:none}
a{color:#0ea5e9}#hero{padding:48px 32px;background:#f5f7ff}.badge{background:#ff7a45;color:#fff;padding:2px 8px;margin-left:12px}
</style></head><body>${body}</body></html>`;
    const home =
      page(`<header><a href="/"><svg class="logo" viewBox="0 0 40 40" width="40" height="40"><circle cx="20" cy="20" r="18" fill="#4b5cff"/></svg></a><img class="logo" src="/logo.png" alt="Acme logo" width="120" height="40"><nav><a href="/docs">Docs</a></nav></header>
<section id="hero"><h1>One board for every project</h1><p>Plain words.</p><a class="btn" href="/signup">Start free</a><span class="badge">New</span></section>
<div id="banner" style="position:fixed;bottom:0;left:0;right:0;height:120px;background:#000;color:#fff;padding:20px">We use cookies</div>`);
    const evil = page(
      `<header><a href="/"><svg class="logo" viewBox="0 0 40 40" width="40" height="40"><script>alert(1)</script><circle cx="20" cy="20" r="18" fill="#000"/></svg></a></header><section id="hero"><h1>Evil</h1></section>`,
    );
    server = http.createServer((req, res) => {
      const send = (type: string, body: string | Buffer) => (
        res.writeHead(200, { "content-type": type }),
        res.end(body)
      );
      if (req.url === "/") return send("text/html", home);
      if (req.url === "/evil") return send("text/html", evil);
      if (req.url === "/logo.png" || req.url === "/apple.png" || req.url === "/favicon.png")
        return send("image/png", pngBytes);
      res.writeHead(404);
      res.end();
    });
    await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
    site = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    h = await connect(root, doubles(root).deps);
    await h.call("project_create", { name: "Site Test", size: "540x960", duration: 6 });
  }, 60_000);
  afterAll(async () => {
    await h.close();
    server.close();
    cleanup(root);
  });

  it("will not capture or read a site without the person's confirmation that it is theirs", async () => {
    const a = await fails(h.call("asset_capture", { url: site }), "license_blocked");
    expect(a.fix).toContain("permission:true");
    await fails(h.call("brand_extract", { url: site }), "license_blocked");
    expect(existsSync(join(root, "assets/captures"))).toBe(false);
  });

  it("captures a sharp screenshot at 2x, hides what is in the way, and records it", async () => {
    const r = await h.raw("asset_capture", {
      url: site,
      permission: true,
      width: 800,
      height: 600,
      scale: 2,
      hide: ["#banner"],
      name: "home",
    });
    expect(r.isError).toBeFalsy();
    expect(r.content.some((c) => c.type === "image")).toBe(true); // the model gets to look at it
    const j = JSON.parse((r.content[0] as any).text);
    expect(j).toMatchObject({
      path: "assets/captures/home.png",
      width: 1600,
      height: 1200,
      title: "Acme Pulse: project boards",
    });
    expect(j.entry).toMatchObject({
      source: "capture",
      assetKind: "screenshot",
      license: "owned or permitted by the person",
      url: site,
      commercialOk: true,
    });
    const png = PNG.sync.read(readFileSync(join(root, j.path)));
    const px = (x: number, y: number) => png.data[(y * png.width + x) * 4]!;
    expect(px(10, 1190)).toBeGreaterThan(200); // bottom-left would be the black cookie banner if it were not hidden
    // the button's blue is really in the picture
    let blue = 0;
    for (let i = 0; i < png.data.length; i += 4)
      if (Math.abs(png.data[i]! - 0x4b) < 8 && Math.abs(png.data[i + 2]! - 0xff) < 8) blue++;
    expect(blue).toBeGreaterThan(2000);
  }, 120_000);

  it("without hide, the banner is in the shot (so hide really did something)", async () => {
    const r = await h.call("asset_capture", {
      url: site,
      permission: true,
      width: 800,
      height: 600,
      scale: 1,
      name: "with-banner",
    });
    const png = PNG.sync.read(readFileSync(join(root, r.path)));
    expect(png.data[(590 * png.width + 10) * 4]).toBeLessThan(40);
  }, 120_000);

  it("captures one element", async () => {
    const r = await h.call("asset_capture", {
      url: site,
      permission: true,
      width: 800,
      height: 600,
      scale: 1,
      selector: "#hero",
      name: "hero",
    });
    expect(r.width).toBe(800);
    expect(r.height).toBeLessThan(400);
  }, 120_000);

  it("explains a bad selector, a bad address and a page that is not there", async () => {
    await fails(
      h.call("asset_capture", { url: site, permission: true, selector: "#nope" }),
      "asset_missing",
    );
    const e = await fails(
      h.call("asset_capture", { url: "file:///etc/hosts", permission: true }),
      "invalid_value",
    );
    expect(e.message).toContain("http");
    const gone = await fails(
      h.call("asset_capture", { url: "http://127.0.0.1:1/", permission: true }),
      "asset_missing",
    );
    expect(gone.fix).toContain("asset_import");
  }, 120_000);

  it("brand_extract reports the accent colour, fonts and logos the page really uses, and saves the logos", async () => {
    const r = await h.call("brand_extract", { url: site, permission: true });
    expect(r).toMatchObject({
      title: "Acme Pulse: project boards",
      description: "Boards for small teams",
      themeColor: "#4b5cff",
      file: "brand.json",
    });
    expect(r.accents[0].hex).toBe("#4b5cff"); // buttons, the logo and the theme colour all agree
    expect(r.accents.map((a: any) => a.hex)).toEqual(
      expect.arrayContaining(["#4b5cff", "#ff7a45"]),
    );
    expect(r.accents[0].onWhite).toBeGreaterThan(4);
    expect(r.neutrals.map((n: any) => n.hex)).toEqual(
      expect.arrayContaining(["#ffffff", "#111827"]),
    );
    const fonts = Object.fromEntries(r.fonts.map((f: any) => [f.where, f.family]));
    expect(fonts).toMatchObject({ heading: "Space Grotesk", body: "Inter", button: "Inter" });
    expect(r.logos.length).toBeGreaterThanOrEqual(3);
    const svg = r.logos.find((l: any) => l.path.endsWith(".svg"));
    expect(readFileSync(join(root, svg.path), "utf8")).toContain("<circle");
    expect(r.logos.some((l: any) => l.from.includes("/logo.png"))).toBe(true);
    expect(r.logos.some((l: any) => l.from.includes("/apple.png"))).toBe(true);
    const ledger = readLedger(root).entries.filter((e) => e.assetKind === "brand");
    expect(ledger.length).toBe(r.logos.length);
    expect(ledger[0]).toMatchObject({
      source: "site",
      license: "owned or permitted by the person",
      commercialOk: true,
    });
    expect(JSON.parse(readFileSync(join(root, "brand.json"), "utf8")).accents[0].hex).toBe(
      "#4b5cff",
    );
    expect(r.note).toContain("confirm");
  }, 120_000);

  it("skips an unsafe inline SVG logo and says why", async () => {
    const r = await h.call("brand_extract", { url: `${site}/evil`, permission: true });
    expect(r.skipped.join()).toContain("inline svg");
    expect(
      r.logos.every((l: any) => !readFileSync(join(root, l.path), "utf8").includes("<script")),
    ).toBe(true);
  }, 120_000);
});
