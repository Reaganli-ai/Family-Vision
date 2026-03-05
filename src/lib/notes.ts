/**
 * Live Notes schema & utilities.
 *
 * Three core roles of the right panel:
 * 1. Trust    — user sees their input being "recorded" in real-time
 * 2. Relief   — structured bullets reduce cognitive load vs. reading chat history
 * 3. Correct  — user can edit/delete/highlight any note, fixing errors before PDF
 */

// ─── Source label mapping ────────────────────────────────

export const SOURCE_LABELS: Record<string, string> = {
  "family-code":      "家庭代号",
  "capital-matrix":   "资本矩阵",
  "capital-summary":  "资本总结",
  "priority-select":  "战略优先级",
  "tag-select":       "趋势/素养选择",
  "keyword-fill":     "关键词填写",
  "short-text":       "关键故事",
  "agree-disagree":   "确认/纠错",
  "spirit-upgrade":   "精神升级",
  "value-gallery":    "价值观选择",
  "single-select":    "方向选择",
  "deep-dive":        "深入思考",
  "opt-in":           "可选分支",
  "snapshot":         "快照确认",
  "user-text":        "自由回答",
};

// ─── Note type ──────────────────────────────────────────

export interface Note {
  id: string;
  /** Which module: S / N / W / E */
  moduleId: string;
  /** Which card/question produced this note */
  sourceCardType: string;
  /** Human-readable source label */
  sourceLabel: string;
  /** The bullet text */
  bullet: string;
  /** Orange highlight — will be exported to PDF */
  isHighlight: boolean;
  /** confirmed = user has verified; pending = needs confirmation */
  status: "confirmed" | "pending";
  /** ISO timestamp */
  updatedAt: string;
}

// ─── Open Loop type ─────────────────────────────────────

export interface OpenLoop {
  id: string;
  moduleId: string;
  description: string;
  /** Which node index to navigate back to */
  nodeIndex: number;
  resolved: boolean;
}

// ─── Note generation from card data ─────────────────────

let noteCounter = 0;
function makeId(): string {
  return `note_${Date.now()}_${++noteCounter}`;
}

/**
 * Generate notes from a card confirmation.
 * Returns 1-6 bullets depending on card type.
 * Only records facts/choices/preferences — never AI commentary.
 */
export function generateNotes(
  moduleId: string,
  cardType: string,
  data: unknown,
): Note[] {
  const now = new Date().toISOString();
  const sourceLabel = SOURCE_LABELS[cardType] || cardType;

  const make = (bullet: string, highlight = false, status: Note["status"] = "confirmed"): Note => ({
    id: makeId(),
    moduleId,
    sourceCardType: cardType,
    sourceLabel,
    bullet,
    isHighlight: highlight,
    status,
    updatedAt: now,
  });

  switch (cardType) {
    case "family-code":
      return [make(`家庭代号：${data as string}`, true)];

    case "capital-matrix": {
      const rows = data as { label: string; level: string; keyword: string }[];
      return rows.map((r) =>
        make(`${r.label}：${r.level}${r.keyword ? `（${r.keyword}）` : ""}`)
      );
    }

    case "capital-summary": {
      const result = data as { agreed: boolean; reason?: string; detail?: string };
      if (result.agreed) {
        return [make("资本画像：已确认符合")];
      }
      const bullets: Note[] = [make(`资本画像：不符合 — ${result.reason || ""}`, false, "pending")];
      if (result.detail) bullets.push(make(`补充说明：${result.detail}`, false, "pending"));
      return bullets;
    }

    case "priority-select": {
      const text = data as string;
      return [make(`战略重点：优先升级${text}`, true)];
    }

    case "tag-select": {
      const tags = data as string[];
      return tags.map((t) => make(`选择：${t}`, true));
    }

    case "keyword-fill": {
      const vals = data as Record<string, string>;
      return Object.entries(vals).map(([k, v]) => make(`${k}：${v}`));
    }

    case "short-text":
      return [make(`关键描述：${(data as string).slice(0, 100)}${(data as string).length > 100 ? "…" : ""}`)];

    case "agree-disagree": {
      const text = data as string;
      if (text === "同意") return [make("分析结论：已确认同意")];
      return [make(`纠错：${text}`, false, "pending")];
    }

    case "spirit-upgrade": {
      const text = data as string;
      // Format: 核心精神：X；从「Y」→ 到「Z」
      return [make(text, true)];
    }

    case "value-gallery": {
      const d = data as { core: string[]; deferred: string[] };
      const bullets: Note[] = [];
      if (d.core.length) bullets.push(make(`核心价值观：${d.core.join("、")}`, true));
      if (d.deferred.length) bullets.push(make(`战略暂缓：${d.deferred.join("、")}`));
      return bullets;
    }

    case "single-select":
      return [make(`方向选择：${data as string}`, true)];

    case "deep-dive": {
      const answers = data as { option: string; comment: string }[];
      return answers.map((a) =>
        make(`深挖：${a.option}${a.comment ? `（${a.comment}）` : ""}`)
      );
    }

    case "snapshot": {
      const text = data as string;
      return [make(`快照已确认：${text.slice(0, 60)}…`)];
    }

    case "user-text":
      return [make(`回答：${(data as string).slice(0, 100)}${(data as string).length > 100 ? "…" : ""}`)];

    default:
      return [make(`${sourceLabel}：${String(data).slice(0, 80)}`)];
  }
}
