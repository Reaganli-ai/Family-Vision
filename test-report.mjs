/**
 * Report AI output quality verification script.
 * Runs 4 calls: Sample A ×2 (single-person, stability test), B ×1 (dual-person), C ×1 (sparse/old data).
 */

const API = "http://localhost:3001/api/report";

// ─── Helper ───────────────────────────────────────────
const f = (value, source = "user_selected") => ({ value, source });

// ─── Sample A: Single-person, full data ───────────────
const SAMPLE_A = {
  familyCode: f("TestFamily-A", "user_typed"),
  S: {
    capitalMatrix: f([
      { label: "经济资本", level: "中等", keyword: "有房无贷" },
      { label: "文化资本", level: "偏高", keyword: "双硕士" },
      { label: "社会资本", level: "偏低", keyword: "城市新移民" },
    ]),
    capitalSummaryAgreed: f(true),
    priorityUpgrade: f("社会资本"),
  },
  N: {
    trendsRanked: f(["AI 替代重复劳动", "全球化逆流", "老龄化社会"]),
    coreAbility: f("跨文化沟通"),
    insightExplain: f("AI 正在大规模替代标准化工作，未来需要人无法被替代的能力"),
    insightConnect: f("家庭文化资本偏高，但社会资本不足，需要补足人脉网络"),
    insightGap: f("当前孩子缺乏跨文化实践经验"),
  },
  W: {
    story: f("爷爷从农村到城市白手起家开了第一家五金店，靠诚信积累了第一批客户", "user_typed"),
    heroTraits: f(["白手起家", "守信重诺"]),
    tradeoffChoices: f([
      { axisId: "axis1", labelA: "稳定", labelB: "冒险", choice: "A" },
      { axisId: "axis2", labelA: "自律", labelB: "自由", choice: "B" },
      { axisId: "axis3", labelA: "独立", labelB: "合作", choice: "A" },
    ]),
    quoteChildhood: f("做人要讲信用", "user_typed"),
    quoteNow: f("诚信是金", "user_typed"),
    quoteThemeTag: f("诚信"),
    coreCode: f({ name: "诚信立世", definition: "以信用为本，靠口碑生存", userEdited: true }, "user_typed"),
    flipsideTags: f(["过度谨慎", "不敢冒险"]),
    flipsideExample: f("孩子想参加创业比赛，但我们担心影响学业", "user_typed"),
    flipsideBenefit: f("踏实可靠", "user_typed"),
    flipsideCost: f("错过新机会", "user_typed"),
    upgradeKeep: f("诚信内核", "user_typed"),
    upgradeReduce: f("过度保守", "user_typed"),
    upgradeFrom: f("守成求稳", "user_typed"),
    upgradeTo: f("诚信创新", "user_typed"),
  },
  E: {
    anchors: f({ gift_to_child: "独立思考能力", fear_child_lacks: "抗挫折能力" }, "user_typed"),
    selfCore: f(["独立", "坚韧", "好奇心"]),
    selfDeferred: f(["服从", "安稳"]),
    partnerSkipped: f(true),  // Single-person mode
    coreValues: f(["独立", "坚韧", "好奇心"]),
    deferredValues: f(["服从", "安稳"]),
    direction: f("创造"),
    directionReason: f("我们相信未来属于能创造新价值的人，而不是重复旧模式的人", "user_typed"),
  },
};

// ─── Sample B: Dual-person, full data ─────────────────
const SAMPLE_B = {
  ...SAMPLE_A,
  familyCode: f("TestFamily-B", "user_typed"),
  E: {
    anchors: f({ gift_to_child: "独立思考能力", fear_child_lacks: "抗挫折能力" }, "user_typed"),
    selfCore: f(["独立", "坚韧", "好奇心"]),
    selfDeferred: f(["服从", "安稳"]),
    partnerCore: f(["创造力", "善良", "坚韧"]),
    partnerDeferred: f(["独立", "竞争"]),
    partnerSkipped: f(false),  // Dual-person mode
    coreValues: f(["坚韧", "独立", "创造力"]),  // Consensus
    deferredValues: f(["服从", "竞争"]),
    direction: f("内核"),
    directionReason: f("我们觉得孩子的内在品格比外在成就更重要", "user_typed"),
  },
};

// ─── Sample C: Sparse/old data (only S + N) ───────────
const SAMPLE_C = {
  familyCode: f("TestFamily-C", "user_typed"),
  S: {
    capitalMatrix: f([
      { label: "经济资本", level: "偏高", keyword: "企业主" },
      { label: "文化资本", level: "中等", keyword: "" },
      { label: "社会资本", level: "中等", keyword: "本地人脉广" },
    ]),
    priorityUpgrade: f("文化资本"),
  },
  N: {
    trendsRanked: f(["数字化转型", "创意经济崛起"]),
    coreAbility: f("数字素养"),
  },
};

// ─── Run tests ────────────────────────────────────────

async function callReport(label, compassData) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`▶ ${label}`);
  console.log("=".repeat(60));

  const start = Date.now();
  try {
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ compassData }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.log(`❌ HTTP ${res.status}: ${JSON.stringify(err)}`);
      return null;
    }

    const data = await res.json();
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.log(`✅ Success (${elapsed}s)`);

    // Print draft IDs
    console.log(`\n📋 Draft IDs: ${data.drafts.map(d => d.id).join(", ")}`);
    console.log(`📋 Draft option counts: ${data.drafts.map(d => `${d.id}(${d.options?.length || 0})`).join(", ")}`);

    // Print insight IDs and based_on
    console.log(`\n🔍 Insights:`);
    for (const ins of data.insights) {
      console.log(`  - ${ins.id} [${ins.confidence}] based_on: [${ins.based_on.join(", ")}]`);
      console.log(`    "${ins.content.slice(0, 120)}${ins.content.length > 120 ? "..." : ""}"`);
    }

    // Print warnings
    if (data.warnings.length > 0) {
      console.log(`\n⚠️ Warnings (${data.warnings.length}):`);
      for (const w of data.warnings) {
        console.log(`  - [${w.severity}] ${w.rule}: ${w.detail}`);
      }
    } else {
      console.log(`\n✅ No warnings`);
    }

    // Check for dual-person / single-person language issues
    const allText = [
      ...data.insights.map(i => i.content),
      ...data.drafts.flatMap(d => d.options?.map(o => o.content) || []),
    ].join(" ");

    const dualWords = ["伴侣", "双方", "你们的共识", "两人", "协商"];
    const foundDualWords = dualWords.filter(w => allText.includes(w));
    if (foundDualWords.length > 0) {
      console.log(`\n👥 Dual-person language found: ${foundDualWords.join(", ")}`);
    } else {
      console.log(`\n👤 No dual-person language detected`);
    }

    // Check which W/E new fact IDs appear in based_on
    const newFactIds = [
      "W.tradeoffChoices", "W.flipsideTags", "W.upgradeKeep", "W.upgradeReduce",
      "W.upgradeFrom", "W.upgradeTo", "E.directionReason",
      "E.selfCore", "E.partnerCore", "E.selfDeferred", "E.partnerDeferred",
    ];
    const allBasedOn = data.insights.flatMap(i => i.based_on);
    const referencedNewFacts = newFactIds.filter(id => allBasedOn.includes(id));
    const unreferencedNewFacts = newFactIds.filter(id => !allBasedOn.includes(id));
    console.log(`\n📊 New fact IDs referenced in based_on: ${referencedNewFacts.join(", ") || "(none)"}`);
    console.log(`📊 New fact IDs NOT referenced: ${unreferencedNewFacts.join(", ") || "(none)"}`);

    return data;
  } catch (err) {
    console.log(`❌ Error: ${err.message}`);
    return null;
  }
}

async function main() {
  console.log("Report AI Output Quality Verification");
  console.log(`Time: ${new Date().toISOString()}`);
  console.log(`API: ${API}`);

  const resultA1 = await callReport("Sample A (single-person, full) — Run 1", SAMPLE_A);
  const resultA2 = await callReport("Sample A (single-person, full) — Run 2", SAMPLE_A);
  const resultB = await callReport("Sample B (dual-person, full)", SAMPLE_B);
  const resultC = await callReport("Sample C (sparse/old data)", SAMPLE_C);

  // ─── Draft ID stability check ──────────────────────
  console.log(`\n${"=".repeat(60)}`);
  console.log("📌 DRAFT ID STABILITY CHECK (A1 vs A2)");
  console.log("=".repeat(60));

  if (resultA1 && resultA2) {
    const ids1 = resultA1.drafts.map(d => d.id).sort();
    const ids2 = resultA2.drafts.map(d => d.id).sort();
    const match = JSON.stringify(ids1) === JSON.stringify(ids2);
    console.log(`  A1 draft IDs: ${ids1.join(", ")}`);
    console.log(`  A2 draft IDs: ${ids2.join(", ")}`);
    console.log(`  ${match ? "✅ STABLE — IDs match" : "❌ UNSTABLE — IDs differ"}`);
  } else {
    console.log("  ⚠️ Cannot compare — one or both runs failed");
  }

  // ─── Summary ───────────────────────────────────────
  console.log(`\n${"=".repeat(60)}`);
  console.log("📋 VERIFICATION SUMMARY");
  console.log("=".repeat(60));
}

main().catch(console.error);
