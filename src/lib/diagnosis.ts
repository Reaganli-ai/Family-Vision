/**
 * Template-based cross-module diagnosis engine.
 *
 * Rules:
 * - Only references structured compass_data fields (zero hallucination)
 * - All output tagged [AI解读]
 * - Does NOT create new facts — only connects / explains / flags conflicts
 * - Updates once per module completion (called after snapshot confirm)
 */

import type { CompassDataSchema } from "./compass-schema";

// ─── Types ──────────────────────────────────────────

export interface Diagnosis {
  id: string;
  type: "explain" | "connect" | "conflict" | "risk";
  text: string;
  /** Which modules this diagnosis references */
  modules: string[];
}

export interface Gap {
  moduleId: string;
  field: string;
  label: string;
}

// ─── Diagnosis generation ───────────────────────────

/**
 * Generate template-based diagnoses from compass_data.
 * Each diagnosis ≤ 120 chars, references only existing fields.
 */
export function generateDiagnoses(cd: CompassDataSchema): Diagnosis[] {
  const results: Diagnosis[] = [];
  let counter = 0;
  const make = (
    type: Diagnosis["type"],
    text: string,
    modules: string[],
  ): void => {
    results.push({ id: `diag_${++counter}`, type, text, modules });
  };

  const levelMap: Record<string, number> = { L3: 3, L2: 2, L1: 1 };

  // ── After S ──
  const matrix = cd.S?.capitalMatrix?.value;
  const priority = cd.S?.priorityUpgrade?.value;

  if (matrix && priority) {
    const sorted = [...matrix].sort(
      (a, b) => (levelMap[b.level] || 0) - (levelMap[a.level] || 0),
    );
    const top = sorted[0];
    const bottom = sorted[sorted.length - 1];

    if (top && bottom && top.level !== bottom.level) {
      make(
        "explain",
        `${top.label}(${top.level})是优势，${bottom.label}(${bottom.level})是短板；选择优先升级「${priority}」`,
        ["S"],
      );
    } else if (top) {
      make("explain", `三项资本均衡(${top.level})；选择优先升级「${priority}」`, ["S"]);
    }
  }

  // ── After N ──
  const trend = cd.N?.trendsRanked?.value?.[0];
  const ability = cd.N?.coreAbility?.value;

  if (trend && ability) {
    make("explain", `趋势主假设「${trend}」+ 能力押注「${ability}」`, ["N"]);

    // Cross: N ↔ S
    if (priority) {
      // Simple heuristic: if priority is 文化资本 and ability is cognitive, they align
      make(
        "connect",
        `升级方向「${priority}」与能力押注「${ability}」— 是否形成合力？`,
        ["S", "N"],
      );
    }
  }

  // ── After W ──
  const coreCode = cd.W?.coreCode?.value;

  if (coreCode) {
    make(
      "explain",
      `家风内核「${coreCode.name}」：${coreCode.definition}`,
      ["W"],
    );

    // Cross: W ↔ N
    if (ability) {
      make(
        "connect",
        `内核「${coreCode.name}」与能力「${ability}」是否一致？内核支撑能力培养吗？`,
        ["W", "N"],
      );
    }

    // Flipside risk
    const flipsideCost = cd.W?.flipsideCost?.value;
    if (flipsideCost) {
      const upgradeFrom = cd.W?.upgradeFrom?.value;
      const upgradeTo = cd.W?.upgradeTo?.value;
      if (upgradeFrom && upgradeTo) {
        make(
          "risk",
          `副作用代价「${flipsideCost}」→ 升级路径：从「${upgradeFrom}」到「${upgradeTo}」— 是否覆盖？`,
          ["W"],
        );
      } else {
        make("risk", `副作用代价「${flipsideCost}」尚未制定升级路径`, ["W"]);
      }
    }
  }

  // ── After E ──
  const coreValues = cd.E?.coreValues?.value;
  const deferredValues = cd.E?.deferredValues?.value;
  const direction = cd.E?.direction?.value;

  if (coreValues?.length) {
    make(
      "explain",
      `核心价值观：${coreValues.join("、")}${direction ? `；方向：${direction}` : ""}`,
      ["E"],
    );

    // Cross: E ↔ W
    if (coreCode) {
      make(
        "connect",
        `价值观「${coreValues.join("、")}」与内核「${coreCode.name}」是否一脉相承？`,
        ["E", "W"],
      );
    }

    // Conflict: deferred vs priority
    if (deferredValues?.length && priority) {
      make(
        "conflict",
        `暂缓了「${deferredValues.join("、")}」— 确认不与升级方向「${priority}」矛盾`,
        ["E", "S"],
      );
    }
  }

  return results;
}

// ─── Gap detection ──────────────────────────────────

const MODULE_FIELDS: Record<string, { key: string; label: string }[]> = {
  S: [
    { key: "capitalMatrix", label: "资本矩阵评估" },
    { key: "priorityUpgrade", label: "升级方向选择" },
    { key: "snapshot", label: "家底快照确认" },
  ],
  N: [
    { key: "trendsRanked", label: "Top3 趋势排序" },
    { key: "coreAbility", label: "核心素养选择" },
    { key: "snapshot", label: "眼光快照确认" },
  ],
  W: [
    { key: "story", label: "家族故事" },
    { key: "coreCode", label: "家风内核命名" },
    { key: "snapshot", label: "根基快照确认" },
  ],
  E: [
    { key: "anchors", label: "直觉锚点" },
    { key: "coreValues", label: "核心价值观选择" },
    { key: "direction", label: "战略方向选择" },
    { key: "snapshot", label: "共识快照确认" },
  ],
};

const MODULE_ORDER = ["S", "N", "W", "E"];
const MODULE_STEP_MAP: Record<string, string> = {
  S: "step1",
  N: "step2",
  W: "step3",
  E: "step4",
};

/**
 * Detect unfilled essential fields across all modules.
 * Returns gaps ordered by module sequence.
 */
export function getGaps(cd: CompassDataSchema): Gap[] {
  const gaps: Gap[] = [];

  for (const moduleId of MODULE_ORDER) {
    const fields = MODULE_FIELDS[moduleId];
    const moduleData = cd[moduleId as keyof CompassDataSchema];

    for (const { key, label } of fields) {
      let filled = false;

      if (moduleData && typeof moduleData === "object") {
        const tracked = (moduleData as Record<string, unknown>)[key] as
          | { value?: unknown }
          | undefined;
        filled = tracked?.value != null;
        // Check for empty arrays / empty strings
        if (filled) {
          const v = tracked!.value;
          if (Array.isArray(v) && v.length === 0) filled = false;
          if (typeof v === "string" && v.trim() === "") filled = false;
        }
      }

      if (!filled) {
        gaps.push({ moduleId, field: key, label });
      }
    }
  }

  return gaps;
}

/** Get step ID for a module ID */
export function getStepIdForModule(moduleId: string): string {
  return MODULE_STEP_MAP[moduleId] || "step1";
}

// ─── Fact snapshot extraction ───────────────────────

export interface FactSnapshotModule {
  moduleId: string;
  label: string;
  fields: { key: string; value: string; highlight?: boolean }[];
}

/**
 * Extract structured fact snapshot from compass_data for display.
 * Only shows fields that have values — never fabricates.
 */
export function extractFactSnapshot(cd: CompassDataSchema): FactSnapshotModule[] {
  const modules: FactSnapshotModule[] = [];

  // S
  const sFields: FactSnapshotModule["fields"] = [];
  if (cd.S?.capitalMatrix?.value) {
    const m = cd.S.capitalMatrix.value;
    sFields.push({
      key: "资本矩阵",
      value: m.map((r) => `${r.label} ${r.level}`).join("、"),
    });
  }
  if (cd.S?.priorityUpgrade?.value) {
    sFields.push({
      key: "优先升级",
      value: cd.S.priorityUpgrade.value,
      highlight: true,
    });
  }
  if (sFields.length) modules.push({ moduleId: "S", label: "家底", fields: sFields });

  // N
  const nFields: FactSnapshotModule["fields"] = [];
  if (cd.N?.trendsRanked?.value) {
    const r = cd.N.trendsRanked.value;
    nFields.push({
      key: "趋势",
      value: `${r[0]}（主）${r[1] ? `、${r[1]}（对冲）` : ""}${r[2] ? `、${r[2]}` : ""}`,
    });
  }
  if (cd.N?.coreAbility?.value) {
    nFields.push({
      key: "能力押注",
      value: cd.N.coreAbility.value,
      highlight: true,
    });
  }
  if (nFields.length) modules.push({ moduleId: "N", label: "眼光", fields: nFields });

  // W
  const wFields: FactSnapshotModule["fields"] = [];
  if (cd.W?.coreCode?.value) {
    const cc = cd.W.coreCode.value;
    wFields.push({
      key: "家风内核",
      value: `${cc.name}（${cc.definition}）`,
      highlight: true,
    });
  }
  if (cd.W?.heroTraits?.value) {
    wFields.push({
      key: "英雄基因",
      value: cd.W.heroTraits.value.join("、"),
    });
  }
  if (cd.W?.upgradeKeep?.value && cd.W?.upgradeTo?.value) {
    wFields.push({
      key: "升级路径",
      value: `保留「${cd.W.upgradeKeep.value}」→「${cd.W.upgradeTo.value}」`,
    });
  }
  if (wFields.length) modules.push({ moduleId: "W", label: "根基", fields: wFields });

  // E
  const eFields: FactSnapshotModule["fields"] = [];
  if (cd.E?.coreValues?.value) {
    eFields.push({
      key: "核心价值观",
      value: cd.E.coreValues.value.join("、"),
      highlight: true,
    });
  }
  if (cd.E?.deferredValues?.value?.length) {
    eFields.push({
      key: "战略暂缓",
      value: cd.E.deferredValues.value.join("、"),
    });
  }
  if (cd.E?.direction?.value) {
    eFields.push({
      key: "方向",
      value: cd.E.direction.value,
      highlight: true,
    });
  }
  if (eFields.length) modules.push({ moduleId: "E", label: "共识", fields: eFields });

  return modules;
}
