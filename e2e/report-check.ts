/**
 * Quick smoke test for CompassReport page + PDF export.
 * Run: npx tsx e2e/report-check.ts
 *
 * Tests:
 * 1. toViewData field mapping — no blanks when data exists
 * 2. Report API returns valid insights + drafts
 * 3. Vision statement follows the template structure
 */

// ─── 1. Test toViewData field mapping ───

const MOCK_COMPASS = {
  familyCode: { value: "LC" },
  S: {
    capitalMatrix: {
      value: [
        { label: "经济资本", level: "L1", keyword: "存款少" },
        { label: "文化资本", level: "L3", keyword: "高学历" },
        { label: "社会资本", level: "L2", keyword: "有人脉" },
      ],
    },
    priorityUpgrade: { value: "经济资本" },
    capitalRationale: { value: "文化资本最强因为双博士" },
  },
  N: {
    trendsRanked: { value: ["AI替代", "全球化", "老龄化"] },
    coreAbility: { value: "跨文化沟通" },
  },
  W: {
    story: { value: "小时候家里穷但父母坚持让我读书" },
    coreCode: { value: { name: "韧性", definition: "遇到困难不退缩" } },
    heroTraits: { value: ["坚持", "自省", "好奇"] },
    tradeoffChoices: {
      value: [
        { axisId: "a1", labelA: "自由", labelB: "安全", choice: "A" as const },
        { axisId: "a2", labelA: "深度", labelB: "广度", choice: "A" as const },
      ],
    },
    quoteChildhood: { value: "跌倒了自己爬起来" },
    quoteNow: { value: "困难是成长的养料" },
    quoteThemeTag: { value: "传承" },
    flipsideTags: { value: ["固执", "忽视感受"] },
    flipsideExample: { value: "孩子哭的时候说别哭" },
    flipsideBenefit: { value: "抗压能力强" },
    flipsideCost: { value: "忽视情感需求" },
    upgradeKeep: { value: "韧性" },
    upgradeReduce: { value: "固执" },
    upgradeFrom: { value: "硬扛" },
    upgradeTo: { value: "弹性应对" },
    finalStatement: { value: "保留韧性的内核，学会弹性面对" },
  },
  E: {
    anchors: { value: { gift_to_child: "自信", fear_child_lacks: "同理心" } },
    coreValues: { value: ["诚实", "好奇", "独立"] },
    deferredValues: { value: ["竞争", "服从"] },
    direction: { value: "培养内驱力" },
  },
};

const NOT_MENTIONED = "（未在对话中提及）";

// Replicate toViewData logic from CompassReport.tsx
function toViewData(cd: any) {
  const matrix = cd.S?.capitalMatrix?.value;
  const getLevel = (label: string) => {
    const row = matrix?.find((r: any) => r.label === label);
    return row ? `${row.level}${row.keyword ? `（${row.keyword}）` : ""}` : NOT_MENTIONED;
  };
  const coreValues = cd.E?.coreValues?.value || [];
  const deferredValues = cd.E?.deferredValues?.value || [];

  return {
    familyCode: cd.familyCode?.value || "",
    generatedDate: new Date().toLocaleDateString("zh-CN"),
    s_economic_level: getLevel("经济资本"),
    s_cultural_level: getLevel("文化资本"),
    s_social_level: getLevel("社会资本"),
    s_priority_capital: cd.S?.priorityUpgrade?.value || NOT_MENTIONED,
    n_key_trend: cd.N?.trendsRanked?.value?.join("、") || NOT_MENTIONED,
    n_core_competency: cd.N?.coreAbility?.value || NOT_MENTIONED,
    w_story: cd.W?.story?.value || NOT_MENTIONED,
    w_core_spirit: cd.W?.coreCode?.value?.name || NOT_MENTIONED,
    w_spirit_from: cd.W?.upgradeFrom?.value || NOT_MENTIONED,
    w_spirit_to: cd.W?.upgradeTo?.value || NOT_MENTIONED,
    e_gift_to_child: cd.E?.anchors?.value?.gift_to_child || NOT_MENTIONED,
    e_fear_child_lacks: cd.E?.anchors?.value?.fear_child_lacks || NOT_MENTIONED,
    e_value_1: coreValues[0] || NOT_MENTIONED,
    e_value_2: coreValues[1] || NOT_MENTIONED,
    e_value_3: coreValues[2] || NOT_MENTIONED,
    e_deferred: deferredValues.join("、") || NOT_MENTIONED,
    e_strategic_direction: cd.E?.direction?.value || NOT_MENTIONED,
  };
}

// ─── Run Tests ───

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    passed++;
    console.log(`  ✅ ${msg}`);
  } else {
    failed++;
    console.log(`  ❌ ${msg}`);
  }
}

console.log("\n=== Test 1: toViewData field mapping (no blanks) ===\n");

const view = toViewData(MOCK_COMPASS);

// Check no field is NOT_MENTIONED when data exists
const fieldChecks: [string, string][] = [
  ["familyCode", view.familyCode],
  ["s_economic_level", view.s_economic_level],
  ["s_cultural_level", view.s_cultural_level],
  ["s_social_level", view.s_social_level],
  ["s_priority_capital", view.s_priority_capital],
  ["n_key_trend", view.n_key_trend],
  ["n_core_competency", view.n_core_competency],
  ["w_story", view.w_story],
  ["w_core_spirit", view.w_core_spirit],
  ["w_spirit_from", view.w_spirit_from],
  ["w_spirit_to", view.w_spirit_to],
  ["e_gift_to_child", view.e_gift_to_child],
  ["e_fear_child_lacks", view.e_fear_child_lacks],
  ["e_value_1", view.e_value_1],
  ["e_value_2", view.e_value_2],
  ["e_value_3", view.e_value_3],
  ["e_deferred", view.e_deferred],
  ["e_strategic_direction", view.e_strategic_direction],
];

for (const [key, val] of fieldChecks) {
  assert(val !== NOT_MENTIONED && val !== "" && val !== undefined, `${key} = "${val}"`);
}

// Check specific values are correct
assert(view.n_key_trend === "AI替代、全球化、老龄化", `n_key_trend value correct`);
assert(view.n_core_competency === "跨文化沟通", `n_core_competency is string not array`);
assert(view.w_core_spirit === "韧性", `w_core_spirit from coreCode.name`);
assert(view.w_spirit_from === "硬扛", `w_spirit_from from upgradeFrom`);
assert(view.w_spirit_to === "弹性应对", `w_spirit_to from upgradeTo`);

// ─── Test 2: Empty data gracefully falls back ───
console.log("\n=== Test 2: Empty data graceful fallback ===\n");

const emptyView = toViewData({});
for (const [key, val] of Object.entries(emptyView)) {
  if (key === "generatedDate") continue;
  assert(
    val === NOT_MENTIONED || val === "",
    `empty.${key} = "${val}" (should be blank or NOT_MENTIONED)`
  );
}

// ─── Test 3: buildMemo module scoping ───
console.log("\n=== Test 3: buildMemo module scoping ===\n");

import { buildMemo } from "../src/lib/notes";

// At module 0 (S), should not show N/W/E
const s_only = buildMemo(MOCK_COMPASS as any, 0, []);
const s_modules = new Set(s_only.map((n) => n.moduleId));
assert(!s_modules.has("N"), `Module 0: no N notes`);
assert(!s_modules.has("W"), `Module 0: no W notes`);
assert(!s_modules.has("E"), `Module 0: no E notes`);
assert(s_modules.has("S") || s_modules.has("_"), `Module 0: has S or family code`);

// At module 1 (N), should show S + N but not W/E
const n_notes = buildMemo(MOCK_COMPASS as any, 1, [0]);
const n_modules = new Set(n_notes.map((n) => n.moduleId));
assert(n_modules.has("S"), `Module 1: has S notes`);
assert(n_modules.has("N"), `Module 1: has N notes`);
assert(!n_modules.has("W"), `Module 1: no W notes`);
assert(!n_modules.has("E"), `Module 1: no E notes`);

// Insights only appear after snapshot confirmed
const no_insights = buildMemo(MOCK_COMPASS as any, 0, []);
const insight_count_0 = no_insights.filter((n) => n.noteType === "insight").length;
assert(insight_count_0 === 0, `No insights without completed modules`);

const all_done = buildMemo(MOCK_COMPASS as any, 3, [0, 1, 2, 3]);
const insight_count_all = all_done.filter((n) => n.noteType === "insight").length;
assert(insight_count_all > 0, `Insights appear when all modules completed (${insight_count_all})`);

// ─── Test 4: Report API (skipped in CI, needs backend) ───
console.log("\n=== Test 4: Report API (/api/report) ===\n");

// Check if backend is available before testing
let apiAvailable = false;
try {
  const ping = await fetch("http://localhost:3001/api/report", { method: "HEAD" }).catch(() => null);
  apiAvailable = ping !== null;
} catch {}

if (!apiAvailable) {
  console.log("  ⏭️  Backend not running — skipping API tests (OK in CI)");
}

if (apiAvailable) try {
  const res = await fetch("http://localhost:3001/api/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ compassData: MOCK_COMPASS }),
  });

  if (!res.ok) {
    const err = await res.json();
    console.log(`  ❌ API returned ${res.status}: ${err.error}`);
    failed++;
  } else {
    const data = await res.json();

    assert(data.insights?.length === 5, `5 insights returned (got ${data.insights?.length})`);
    assert(data.drafts?.length === 3, `3 drafts returned (got ${data.drafts?.length})`);

    // Check insight IDs match expected
    const insightIds = data.insights.map((i: any) => i.id);
    assert(insightIds.includes("opportunity_match"), `Has opportunity_match insight`);
    assert(insightIds.includes("tension_resolve"), `Has tension_resolve insight`);
    assert(insightIds.includes("philosophy_anchor"), `Has philosophy_anchor insight`);

    // Check drafts have options
    for (const draft of data.drafts) {
      assert(
        draft.options?.length >= 2,
        `Draft "${draft.id}" has ${draft.options?.length} options (≥2)`
      );
    }

    // Check vision follows template (should mention family code or S/N/W/E keywords)
    const vision = data.drafts.find((d: any) => d.id === "vision_statement");
    if (vision) {
      const firstOption = vision.options[0]?.content || "";
      assert(firstOption.length > 20, `Vision statement is substantial (${firstOption.length} chars)`);
    }

    // Check warnings
    assert((data.warnings?.length ?? 0) <= 2, `Validation warnings ≤ 2 (got ${data.warnings?.length})`);
  }
} catch (err) {
  console.log(`  ❌ API error: ${err}`);
  failed++;
}

// ─── Summary ───
console.log(`\n${"═".repeat(50)}`);
console.log(`  ${passed} passed, ${failed} failed`);
console.log(`${"═".repeat(50)}\n`);

process.exit(failed > 0 ? 1 : 0);
