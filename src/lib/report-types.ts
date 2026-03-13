/**
 * Report Agent types — shared between server and client.
 * Three content layers: Facts, Insights, Drafts.
 */

// ─── Facts (zero hallucination) ─────────────────────

export interface Fact {
  id: string;           // e.g. "S.capitalMatrix", "N.trends"
  label: string;        // human-readable label
  value: string | null; // null = missing
  source: "user_typed" | "user_selected" | "ai_inferred";
  module: "S" | "N" | "W" | "E";
}

// ─── Insights (traceable reasoning) ─────────────────

export interface Insight {
  id: string;           // e.g. "opportunity_match", "tension_resolve"
  title: string;
  content: string;      // the reasoning
  based_on: string[];   // fact IDs this insight references
  confidence: "high" | "medium" | "low";
}

// ─── Drafts (editable recommendations) ──────────────

export interface DraftOption {
  label: string;        // e.g. "偏探索版", "偏纪律版"
  content: string;
}

export interface Draft {
  id: string;           // e.g. "vision_statement", "action_plan"
  title: string;
  description: string;
  options: DraftOption[];  // 2-3 alternatives
  user_edited?: string;    // user's final version (after editing)
}

// ─── Validation ─────────────────────────────────────

export interface ValidationWarning {
  rule: string;
  detail: string;
  severity: "warn" | "fail";
}

// ─── Full report response ───────────────────────────

export interface ReportResponse {
  facts: Fact[];
  insights: Insight[];
  drafts: Draft[];
  warnings: ValidationWarning[];
  generated_at: string;
}
