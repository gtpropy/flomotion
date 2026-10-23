import { CodeCutError, isNode, type CCNode } from "@codecut/core";

const IDENT = /^[A-Za-z_$][\w$]*$/;
const MAX_LINE = 96;

/** Print a JSON-like value as a TSX/JS expression. Functions cannot be printed (they stay opaque). */
export function printExpr(v: unknown, indent = ""): string {
  if (v === null) return "null";
  if (v === undefined) return "undefined";
  if (typeof v === "string") return JSON.stringify(v);
  if (typeof v === "number") {
    if (!Number.isFinite(v)) throw new CodeCutError("invalid_value", `Cannot print ${v}`);
    return Object.is(v, -0) ? "0" : String(v);
  }
  if (typeof v === "boolean") return String(v);
  if (typeof v === "function" || (typeof v === "object" && v && "$expr" in (v as object)))
    throw new CodeCutError(
      "opaque_expression",
      "Expressions cannot be written from structured edits",
      {
        fix: "Use scene_write to write a whole element that contains the expression.",
      },
    );
  if (Array.isArray(v)) {
    if (!v.length) return "[]";
    const flat = `[${v.map((x) => printExpr(x, indent)).join(", ")}]`;
    if (flat.length + indent.length <= MAX_LINE && !flat.includes("\n")) return flat;
    const inner = indent + "  ";
    return `[\n${v.map((x) => `${inner}${printExpr(x, inner)},`).join("\n")}\n${indent}]`;
  }
  if (typeof v === "object") {
    const entries = Object.entries(v as Record<string, unknown>).filter(([, x]) => x !== undefined);
    if (!entries.length) return "{}";
    const key = (k: string) => (IDENT.test(k) ? k : JSON.stringify(k));
    const flat = `{ ${entries.map(([k, x]) => `${key(k)}: ${printExpr(x, indent)}`).join(", ")} }`;
    if (flat.length + indent.length <= MAX_LINE && !flat.includes("\n")) return flat;
    const inner = indent + "  ";
    return `{\n${entries.map(([k, x]) => `${inner}${key(k)}: ${printExpr(x, inner)},`).join("\n")}\n${indent}}`;
  }
  throw new CodeCutError("invalid_value", `Cannot print a value of type ${typeof v}`);
}

/** The text after `name` in a JSX attribute: `="str"`, `={expr}`, or empty for a bare `true`. */
export function printAttrInit(v: unknown, indent = ""): string {
  if (v === true) return "";
  if (typeof v === "string" && !/["{}<>\\\n\r&]/.test(v)) return `="${v}"`;
  return `={${printExpr(v, indent)}}`;
}

export function printAttr(name: string, v: unknown, indent = ""): string {
  return `${name}${printAttrInit(v, indent)}`;
}

const textSafe = (s: string) => s.trim() === s && !/[{}<>&\n\r]/.test(s) && s.length > 0;

/** Print an element tree as JSX source. `id` is written first. Function props cannot be printed. */
export function printNode(n: CCNode, indent = ""): string {
  const entries = Object.entries(n.props).filter(([, v]) => v !== undefined);
  entries.sort(([a], [b]) => (a === "id" ? -1 : b === "id" ? 1 : 0));
  const attrs = entries.map(([k, v]) => printAttr(k, v, indent + "  "));
  const oneLine = `<${n.name}${attrs.length ? " " + attrs.join(" ") : ""}`;
  const multi = oneLine.length + indent.length > MAX_LINE || oneLine.includes("\n");
  const open = multi
    ? `<${n.name}\n${attrs.map((a) => `${indent}  ${a}`).join("\n")}\n${indent}`
    : oneLine;
  if (!n.children.length) return `${open}${multi ? "" : " "}/>`;
  const kids = n.children.map((c) =>
    isNode(c)
      ? `${indent}  ${printNode(c, indent + "  ")}`
      : typeof c === "string" && textSafe(c)
        ? `${indent}  ${c}`
        : `${indent}  {${printExpr(c, indent + "  ")}}`,
  );
  return `${open}>\n${kids.join("\n")}\n${indent}</${n.name}>`;
}
