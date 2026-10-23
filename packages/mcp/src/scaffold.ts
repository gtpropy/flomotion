import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { CODECUT_DIR, CODECUT_NAME, CODECUT_SCOPE, CodeCutError } from "@codecut/core";

export const TEMPLATES = ["blank", "saas-promo"] as const;
export type Template = (typeof TEMPLATES)[number];

export interface ScaffoldOptions {
  name: string;
  size: [number, number];
  fps: number;
  template?: Template;
  /** Look id, e.g. "kinetic". */
  look?: string;
  /** Total length in seconds for the blank template (the promo template is 30 s). */
  duration?: number;
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "main";

const BEATS: Array<[string, number]> = [
  ["hook", 3],
  ["problem", 5],
  ["reveal", 6],
  ["features", 9],
  ["proof", 4],
  ["cta", 3],
];

/** Write a new project into `dir`: project.tsx, codecut.json, tsconfig.json, folders. */
export function scaffoldProject(dir: string, o: ScaffoldOptions): { file: string; id: string } {
  if (existsSync(join(dir, "project.tsx")) || existsSync(join(dir, "codecut.json")))
    throw new CodeCutError("invalid_edit", `${dir} already contains a project`, {
      fix: "Use project_read to inspect it, or start the server in an empty folder.",
    });
  for (const d of ["assets", "fonts", "recordings", CODECUT_DIR])
    mkdirSync(join(dir, d), { recursive: true });
  const id = slug(o.name);
  const [w, h] = o.size;
  const look = o.look ?? "kinetic";
  const template = o.template ?? "blank";
  const scenes =
    template === "saas-promo"
      ? (() => {
          let t = 0;
          return BEATS.map(([beat, d]) => {
            const s = `      <Scene id="${beat}" start="${t}s" duration="${d}s" />`;
            t += d;
            return s;
          }).join("\n");
        })()
      : `      <Scene id="main" start="0s" duration="${o.duration ?? 5}s" />`;
  const total = template === "saas-promo" ? 30 : (o.duration ?? 5);
  const src = `import { Composition, Track, Scene } from "${CODECUT_SCOPE}/components";

export default (
  <Composition id="${id}" size={[${w}, ${h}]} fps={${o.fps}} duration="${total}s" theme="$look.${look}">
    <Track id="v1" kind="video">
${scenes}
    </Track>
  </Composition>
);
`;
  writeFileSync(join(dir, "project.tsx"), src);
  writeFileSync(
    join(dir, "codecut.json"),
    JSON.stringify(
      { name: o.name, entry: "project.tsx", soundLicenses: ["CC0", "CC-BY"] },
      null,
      2,
    ) + "\n",
  );
  writeFileSync(
    join(dir, "tsconfig.json"),
    JSON.stringify(
      {
        compilerOptions: {
          target: "ES2023",
          module: "ESNext",
          moduleResolution: "Bundler",
          strict: true,
          jsx: "react-jsx",
          jsxImportSource: `${CODECUT_SCOPE}/core`,
          skipLibCheck: true,
        },
      },
      null,
      2,
    ) + "\n",
  );
  writeFileSync(
    join(dir, ".gitignore"),
    `${CODECUT_DIR}/build/\n${CODECUT_DIR}/frames/\n${CODECUT_DIR}/sheet/\n${CODECUT_DIR}/tmp/\nrenders/\n`,
  );
  void CODECUT_NAME;
  return { file: join(dir, "project.tsx"), id };
}
