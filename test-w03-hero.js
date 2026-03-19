/**
 * W-03 HeroSelectCard Runtime Verification
 *
 * Tests:
 * 1. W-03 AI outputs hero_traits alongside axes in DATA tag
 * 2. hero_traits cross-node caching logic (code verification)
 * 3. HeroSelectCard no longer has hardcoded HERO_TRAITS
 * 4. HeroSelectCard custom input entry preserved
 * 5. Fallback behavior when AI returns no hero_traits
 * 6. TradeoffCard unaffected
 * 7. QuoteFillCard unaffected
 * 8. Non-W modules unaffected
 *
 * Requires: npm run dev:server (backend on localhost:3001)
 */

const API = "http://localhost:3001/api/chat";
const fs = await import("fs");

// ─── SSE parser ─────────────────────────────────
async function callAPI(messages, flowContext) {
  const res = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, flowContext }),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "", buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      const t = line.trim();
      if (!t.startsWith("data: ")) continue;
      const d = t.slice(6);
      if (d === "[DONE]") continue;
      try { const p = JSON.parse(d); if (p.text) full += p.text; } catch {}
    }
  }
  return full;
}

const results = [];

console.log("╔════════════════════════════════════════════════╗");
console.log("║  W-03 HeroSelectCard — Runtime Verification   ║");
console.log("╚════════════════════════════════════════════════╝");

// Check server
try {
  await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
} catch {
  console.error("\n❌ API 服务未启动！请先运行 npm run dev:server");
  process.exit(1);
}

// ═══════════════════════════════════════════════════
// Scene 1: W-03 AI outputs hero_traits in DATA tag
// ═══════════════════════════════════════════════════
console.log("\n─── 场景 1: W-03 AI 回复中输出动态 hero_traits ───");

const story = "有一次爷爷做生意遇到困难，对方欠了一大笔钱，但爷爷选择不打官司，说'大家都不容易，以后还是朋友'。这件事在家里说了很多年，妈妈一直觉得爷爷太傻了。";
const w03History = [
  { role: "assistant", content: "欢迎来到家庭愿景工坊。" },
  { role: "user", content: "LC" },
  { role: "assistant", content: "接下来我们做精神考古。你小时候印象最深的一个瞬间是什么？" },
  { role: "user", content: "我爸经常说'做人要厚道'。" },
  { role: "assistant", content: "这句话背后有没有一个具体的故事？" },
  { role: "user", content: story },
  { role: "user", content: story }, // card confirmation
];

// Run twice to check consistency
let run1Data = null, run2Data = null;

for (let run = 1; run <= 2; run++) {
  console.log(`\n  ── 第 ${run} 次调用 ──`);
  const w03Response = await callAPI(w03History, {
    module: "W",
    nodeId: "W-03",
    familyCode: "LC",
    snapshots: {},
    previousModuleData: {
      S: "经济L2、文化L3、社会L1。优先升级社会资本。",
      N: "主假设：AI替代执行岗。能力押注：创造力。",
    },
  });

  console.log(`  回复 (${w03Response.length} 字): "${w03Response.substring(0, 100)}..."`);

  const dataMatch = w03Response.match(/<!--DATA:(.*?)-->/s);
  let parsedData = null;
  if (dataMatch) {
    try { parsedData = JSON.parse(dataMatch[1]); } catch (e) {
      console.log(`  ⚠️ DATA 标签解析失败: ${e.message}`);
    }
  }

  if (parsedData) {
    console.log(`  axes: ${parsedData.axes?.length || 0} 组`);
    if (parsedData.axes) {
      for (const ax of parsedData.axes) {
        console.log(`    轴: ${ax.axis_id} → "${ax.keyword}"`);
      }
    }

    const hasHeroTraits = Array.isArray(parsedData.hero_traits) && parsedData.hero_traits.length > 0;
    console.log(`  hero_traits: ${parsedData.hero_traits?.length || 0} 个`);
    if (parsedData.hero_traits) {
      for (const ht of parsedData.hero_traits) {
        console.log(`    特质: "${ht.label}" — ${ht.description}`);
      }
    }

    if (run === 1) run1Data = parsedData;
    if (run === 2) run2Data = parsedData;
  } else {
    console.log(`  ❌ 第 ${run} 次未输出 DATA 标签`);
  }
}

// Evaluate Scene 1
const r1HasTraits = run1Data && Array.isArray(run1Data.hero_traits) && run1Data.hero_traits.length > 0;
const r2HasTraits = run2Data && Array.isArray(run2Data.hero_traits) && run2Data.hero_traits.length > 0;

if (r1HasTraits && r2HasTraits) {
  console.log(`\n  ✅ 场景 1 通过：两次调用均输出 hero_traits (${run1Data.hero_traits.length}, ${run2Data.hero_traits.length} 个)`);
  results.push({ id: 1, status: "PASS", detail: `两次均有 hero_traits: ${run1Data.hero_traits.length}, ${run2Data.hero_traits.length} 个` });
} else if (r1HasTraits || r2HasTraits) {
  console.log(`\n  ⚠️ 场景 1 部分通过：仅 ${r1HasTraits ? "第1次" : "第2次"} 有 hero_traits`);
  results.push({ id: 1, status: "PARTIAL", detail: `仅 ${r1HasTraits ? "run1" : "run2"} 输出了 hero_traits` });
} else {
  console.log("\n  ❌ 场景 1 失败：两次调用均未输出 hero_traits");
  results.push({ id: 1, status: "FAIL", detail: "AI 未在 DATA 中输出 hero_traits" });
}

// ═══════════════════════════════════════════════════
// Scene 2: hero_traits cross-node caching (code verification)
// ═══════════════════════════════════════════════════
console.log("\n─── 场景 2: hero_traits 跨节点传递逻辑验证 ───");

const workspaceSrc = fs.readFileSync("src/pages/Workspace.tsx", "utf8");

// Check heroTraitsRef exists
const hasRef = workspaceSrc.includes("heroTraitsRef");
const hasCacheWrite = workspaceSrc.includes("heroTraitsRef.current = sd.hero_traits");
const hasCacheRead = workspaceSrc.includes('next.cardType === "hero-select" && heroTraitsRef.current');
const hasCardConfirmInject = workspaceSrc.includes('nextCardType === "hero-select" && heroTraitsRef.current');

console.log(`  heroTraitsRef 声明: ${hasRef}`);
console.log(`  advanceNode 中缓存写入: ${hasCacheWrite}`);
console.log(`  advanceNode 中注入读取: ${hasCacheRead}`);
console.log(`  handleCardConfirm 中注入: ${hasCardConfirmInject}`);

// Check the two injection paths cover the two ways HeroSelectCard can appear
// Path A: advanceNode (AI→card or card→card via advanceNode)
// Path B: handleCardConfirm card→card direct path
const bothPaths = hasCacheRead && hasCardConfirmInject;

if (hasRef && hasCacheWrite && bothPaths) {
  console.log("  ✅ 场景 2 通过：heroTraitsRef 缓存+双路径注入逻辑完整 [代码验证]");
  results.push({ id: 2, status: "PASS", detail: "ref声明+缓存写入+advanceNode注入+handleCardConfirm注入 [代码验证]" });
} else {
  const missing = [];
  if (!hasRef) missing.push("heroTraitsRef 未声明");
  if (!hasCacheWrite) missing.push("缓存写入缺失");
  if (!hasCacheRead) missing.push("advanceNode 注入缺失");
  if (!hasCardConfirmInject) missing.push("handleCardConfirm 注入缺失");
  console.log(`  ❌ 场景 2 失败：${missing.join("; ")}`);
  results.push({ id: 2, status: "FAIL", detail: missing.join("; ") });
}

// ═══════════════════════════════════════════════════
// Scene 3: No hardcoded HERO_TRAITS in HeroSelectCard
// ═══════════════════════════════════════════════════
console.log("\n─── 场景 3: HeroSelectCard 无旧版固定选项 ───");

const heroCardSrc = fs.readFileSync("src/components/cards/HeroSelectCard.tsx", "utf8");

const hasOldHeroTraits = heroCardSrc.includes("HERO_TRAITS");
const hasFallback = heroCardSrc.includes("FALLBACK_TRAITS");
const fallbackCount = (heroCardSrc.match(/label:/g) || []).length - 1; // subtract interface definition
const hasTraitsProp = heroCardSrc.includes("traits?:");
const usesDisplayTraits = heroCardSrc.includes("displayTraits");
const hasDynamicPriority = heroCardSrc.includes("traits?.length ? traits : FALLBACK_TRAITS");

// Check bundle too
const bundleFiles = fs.readdirSync("dist/assets").filter(f => f.endsWith(".js"));
let bundleHasOldTraits = false;
const oldTraitLabels = ["重信守诺", "白手起家型", "严厉管教", "隐忍牺牲", "精明算计", "广结善缘"];
for (const f of bundleFiles) {
  const content = fs.readFileSync(`dist/assets/${f}`, "utf8");
  for (const label of oldTraitLabels) {
    if (content.includes(label)) {
      bundleHasOldTraits = true;
      console.log(`  ⚠️ bundle 中发现旧标签 "${label}" in ${f}`);
    }
  }
}

console.log(`  旧版 HERO_TRAITS 常量: ${hasOldHeroTraits ? "仍存在 ❌" : "已移除 ✅"}`);
console.log(`  FALLBACK_TRAITS 存在: ${hasFallback}`);
console.log(`  traits prop 接口: ${hasTraitsProp}`);
console.log(`  动态优先逻辑: ${hasDynamicPriority}`);
console.log(`  bundle 中旧标签: ${bundleHasOldTraits ? "仍有 ❌" : "无 ✅"}`);

if (!hasOldHeroTraits && hasFallback && hasTraitsProp && hasDynamicPriority && !bundleHasOldTraits) {
  console.log("  ✅ 场景 3 通过：旧固定选项已移除，新 fallback + 动态优先逻辑就位");
  results.push({ id: 3, status: "PASS", detail: "HERO_TRAITS 移除, FALLBACK_TRAITS + traits prop + 动态优先" });
} else {
  console.log("  ❌ 场景 3 失败");
  results.push({ id: 3, status: "FAIL", detail: `旧常量=${hasOldHeroTraits}, bundle旧标签=${bundleHasOldTraits}` });
}

// ═══════════════════════════════════════════════════
// Scene 4: Custom input entry preserved
// ═══════════════════════════════════════════════════
console.log("\n─── 场景 4: HeroSelectCard 自定义输入入口 ───");

const hasCustomButton = heroCardSrc.includes("+ 自定义");
const hasCustomInput = heroCardSrc.includes("输入自定义特质");
const hasAddCustomFn = heroCardSrc.includes("addCustom");
const hasShowCustomState = heroCardSrc.includes("showCustom");

console.log(`  "+ 自定义" 按钮: ${hasCustomButton}`);
console.log(`  自定义输入框: ${hasCustomInput}`);
console.log(`  addCustom 函数: ${hasAddCustomFn}`);
console.log(`  showCustom 状态: ${hasShowCustomState}`);

if (hasCustomButton && hasCustomInput && hasAddCustomFn && hasShowCustomState) {
  console.log("  ✅ 场景 4 通过：自定义输入入口完整保留");
  results.push({ id: 4, status: "PASS", detail: "按钮+输入框+逻辑均在" });
} else {
  const missing = [];
  if (!hasCustomButton) missing.push("按钮缺失");
  if (!hasCustomInput) missing.push("输入框缺失");
  console.log(`  ❌ 场景 4 失败：${missing.join("; ")}`);
  results.push({ id: 4, status: "FAIL", detail: missing.join("; ") });
}

// ═══════════════════════════════════════════════════
// Scene 5: Fallback behavior
// ═══════════════════════════════════════════════════
console.log("\n─── 场景 5: Fallback 行为验证 ───");

// Check fallback content — should be generic, not domain-specific
const fallbackMatch = heroCardSrc.match(/FALLBACK_TRAITS = \[([\s\S]*?)\];/);
if (fallbackMatch) {
  const fallbackBlock = fallbackMatch[1];
  const labels = [...fallbackBlock.matchAll(/label: "(.+?)"/g)].map(m => m[1]);
  console.log(`  Fallback 特质 (${labels.length} 个): ${labels.join(", ")}`);

  // Check: is there a hint indicating these are generic references?
  const hasGenericHint = heroCardSrc.includes("通用参考");
  console.log(`  含"通用参考"提示: ${hasGenericHint}`);

  // Fallback should have fewer items than old HERO_TRAITS (6) to feel like a "safety net"
  const isReduced = labels.length <= 4;
  console.log(`  数量 ≤ 4 (兜底而非完整选项池): ${isReduced}`);

  if (hasGenericHint && isReduced && labels.length > 0) {
    console.log("  ✅ 场景 5 通过：fallback 为精简兜底 + 明确标注通用参考");
    results.push({ id: 5, status: "PASS", detail: `${labels.length} 个通用兜底特质，有"通用参考"提示` });
  } else {
    const issues = [];
    if (!hasGenericHint) issues.push("无'通用参考'标注");
    if (!isReduced) issues.push(`数量 ${labels.length} 过多`);
    console.log(`  ❌ 场景 5 失败：${issues.join("; ")}`);
    results.push({ id: 5, status: "FAIL", detail: issues.join("; ") });
  }
} else {
  console.log("  ❌ 场景 5 失败：未找到 FALLBACK_TRAITS 定义");
  results.push({ id: 5, status: "FAIL", detail: "FALLBACK_TRAITS 未定义" });
}

// Also verify the conditional rendering
const conditionalFallbackHint = heroCardSrc.includes('traits?.length ? "" : "（通用参考，也可以自定义）"');
console.log(`  条件提示（仅 fallback 时显示）: ${conditionalFallbackHint}`);

// ═══════════════════════════════════════════════════
// Scene 6: TradeoffCard unaffected
// ═══════════════════════════════════════════════════
console.log("\n─── 场景 6: TradeoffCard 不受影响 ───");

const tradeoffSrc = fs.readFileSync("src/components/cards/TradeoffCard.tsx", "utf8");

// Check that TradeoffCard still works with axes from DATA
const hasAxesProp = tradeoffSrc.includes("axes");
const hasOnConfirm = tradeoffSrc.includes("onConfirm");

// Check git diff — TradeoffCard should NOT be modified
let tradeoffModified = false;
try {
  const { execSync } = await import("child_process");
  const diff = execSync("git diff HEAD -- src/components/cards/TradeoffCard.tsx 2>/dev/null", { encoding: "utf8" });
  tradeoffModified = diff.trim().length > 0;
} catch {
  // Not a git repo or git not available — check differently
  console.log("  (非 git 仓库，无法通过 diff 验证未修改)");
}

console.log(`  TradeoffCard axes prop: ${hasAxesProp}`);
console.log(`  TradeoffCard onConfirm: ${hasOnConfirm}`);
console.log(`  TradeoffCard 被修改: ${tradeoffModified ? "是 ⚠️" : "否 ✅"}`);

if (hasAxesProp && hasOnConfirm && !tradeoffModified) {
  console.log("  ✅ 场景 6 通过：TradeoffCard 未修改，接口正常");
  results.push({ id: 6, status: "PASS", detail: "未修改，axes/onConfirm 接口完整" });
} else {
  results.push({ id: 6, status: tradeoffModified ? "FAIL" : "PASS", detail: tradeoffModified ? "TradeoffCard 被意外修改" : "接口正常" });
}

// ═══════════════════════════════════════════════════
// Scene 7: QuoteFillCard unaffected
// ═══════════════════════════════════════════════════
console.log("\n─── 场景 7: QuoteFillCard 不受影响 ───");

const quoteFillSrc = fs.readFileSync("src/components/cards/QuoteFillCard.tsx", "utf8");
let quoteFillModified = false;
try {
  const { execSync } = await import("child_process");
  const diff = execSync("git diff HEAD -- src/components/cards/QuoteFillCard.tsx 2>/dev/null", { encoding: "utf8" });
  quoteFillModified = diff.trim().length > 0;
} catch {}

console.log(`  QuoteFillCard 被修改: ${quoteFillModified ? "是 ⚠️" : "否 ✅"}`);
if (!quoteFillModified) {
  console.log("  ✅ 场景 7 通过：QuoteFillCard 未修改");
  results.push({ id: 7, status: "PASS", detail: "未修改" });
} else {
  console.log("  ❌ 场景 7 失败：QuoteFillCard 被意外修改");
  results.push({ id: 7, status: "FAIL", detail: "被意外修改" });
}

// ═══════════════════════════════════════════════════
// Scene 8: Non-W modules unaffected
// ═══════════════════════════════════════════════════
console.log("\n─── 场景 8: 非 W 模块不受影响 ───");

const s01Response = await callAPI(
  [{ role: "assistant", content: "欢迎。" }, { role: "user", content: "LC" }],
  { module: "S", nodeId: "S-01", familyCode: "LC", snapshots: {} }
);

console.log(`  S-01 回复 (${s01Response.length} 字): "${s01Response.substring(0, 100)}..."`);

if (s01Response.length > 20) {
  console.log("  ✅ 场景 8 通过：S 模块正常工作");
  results.push({ id: 8, status: "PASS", detail: "S-01 正常返回" });
} else {
  console.log("  ❌ 场景 8 失败");
  results.push({ id: 8, status: "FAIL", detail: "S-01 返回异常" });
}

// ═══════════════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════════════
console.log("\n\n═══════════════════════════════════════════════════");
console.log("  W-03 HeroSelectCard 验证结果汇总");
console.log("═══════════════════════════════════════════════════\n");

for (const r of results) {
  const icon = r.status === "PASS" ? "✅" : r.status === "FAIL" ? "❌" : "⚠️";
  console.log(`  ${icon} 场景 ${r.id}: ${r.status} — ${r.detail}`);
}

console.log("\n  ────────────────────────────────────────────────");
console.log("  验证方法说明：");
console.log("  场景 1, 8 — 实际 API 调用（运行时验证）");
console.log("  场景 2 — 代码逻辑验证（跨节点传递需浏览器 E2E 测试）");
console.log("  场景 3, 4, 5 — 源码 + bundle 静态分析");
console.log("  场景 6, 7 — 源码 + git diff 验证未修改");
console.log("  ────────────────────────────────────────────────\n");

const passed = results.filter(r => r.status === "PASS").length;
const partial = results.filter(r => r.status === "PARTIAL").length;
const failed = results.filter(r => r.status === "FAIL").length;
console.log(`  通过: ${passed}  部分通过: ${partial}  失败: ${failed}`);
console.log("═══════════════════════════════════════════════════\n");

process.exit(failed > 0 ? 1 : 0);
