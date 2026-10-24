import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { FLOMOTION_DIR, FLOMOTION_NAME, FLOMOTION_SCOPE, FlomotionError } from "@flomotion/core";

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

/** Write a new project into `dir`: project.tsx, flomotion.json, tsconfig.json, folders. */
export function scaffoldProject(dir: string, o: ScaffoldOptions): { file: string; id: string } {
  if (existsSync(join(dir, "project.tsx")) || existsSync(join(dir, "flomotion.json")))
    throw new FlomotionError("invalid_edit", `${dir} already contains a project`, {
      fix: "Use project_read to inspect it, or start the server in an empty folder.",
    });
  for (const d of ["assets", "fonts", "recordings", FLOMOTION_DIR])
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
  const src = `import { Composition, Track, Scene } from "${FLOMOTION_SCOPE}/components";

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
    join(dir, "flomotion.json"),
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
          jsxImportSource: `${FLOMOTION_SCOPE}/core`,
          skipLibCheck: true,
        },
      },
      null,
      2,
    ) + "\n",
  );
  writeFileSync(
    join(dir, ".gitignore"),
    `${FLOMOTION_DIR}/build/\n${FLOMOTION_DIR}/frames/\n${FLOMOTION_DIR}/sheet/\n${FLOMOTION_DIR}/tmp/\nrenders/\n`,
  );
  void FLOMOTION_NAME;
  return { file: join(dir, "project.tsx"), id };
}
