import { z } from "zod";
import type { AnyControl, ControlOpts } from "./controls.js";
import type { ComponentDef, Registry } from "./define.js";

/** TypeScript prop interface for a definition (generated from controls). */
export function propsTypeSource(def: ComponentDef): string {
  const lines: string[] = [];
  for (const [k, c] of Object.entries(def.controls)) {
    const t = c.animatable ? `Animatable<${c.tsType}>` : c.tsType;
    const doc = describe(c);
    lines.push(`${doc ? `  /** ${doc} */\n` : ""}  ${k}?: ${t};`);
  }
  return `export interface ${def.name}Props {\n${lines.join("\n")}\n  children?: unknown;\n}`;
}

function describe(c: AnyControl): string {
  const o = c.opts as ControlOpts<any>;
  const bits: string[] = [];
  if (o.description) bits.push(o.description);
  if (o.min !== undefined || o.max !== undefined) bits.push(`range ${o.min ?? "-∞"}..${o.max ?? "∞"}`);
  if (o.unit) bits.push(`unit ${o.unit}`);
  if (o.default !== undefined) bits.push(`default ${JSON.stringify(o.default)}`);
  return bits.join("; ");
}

/** JSON Schema for MCP tool arguments (props in wire form: no expressions). */
export function propsJsonSchema(def: ComponentDef): Record<string, unknown> {
  return z.toJSONSchema(def.wire, { unrepresentable: "any", io: "input" }) as Record<string, unknown>;
}

export interface McpToolSchemas {
  element_add: Record<string, unknown>;
  element_set: Record<string, unknown>;
  effect_add: Record<string, unknown>;
}

/** Argument schemas for the schema-driven MCP tools, built from the live registry. */
export function mcpToolSchemas(reg: Registry): McpToolSchemas {
  const comps = reg.list("component").filter((d) => !d.stub);
  const effects = reg.list("effect").filter((d) => !d.stub);
  const propsByName = (defs: ComponentDef[]) =>
    ({
      oneOf: defs.map((d) => ({
        title: d.name,
        ...(propsJsonSchema(d) as object),
      })),
    }) as Record<string, unknown>;
  return {
    element_add: {
      type: "object",
      required: ["parent", "type", "props"],
      properties: {
        parent: { type: "string", description: "Id of the parent Composition/Track/Scene/Layer." },
        type: { type: "string", enum: comps.map((d) => d.name) },
        props: { type: "object", description: "Validated against the component schema (see codecut://schema/{component})." },
        at: { type: "integer", description: "Child index to insert at (default: append)." },
      },
      "x-propsByType": propsByName(comps),
    },
    element_set: {
      type: "object",
      required: ["id", "props"],
      properties: { id: { type: "string" }, props: { type: "object" } },
    },
    effect_add: {
      type: "object",
      required: ["id", "effect", "props"],
      properties: {
        id: { type: "string", description: "Id of the layer the effect applies to." },
        effect: { type: "string", enum: effects.map((d) => d.name) },
        props: { type: "object" },
      },
      "x-propsByType": propsByName(effects),
    },
  };
}

/** A lint rule derived from a control declaration. */
export interface DerivedRule {
  component: string;
  prop: string;
  rule: "range" | "animatable" | "enum" | "required";
  detail: Record<string, unknown>;
}

export function deriveLintRules(def: ComponentDef): DerivedRule[] {
  const rules: DerivedRule[] = [];
  for (const [prop, c] of Object.entries(def.controls)) {
    const o = c.opts;
    if (o.min !== undefined || o.max !== undefined) {
      rules.push({ component: def.name, prop, rule: "range", detail: { min: o.min, max: o.max } });
    }
    if (!c.animatable) rules.push({ component: def.name, prop, rule: "animatable", detail: { animatable: false } });
    if (c.values) rules.push({ component: def.name, prop, rule: "enum", detail: { values: c.values } });
    if (o.required) rules.push({ component: def.name, prop, rule: "required", detail: {} });
  }
  return rules;
}

/** Markdown reference page for one definition. */
export function docsMarkdown(def: ComponentDef): string {
  const rows = Object.entries(def.controls).map(([k, c]) => {
    const o = c.opts as ControlOpts<any>;
    const type = c.values ? c.values.map((v) => `\`${v}\``).join(" \\| ") : `\`${c.tsType}\``;
    const bits = [
      c.animatable ? "animatable" : "",
      o.min !== undefined || o.max !== undefined ? `range ${o.min ?? "-∞"}..${o.max ?? "∞"}` : "",
      o.step !== undefined ? `step ${o.step}` : "",
      o.unit ? `unit ${o.unit}` : "",
      o.ui ? `ui ${o.ui}` : "",
      o.sound ? `sound ${o.sound}` : "",
      o.when ? `when ${o.when.prop}=${JSON.stringify(o.when.equals ?? o.when.in)}` : "",
    ].filter(Boolean);
    const def_ = o.default !== undefined ? `\`${JSON.stringify(o.default)}\`` : "";
    return `| \`${k}\` | ${type} | ${def_} | ${[o.description, ...bits].filter(Boolean).join("; ")} |`;
  });
  const children =
    def.children === "any" ? "any layers and effects" : def.children === "none" ? "none" : def.children === "effects" ? "effects only" : (def.children as readonly string[]).join(", ");
  return [
    `# ${def.name}`,
    "",
    `*${def.kind}, category: ${def.category}${def.stub ? ", **stub** (schema only, not rendered yet)" : ""}*`,
    "",
    def.description ?? "",
    "",
    `Children: ${children}.${def.sound ? ` Default sound tag: \`${def.sound}\`.` : ""}`,
    "",
    "| Prop | Type | Default | Notes |",
    "| --- | --- | --- | --- |",
    ...rows,
    "",
    "```ts",
    propsTypeSource(def),
    "```",
    "",
  ].join("\n");
}

/** Index page listing every definition by category. */
export function docsIndexMarkdown(reg: Registry): string {
  const byCat = new Map<string, ComponentDef[]>();
  for (const d of reg.list()) {
    byCat.set(d.category, [...(byCat.get(d.category) ?? []), d]);
  }
  const out = ["# Components and effects", "", "Generated from schemas. Do not edit by hand.", ""];
  for (const [cat, defs] of [...byCat].sort(([a], [b]) => a.localeCompare(b))) {
    out.push(`## ${cat}`, "");
    for (const d of defs.sort((a, b) => a.name.localeCompare(b.name))) {
      out.push(`- [${d.name}](./${d.name}.md) (${d.kind}${d.stub ? ", stub" : ""})${d.description ? `: ${d.description}` : ""}`);
    }
    out.push("");
  }
  return out.join("\n");
}
