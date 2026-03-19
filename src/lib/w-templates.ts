/**
 * W Module Template Library — axis templates, flipside map, statement builder.
 *
 * Core guardrail: AI only outputs axis_id + keyword slots.
 * All user-facing A/B text is rendered by this template library.
 */

// ─── Tradeoff Axis Library ───────────────────────────

export interface AxisTemplate {
  id: string;
  dimension: string;
  labelA: string;           // template with {keyword} slot
  labelB: string;
  fallbackKeyword: string;  // if AI doesn't provide one
}

export const TRADEOFF_AXES: Record<string, AxisTemplate> = {
  "integrity-vs-result": {
    id: "integrity-vs-result",
    dimension: "诚信/原则 vs 利益/结果",
    labelA: "宁可吃亏也要守「{keyword}」",
    labelB: "「{keyword}」重要，但结果更关键时可以灵活处理",
    fallbackKeyword: "信用",
  },
  "safety-vs-growth": {
    id: "safety-vs-growth",
    dimension: "安全/稳定 vs 冒险/成长",
    labelA: "「{keyword}」最重要，别冒不必要的险",
    labelB: "去做吧，「{keyword}」的代价我们承受得起",
    fallbackKeyword: "稳定",
  },
  "rules-vs-relations": {
    id: "rules-vs-relations",
    dimension: "规则/秩序 vs 人情/关系",
    labelA: "「{keyword}」是底线，谁来都不能破",
    labelB: "「{keyword}」要讲，但人情更重要",
    fallbackKeyword: "规矩",
  },
  "achievement-vs-balance": {
    id: "achievement-vs-balance",
    dimension: "成就/第一 vs 身心/平衡",
    labelA: "要做就做到最好，「{keyword}」不能将就",
    labelB: "「{keyword}」重要，但别把自己逼太紧",
    fallbackKeyword: "成绩",
  },
  "obedience-vs-expression": {
    id: "obedience-vs-expression",
    dimension: "服从/权威 vs 表达/自主",
    labelA: "听长辈的话，「{keyword}」少走弯路",
    labelB: "「{keyword}」要自己想明白，不能只听别人的",
    fallbackKeyword: "方向",
  },
  "face-vs-authenticity": {
    id: "face-vs-authenticity",
    dimension: "面子/评价 vs 真实/边界",
    labelA: "「{keyword}」不能丢，别人怎么看很重要",
    labelB: "自己舒不舒服比「{keyword}」重要",
    fallbackKeyword: "面子",
  },
};

/**
 * Render axis A/B labels by substituting keyword into template.
 */
export function renderAxisLabels(
  axisId: string,
  keyword?: string,
): { labelA: string; labelB: string; dimension: string } | null {
  const axis = TRADEOFF_AXES[axisId];
  if (!axis) return null;
  const kw = keyword || axis.fallbackKeyword;
  return {
    labelA: axis.labelA.replace("{keyword}", kw),
    labelB: axis.labelB.replace("{keyword}", kw),
    dimension: axis.dimension,
  };
}

// ─── Q1b Tag → Recommended Axes ─────────────────────

export const TAG_AXIS_MAP: Record<string, string[]> = {
  "面子":     ["face-vs-authenticity", "obedience-vs-expression"],
  "利益结果": ["integrity-vs-result", "achievement-vs-balance"],
  "安全风险": ["safety-vs-growth", "rules-vs-relations"],
  "规则原则": ["rules-vs-relations", "integrity-vs-result"],
  "人情关系": ["rules-vs-relations", "face-vs-authenticity"],
  "成绩成就": ["achievement-vs-balance", "obedience-vs-expression"],
  "情绪心理": ["safety-vs-growth", "face-vs-authenticity"],
};

// ─── Axis Keyword Map (for smart fallback) ──────────

export const AXIS_KEYWORD_MAP: Record<string, string[]> = {
  "integrity-vs-result": [
    "诚信", "信用", "守信", "诚实", "欺骗", "说谎", "承诺", "食言",
    "原则", "底线", "正直", "靠谱", "口碑", "信誉",
  ],
  "safety-vs-growth": [
    "稳定", "安全", "冒险", "风险", "尝试", "保守", "闯", "创业",
    "辞职", "跳槽", "大胆", "稳当", "冲动", "谨慎",
  ],
  "rules-vs-relations": [
    "规矩", "规则", "纪律", "人情", "关系", "通融", "制度", "破例",
    "变通", "秩序", "法", "情面", "照顾", "偏袒",
  ],
  "achievement-vs-balance": [
    "成绩", "第一", "竞争", "拼", "卷", "压力", "放松", "平衡",
    "快乐", "健康", "内卷", "名次", "努力", "赢",
  ],
  "obedience-vs-expression": [
    "听话", "服从", "长辈", "权威", "顶嘴", "反抗", "自主", "主见",
    "独立", "叛逆", "管教", "尊重", "乖", "懂事",
  ],
  "face-vs-authenticity": [
    "面子", "丢人", "体面", "攀比", "真实", "内心", "装", "虚荣",
    "别人怎么看", "丢脸", "外人", "做自己", "笑话", "好看",
  ],
};

/**
 * Infer axis IDs from AI response text by keyword matching.
 * Returns 2-3 axis IDs sorted by hit count, or [] if < 2 axes matched.
 */
export function inferAxesFromText(text: string): string[] {
  const scores: { id: string; count: number }[] = [];
  for (const [id, keywords] of Object.entries(AXIS_KEYWORD_MAP)) {
    const count = keywords.filter((kw) => text.includes(kw)).length;
    scores.push({ id, count });
  }
  scores.sort((a, b) => b.count - a.count);
  const hits = scores.filter((s) => s.count > 0);
  if (hits.length < 2) return [];
  return hits.slice(0, 3).map((s) => s.id);
}

// ─── Hero Trait Options ──────────────────────────────

export const HERO_TRAITS = [
  { label: "白手起家", description: "从无到有，靠自己闯出来" },
  { label: "守信重诺", description: "答应了就做到，从不食言" },
  { label: "知识渊博", description: "有见识有学问，全家的智囊" },
  { label: "庇护全族", description: "遇到事扛在前面，保护家人" },
  { label: "坚韧不拔", description: "再苦再难也不放弃" },
  { label: "会做人/关系通达", description: "左右逢源，人脉极广" },
];

// ─── Flipside Tag Options ────────────────────────────

export const FLIPSIDE_TAGS = [
  { label: "过度严格/恐惧驱动", description: "用恐惧而非引导来管教" },
  { label: "过度僵化/非黑即白", description: "不允许灰色地带，缺乏弹性" },
  { label: "关系损耗/压抑表达", description: "为了维持秩序牺牲真实沟通" },
  { label: "焦虑内耗/完美主义", description: "总觉得不够好，永远在自我加压" },
  { label: "回避冲突", description: "什么都忍着，问题一直堆积" },
];

// ─── Q1b Priority Tag Options ────────────────────────

export const PRIORITY_TAGS = [
  "面子", "利益结果", "安全风险", "规则原则",
  "人情关系", "成绩成就", "情绪心理",
];

// ─── Quote Theme Tag Options ─────────────────────────

export const QUOTE_THEME_TAGS = [
  "安全感", "秩序", "关系", "面子",
  "效率", "成长", "尊严",
];

// ─── Final Statement Template ────────────────────────

export function buildFinalStatement(params: {
  coreCodeName: string;
  keep: string;
  from: string;
  to: string;
  reduce: string;
}): string {
  const { coreCodeName, keep, from, to, reduce } = params;
  // Graceful degradation: skip empty fields
  let stmt = `我们家坚持「${coreCodeName || "（未命名）"}」`;
  if (keep) stmt += `，保留「${keep}」`;
  if (from && to) stmt += `，但会从「${from}」升级为「${to}」`;
  if (reduce) stmt += `，以减少「${reduce}」`;
  stmt += "。";
  return stmt;
}

// ─── Snapshot Template ───────────────────────────────

export function buildWSnapshot(params: {
  story?: string;
  tradeoffSummary?: string;
  heroTraits?: string[];
  coreCode?: { name: string; definition: string };
  finalStatement?: string;
}): string {
  const lines: string[] = [];
  if (params.story) {
    lines.push(`家族故事：${params.story.slice(0, 80)}${params.story.length > 80 ? "…" : ""}`);
  }
  if (params.tradeoffSummary) {
    lines.push(`默认取舍：${params.tradeoffSummary}`);
  }
  if (params.heroTraits?.length) {
    lines.push(`英雄基因：${params.heroTraits.join("、")}`);
  }
  if (params.coreCode) {
    lines.push(`家风内核：${params.coreCode.name}（${params.coreCode.definition}）`);
  }
  if (params.finalStatement) {
    lines.push(`\n升级宣言：${params.finalStatement}`);
  }
  return lines.join("\n") || "（数据不足，无法生成快照）";
}
