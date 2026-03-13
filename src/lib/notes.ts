/**
 * Consulting Memo — state-based notes from compass_data.
 *
 * Design principles:
 * 1. Notes = current state, NOT event log
 * 2. Each module → 1 dense fact memo (replace, not append)
 * 3. After module snapshot → 1-2 AI insights (template-based, zero hallucination)
 * 4. Target: 3-6 fact memos + 0-4 insights = max ~10 items
 * 5. No low-info inputs ("是的", "好的", "同意" etc.)
 * 6. No chat messages — only card-confirmed compass_data fields
 */

// ─── Note type ──────────────────────────────────────────

export interface Note {
  id: string;
  /** Which module: _ / S / N / W / E */
  moduleId: string;
  /** "fact" = from compass_data; "insight" = template-based AI interpretation */
  noteType: "fact" | "insight";
  /** Human-readable source label */
  sourceLabel: string;
  /** The bullet text */
  bullet: string;
  /** Orange highlight — will be exported to PDF */
  isHighlight: boolean;
  /** confirmed = verified; pending = needs confirmation */
  status: "confirmed" | "pending";
  /** ISO timestamp */
  updatedAt: string;
  /** For backwards compat with old code */
  sourceCardType: string;
}

// Keep OpenLoop for potential future use
export interface OpenLoop {
  id: string;
  moduleId: string;
  description: string;
  nodeIndex: number;
  resolved: boolean;
}

// ─── Compass data shape (minimal, for rebuild) ──────────

interface CompassLike {
  familyCode?: { value: string };
  S?: {
    capitalMatrix?: { value: { label: string; level: string; keyword: string }[] };
    capitalSummaryAgreed?: { value: boolean };
    capitalRationale?: { value: string };
    priorityUpgrade?: { value: string };
    snapshot?: { value: string };
  };
  N?: {
    trendsRanked?: { value: string[] };
    coreAbility?: { value: string };
    agreeDisagree?: { value: { agreed: boolean; reasons?: string[]; detail?: string } };
    snapshot?: { value: string };
  };
  W?: {
    story?: { value: string };
    storyPriorityTag?: { value: string };
    tradeoffChoices?: { value: { axisId: string; labelA: string; labelB: string; choice: "A" | "B" }[] };
    heroTraits?: { value: string[] };
    quoteChildhood?: { value: string };
    quoteNow?: { value: string };
    quoteThemeTag?: { value: string };
    coreCode?: { value: { name: string; definition: string; userEdited?: boolean } };
    flipsideTags?: { value: string[] };
    flipsideExample?: { value: string };
    flipsideBenefit?: { value: string };
    flipsideCost?: { value: string };
    upgradeKeep?: { value: string };
    upgradeReduce?: { value: string };
    upgradeFrom?: { value: string };
    upgradeTo?: { value: string };
    finalStatement?: { value: string };
    snapshot?: { value: string };
  };
  E?: {
    anchors?: { value: { gift_to_child: string; fear_child_lacks: string } };
    coreValues?: { value: string[] };
    deferredValues?: { value: string[] };
    agreeDisagree?: { value: string };
    direction?: { value: string };
    snapshot?: { value: string };
  };
}

// ─── Memo builder ───────────────────────────────────────

let idCounter = 0;

function makeFact(
  moduleId: string,
  sourceLabel: string,
  bullet: string,
  highlight = false,
): Note {
  return {
    id: `memo_${++idCounter}`,
    moduleId,
    noteType: "fact",
    sourceLabel,
    sourceCardType: moduleId,
    bullet,
    isHighlight: highlight,
    status: "confirmed",
    updatedAt: new Date().toISOString(),
  };
}

function makeInsight(
  moduleId: string,
  bullet: string,
  modules: string[],
): Note {
  return {
    id: `insight_${++idCounter}`,
    moduleId,
    noteType: "insight",
    sourceLabel: modules.map((m) => ({ S: "家底", N: "眼光", W: "根基", E: "共识" }[m] || m)).join("+"),
    sourceCardType: "insight",
    bullet,
    isHighlight: false,
    status: "confirmed",
    updatedAt: new Date().toISOString(),
  };
}

// Module index → module ID mapping
const MODULE_IDS = ["S", "N", "W", "E"];

/**
 * Build the consulting memo from compass_data.
 * Only shows modules up to and including `currentModule`.
 * Prevents "越级写入" — no future-module content leaks.
 *
 * @param cd - compass data
 * @param currentModule - 0-based module index (0=S, 1=N, 2=W, 3=E)
 * @param completedModules - indices of completed modules
 */
export function buildMemo(
  cd: CompassLike,
  currentModule = 3,
  completedModules: number[] = [0, 1, 2, 3],
): Note[] {
  idCounter = 0;
  const notes: Note[] = [];

  // Which module IDs are allowed to show?
  const allowedModules = new Set<string>();
  for (let i = 0; i <= currentModule; i++) {
    allowedModules.add(MODULE_IDS[i]);
  }
  // Helper: is a module's snapshot confirmed? (for insights)
  const isSnapshotConfirmed = (modId: string): boolean => {
    const idx = MODULE_IDS.indexOf(modId);
    return completedModules.includes(idx);
  };

  // ── Family code ──
  if (cd.familyCode?.value) {
    notes.push(makeFact("_", "家庭代号", `家庭代号：${cd.familyCode.value}`, true));
  }

  // ── S 家底 ── (1 merged memo, only if S is allowed)
  if (allowedModules.has("S")) {
    const sParts: string[] = [];
    if (cd.S?.capitalMatrix?.value) {
      const m = cd.S.capitalMatrix.value;
      sParts.push(m.map((r) => `${r.label}${r.level}`).join(" · "));
    }
    if (cd.S?.priorityUpgrade?.value) {
      sParts.push(`优先升级「${cd.S.priorityUpgrade.value}」`);
    }
    if (sParts.length) {
      notes.push(makeFact("S", "家底", sParts.join(" → "), true));
    }
  }

  // ── N 眼光 ── (only if N is allowed)
  if (allowedModules.has("N")) {
    const nParts: string[] = [];
    if (cd.N?.trendsRanked?.value) {
      const r = cd.N.trendsRanked.value;
      nParts.push(`主假设「${r[0]}」`);
      if (r.length > 1) nParts.push(`对冲「${r.slice(1).join("·")}」`);
    }
    if (cd.N?.coreAbility?.value) {
      nParts.push(`押注「${cd.N.coreAbility.value}」`);
    }
    if (nParts.length) {
      notes.push(makeFact("N", "眼光", nParts.join(" | "), true));
    }
  }

  // ── W 根基 ── (only if W is allowed)
  if (allowedModules.has("W")) {
    const wParts: string[] = [];
    if (cd.W?.coreCode?.value) {
      const cc = cd.W.coreCode.value;
      wParts.push(`内核「${cc.name}」= ${cc.definition}`);
    }
    if (cd.W?.heroTraits?.value?.length) {
      wParts.push(`英雄基因：${cd.W.heroTraits.value.join("·")}`);
    }
    if (wParts.length) {
      notes.push(makeFact("W", "根基", wParts.join("；"), true));
    }
    if (cd.W?.upgradeKeep?.value && cd.W?.upgradeTo?.value) {
      const from = cd.W.upgradeFrom?.value;
      const to = cd.W.upgradeTo.value;
      const keep = cd.W.upgradeKeep.value;
      notes.push(makeFact("W", "升级路径", `保留「${keep}」，从「${from || "…"}」→「${to}」`));
    }
  }

  // ── E 共识 ── (only if E is allowed)
  if (allowedModules.has("E")) {
    const eParts: string[] = [];
    if (cd.E?.coreValues?.value?.length) {
      eParts.push(`价值观：${cd.E.coreValues.value.join("·")}`);
    }
    if (cd.E?.deferredValues?.value?.length) {
      eParts.push(`暂缓：${cd.E.deferredValues.value.join("·")}`);
    }
    if (cd.E?.direction?.value) {
      eParts.push(`方向：${cd.E.direction.value}`);
    }
    if (cd.E?.anchors?.value) {
      const a = cd.E.anchors.value;
      if (a.gift_to_child) eParts.push(`最盼「${a.gift_to_child}」`);
      if (a.fear_child_lacks) eParts.push(`最怕缺「${a.fear_child_lacks}」`);
    }
    if (eParts.length) {
      notes.push(makeFact("E", "共识", eParts.join(" | "), true));
    }
  }

  // ── AI Insights (template-based, zero hallucination) ──
  // Only generated after module snapshot is confirmed (completedModules check)
  const levelMap: Record<string, number> = { L3: 3, L2: 2, L1: 1 };

  // After S snapshot: resource structure insight
  if (isSnapshotConfirmed("S") && cd.S?.capitalMatrix?.value && cd.S?.priorityUpgrade?.value) {
    const matrix = cd.S.capitalMatrix.value;
    const priority = cd.S.priorityUpgrade.value;
    const sorted = [...matrix].sort((a, b) => (levelMap[b.level] || 0) - (levelMap[a.level] || 0));
    const top = sorted[0];
    const bottom = sorted[sorted.length - 1];
    if (top && bottom && top.level !== bottom.level) {
      notes.push(makeInsight("S",
        `${bottom.label}(${bottom.level})是当前短板，升级「${priority}」是关键杠杆`,
        ["S"],
      ));
    }
  }

  // After N snapshot: trend-ability-resource coherence
  if (isSnapshotConfirmed("N") && cd.N?.trendsRanked?.value && cd.N?.coreAbility?.value) {
    const trend = cd.N.trendsRanked.value[0];
    const ability = cd.N.coreAbility.value;
    if (cd.S?.priorityUpgrade?.value) {
      notes.push(makeInsight("N",
        `趋势「${trend}」+ 能力「${ability}」+ 升级「${cd.S.priorityUpgrade.value}」三者是否协同？`,
        ["S", "N"],
      ));
    }
  }

  // After W snapshot: core code vs ability coherence + flipside coverage
  if (isSnapshotConfirmed("W") && cd.W?.coreCode?.value) {
    const cc = cd.W.coreCode.value;
    if (cd.N?.coreAbility?.value) {
      notes.push(makeInsight("W",
        `内核「${cc.name}」与能力「${cd.N.coreAbility.value}」是否一脉相承？`,
        ["W", "N"],
      ));
    }
    if (cd.W?.flipsideCost?.value && cd.W?.upgradeTo?.value) {
      notes.push(makeInsight("W",
        `副作用代价「${cd.W.flipsideCost.value}」→ 升级路径已覆盖`,
        ["W"],
      ));
    }
  }

  // After E snapshot: deferred values vs priority tension
  if (isSnapshotConfirmed("E") && cd.E?.deferredValues?.value?.length && cd.S?.priorityUpgrade?.value) {
    notes.push(makeInsight("E",
      `暂缓「${cd.E.deferredValues.value.join("·")}」需确认不与升级方向「${cd.S.priorityUpgrade.value}」矛盾`,
      ["E", "S"],
    ));
  }

  return notes;
}

// ── Rebuild alias (for backwards compat) ──

export function rebuildNotesFromCompassData(
  cd: CompassLike,
  currentModule = 3,
  completedModules: number[] = [0, 1, 2, 3],
): Note[] {
  return buildMemo(cd, currentModule, completedModules);
}

// ── Legacy exports (kept for type compat, no longer used for generation) ──

export const SOURCE_LABELS: Record<string, string> = {
  "family-code": "家庭代号",
  "capital-matrix": "我们的资源",
  "priority-select": "发力方向",
  "trend-rank": "趋势判断",
  "ability-select": "能力押注",
  "story-input": "情感地标",
  "core-code-confirm": "家风内核",
  "upgrade-path": "升级路径",
  "value-gallery": "价值观选择",
  "single-select": "战略方向",
};

/** @deprecated — use buildMemo instead */
export function generateNotes(
  _moduleId: string,
  _cardType: string,
  _data: unknown,
): Note[] {
  return [];
}
