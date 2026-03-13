/**
 * Structured compass data schema with source tracking.
 * This is the SINGLE source of truth for PDF generation.
 * No LLM calls, no free-text extraction — only card interactions.
 */

// ─── Source types ────────────────────────────────────

export type FieldSource = "user_typed" | "user_selected" | "ai_inferred" | "template_based";

export interface TrackedField<T> {
  value: T;
  source: FieldSource;
}

// Helper to create tracked fields
export const field = <T>(value: T, source: FieldSource): TrackedField<T> => ({
  value,
  source,
});

// ─── Schema ──────────────────────────────────────────

export interface CompassDataSchema {
  familyCode?: TrackedField<string>;

  S?: {
    capitalMatrix?: TrackedField<{ label: string; level: string; keyword: string }[]>;
    capitalSummaryAgreed?: TrackedField<boolean>;
    capitalRationale?: TrackedField<string>;
    priorityUpgrade?: TrackedField<string>;
    snapshot?: TrackedField<string>;
  };

  N?: {
    trendsRanked?: TrackedField<string[]>;     // [top1, top2, top3]
    coreAbility?: TrackedField<string>;        // single ability
    insightExplain?: TrackedField<string>;     // template_based
    insightConnect?: TrackedField<string>;     // template_based
    insightGap?: TrackedField<string>;         // template_based
    agreeDisagree?: TrackedField<{ agreed: boolean; reasons?: string[]; detail?: string }>;
    snapshot?: TrackedField<string>;           // template_based
  };

  W?: {
    // Q1
    story?: TrackedField<string>;
    storyPriorityTag?: TrackedField<string>;
    // Q2
    tradeoffChoices?: TrackedField<{ axisId: string; labelA: string; labelB: string; choice: "A" | "B" }[]>;
    // Q3
    heroTraits?: TrackedField<string[]>;
    // Q4
    quoteChildhood?: TrackedField<string>;
    quoteNow?: TrackedField<string>;
    quoteThemeTag?: TrackedField<string>;
    // Naming
    coreCode?: TrackedField<{ name: string; definition: string; userEdited?: boolean }>;
    // Flip side
    flipsideTags?: TrackedField<string[]>;
    flipsideExample?: TrackedField<string>;
    flipsideBenefit?: TrackedField<string>;
    flipsideCost?: TrackedField<string>;
    // Upgrade
    upgradeKeep?: TrackedField<string>;
    upgradeReduce?: TrackedField<string>;
    upgradeFrom?: TrackedField<string>;
    upgradeTo?: TrackedField<string>;
    // Output
    finalStatement?: TrackedField<string>;
    snapshot?: TrackedField<string>;
  };

  E?: {
    anchors?: TrackedField<{ gift_to_child: string; fear_child_lacks: string }>;
    coreValues?: TrackedField<string[]>;
    deferredValues?: TrackedField<string[]>;
    agreeDisagree?: TrackedField<string>;
    direction?: TrackedField<string>;
    snapshot?: TrackedField<string>;
  };

}

// ─── Card data → schema mapping ──────────────────────

/**
 * Maps a card confirmation to the correct compass data field.
 * Called from handleCardConfirm in Workspace.tsx.
 */
export function updateCompassFromCard(
  data: CompassDataSchema,
  moduleId: string, // "S" | "N" | "W" | "E"
  cardType: string,
  nodeIndex: number,
  cardData: unknown,
): CompassDataSchema {
  const next = { ...data };

  switch (moduleId) {
    case "S": {
      if (!next.S) next.S = {};
      if (cardType === "capital-matrix") {
        next.S.capitalMatrix = field(
          cardData as { label: string; level: string; keyword: string }[],
          "user_selected",
        );
      } else if (cardType === "capital-summary") {
        const result = cardData as { agreed: boolean };
        next.S.capitalSummaryAgreed = field(result.agreed, "user_selected");
      } else if (cardType === "priority-select") {
        // cardData is a string like "文化资本（补充：xxx）"
        const raw = cardData as string;
        const label = raw.replace(/（补充：.*）/, "").replace("我选择优先升级：", "").trim();
        next.S.priorityUpgrade = field(label, "user_selected");
      } else if (cardType === "snapshot") {
        next.S.snapshot = field(cardData as string, "ai_inferred");
      }
      break;
    }

    case "N": {
      if (!next.N) next.N = {};
      if (cardType === "trend-rank") {
        next.N.trendsRanked = field(cardData as string[], "user_selected");
      } else if (cardType === "ability-select") {
        next.N.coreAbility = field(cardData as string, "user_selected");
      } else if (cardType === "agree-disagree") {
        const raw = cardData as { agreed: boolean; reason?: string };
        next.N.agreeDisagree = field({
          agreed: raw.agreed,
          ...(raw.reason ? { reasons: [raw.reason] } : {}),
        }, "user_selected");
      } else if (cardType === "snapshot") {
        next.N.snapshot = field(cardData as string, "template_based");
      }
      break;
    }

    case "W": {
      if (!next.W) next.W = {};
      if (cardType === "story-input") {
        const d = cardData as { story: string; priorityTag?: string };
        next.W.story = field(d.story, "user_typed");
        if (d.priorityTag) next.W.storyPriorityTag = field(d.priorityTag, "user_selected");
      } else if (cardType === "tradeoff-choice") {
        next.W.tradeoffChoices = field(
          cardData as { axisId: string; labelA: string; labelB: string; choice: "A" | "B" }[],
          "user_selected",
        );
      } else if (cardType === "hero-select") {
        next.W.heroTraits = field(cardData as string[], "user_selected");
      } else if (cardType === "quote-fill") {
        const d = cardData as { childhood: string; now: string; themeTag?: string };
        next.W.quoteChildhood = field(d.childhood, "user_typed");
        next.W.quoteNow = field(d.now, "user_typed");
        if (d.themeTag) next.W.quoteThemeTag = field(d.themeTag, "user_selected");
      } else if (cardType === "core-code-confirm") {
        const d = cardData as { name: string; definition: string; userEdited?: boolean };
        next.W.coreCode = field(d, d.userEdited ? "user_typed" : "user_selected");
      } else if (cardType === "flipside-fill") {
        const d = cardData as { tags: string[]; example: string; benefit: string; cost: string };
        next.W.flipsideTags = field(d.tags, "user_selected");
        next.W.flipsideExample = field(d.example, "user_typed");
        next.W.flipsideBenefit = field(d.benefit, "user_typed");
        next.W.flipsideCost = field(d.cost, "user_typed");
      } else if (cardType === "upgrade-path") {
        const d = cardData as { keep: string; reduce: string; from: string; to: string };
        next.W.upgradeKeep = field(d.keep, "user_typed");
        next.W.upgradeReduce = field(d.reduce, "user_typed");
        next.W.upgradeFrom = field(d.from, "user_typed");
        next.W.upgradeTo = field(d.to, "user_typed");
      } else if (cardType === "snapshot") {
        next.W.snapshot = field(cardData as string, "template_based");
      }
      break;
    }

    case "E": {
      if (!next.E) next.E = {};
      if (cardType === "keyword-fill") {
        // E-02: two fields mapped to semantic keys
        const vals = cardData as Record<string, string>;
        const keys = Object.keys(vals);
        next.E.anchors = field(
          {
            gift_to_child: vals[keys[0]] || "",
            fear_child_lacks: vals[keys[1]] || "",
          },
          "user_typed",
        );
      } else if (cardType === "value-gallery") {
        const d = cardData as { core: string[]; deferred: string[] };
        next.E.coreValues = field(d.core, "user_selected");
        next.E.deferredValues = field(d.deferred, "user_selected");
      } else if (cardType === "agree-disagree") {
        const d = cardData as { agreed: boolean; reason?: string };
        next.E.agreeDisagree = field(d.agreed ? "同意" : `不同意：${d.reason || ""}`, "user_selected");
      } else if (cardType === "single-select") {
        // Extract direction keyword from full option text
        const raw = cardData as string;
        const dirMatch = raw.match(/^(内核|创造|连接)/);
        next.E.direction = field(dirMatch?.[1] || raw, "user_selected");
      } else if (cardType === "snapshot") {
        next.E.snapshot = field(cardData as string, "ai_inferred");
      }
      break;
    }

  }

  return next;
}

// ─── Template-based snapshot generation ──────────────
// Snapshots are generated from structured fields, NOT from LLM.
// This ensures "zero new facts" even in ai_inferred sections.

export function generateSnapshotFromFields(
  data: CompassDataSchema,
  moduleId: string,
): string {
  switch (moduleId) {
    case "S": {
      const matrix = data.S?.capitalMatrix?.value;
      const priority = data.S?.priorityUpgrade?.value;
      if (!matrix) return "（数据不足，无法生成快照）";
      const lines = matrix.map((r) => `${r.label}：${r.level}${r.keyword ? `（${r.keyword}）` : ""}`);
      return `家庭资本盘点：\n${lines.join("；")}\n\n战略优先升级：${priority || "（未选择）"}`;
    }

    case "N": {
      const ranked = data.N?.trendsRanked?.value || [];
      const ability = data.N?.coreAbility?.value;
      const explain = data.N?.insightExplain?.value;
      const connect = data.N?.insightConnect?.value;
      const gap = data.N?.insightGap?.value;
      const agreed = data.N?.agreeDisagree?.value;

      let text = "【眼光快照】\n\n";
      text += `趋势判断：${ranked[0] || "（未选择）"}（主假设）`;
      if (ranked[1]) text += `、${ranked[1]}（对冲）`;
      if (ranked[2]) text += `、${ranked[2]}（对冲）`;
      text += `\n\n能力押注：${ability || "（未选择）"}`;
      text += "\n\n诊断摘要：";
      text += `\n- 趋势洞察：${explain || "（未生成）"}`;
      text += `\n- 家底关联：${connect || "（未生成）"}`;
      text += `\n- 现状差距：${gap || "（未生成）"}`;
      if (agreed) {
        text += `\n\n${agreed.agreed ? "已确认" : "用户有保留意见：" + (agreed.reasons?.join("、") || "") + (agreed.detail ? "（" + agreed.detail + "）" : "")}`;
      }
      return text;
    }

    case "W": {
      // Use w-templates buildWSnapshot for comprehensive snapshot
      const tradeoffs = data.W?.tradeoffChoices?.value;
      let tradeoffSummary: string | undefined;
      if (tradeoffs?.length) {
        tradeoffSummary = tradeoffs.map((t) => `${t.choice === "A" ? t.labelA : t.labelB}`).join("；");
      }
      // Import inline to avoid circular dep
      const lines: string[] = [];
      const story = data.W?.story?.value;
      if (story) lines.push(`家族故事：${story.slice(0, 80)}${story.length > 80 ? "…" : ""}`);
      if (tradeoffSummary) lines.push(`默认取舍：${tradeoffSummary}`);
      const heroTraits = data.W?.heroTraits?.value;
      if (heroTraits?.length) lines.push(`英雄基因：${heroTraits.join("、")}`);
      const coreCode = data.W?.coreCode?.value;
      if (coreCode) lines.push(`家风内核：${coreCode.name}（${coreCode.definition}）`);
      const finalStmt = data.W?.finalStatement?.value;
      if (finalStmt) lines.push(`\n升级宣言：${finalStmt}`);
      return lines.join("\n") || "（数据不足，无法生成快照）";
    }

    case "E": {
      const anchors = data.E?.anchors?.value;
      const core = data.E?.coreValues?.value;
      const deferred = data.E?.deferredValues?.value;
      const dir = data.E?.direction?.value;
      let text = "";
      if (anchors) {
        text += `直觉锚点：最希望孩子拥有「${anchors.gift_to_child}」，最怕缺少「${anchors.fear_child_lacks}」\n`;
      }
      if (core) text += `核心价值观：${core.join("、")}\n`;
      if (deferred) text += `战略暂缓：${deferred.join("、")}\n`;
      text += `战略方向：${dir || "（未选择）"}`;
      return text;
    }

    default:
      return "（未知模块）";
  }
}

// ─── Safe field accessor ─────────────────────────────
// Returns value or fallback text for PDF rendering.

export function val<T>(
  tracked: TrackedField<T> | undefined,
  fallback = "（未在对话中提及）",
): T | string {
  if (!tracked || tracked.value === null || tracked.value === undefined) {
    return fallback;
  }
  return tracked.value;
}

export function isInferred(tracked: TrackedField<unknown> | undefined): boolean {
  return tracked?.source === "ai_inferred";
}
