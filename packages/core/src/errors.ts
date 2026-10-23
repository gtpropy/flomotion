export type ErrorCode =
  | "schema_violation"
  | "track_locked"
  | "overlap_rejected"
  | "asset_missing"
  | "quote_required"
  | "license_blocked"
  | "invalid_time"
  | "invalid_value"
  | "duplicate_keyframe"
  | "unresolved_ref"
  | "unknown_component"
  | "unknown_element"
  | "impure_expression"
  | "opaque_expression"
  | "font_error"
  | "path_outside_project"
  | "render_failed"
  | "missing_dependency"
  | "invalid_edit";

/** Typed error carrying a machine code and a human fix hint (MCP surfaces both). */
export class CodeCutError extends Error {
  readonly code: ErrorCode;
  readonly fix?: string;
  readonly details?: unknown;
  constructor(code: ErrorCode, message: string, opts: { fix?: string; details?: unknown } = {}) {
    super(message);
    this.name = "CodeCutError";
    this.code = code;
    this.fix = opts.fix;
    this.details = opts.details;
  }
  toJSON() {
    return { code: this.code, message: this.message, fix: this.fix, details: this.details };
  }
}

export const isCodeCutError = (e: unknown): e is CodeCutError => e instanceof CodeCutError;
