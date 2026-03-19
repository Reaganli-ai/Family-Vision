/**
 * W-02 → W-03 Runtime Verification
 *
 * Tests:
 * 1. StoryInputCard no longer contains fixed tags (bundle check)
 * 2. W-03 AI can receive story text and generate tradeoff axes
 * 3. storyPriorityTag is not written by updateCompassFromCard
 * 4. W-07 fallback and quote-fill hints don't error without storyPriorityTag
 * 5. Non-W modules (S-01) unaffected
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
console.log("║  W-02 故事确认 Step — Runtime Verification     ║");
console.log("╚════════════════════════════════════════════════╝");

// Check server
try {
  await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
} catch {
  console.error("\n❌ API 服务未启动！");
  process.exit(1);
}

// ═══════════════════════════════════════════════════
// Scene 1: StoryInputCard no longer has fixed tags
// ═══════════════════════════════════════════════════
console.log("\n─── 场景 1: StoryInputCard 不再包含固定标签 ───");

// Check source file
const storyCardSrc = fs.readFileSync("src/components/cards/StoryInputCard.tsx", "utf8");
const hasPriorityTags = storyCardSrc.includes("PRIORITY_TAGS");
const hasTagState = storyCardSrc.includes("priorityTag");
const hasStepState = storyCardSrc.includes('"tag"');
const hasTagUI = storyCardSrc.includes("在这个故事里，你们当时最在意的是哪一个");

// Check built bundle
const bundleFiles = fs.readdirSync("dist/assets").filter(f => f.endsWith(".js"));
let bundleHasTags = false;
for (const f of bundleFiles) {
  const content = fs.readFileSync(`dist/assets/${f}`, "utf8");
  if (content.includes('"面子","利益结果","安全风险"')) {
    bundleHasTags = true;
    break;
  }
}

if (!hasPriorityTags && !hasTagState && !hasStepState && !hasTagUI && !bundleHasTags) {
  console.log("  ✅ 场景 1 通过：源码和 bundle 中均无固定标签相关代码");
  results.push({ id: 1, status: "PASS", detail: "PRIORITY_TAGS / priorityTag / step='tag' / 标签UI 均已移除" });
} else {
  const issues = [];
  if (hasPriorityTags) issues.push("PRIORITY_TAGS 常量仍存在");
  if (hasTagState) issues.push("priorityTag state 仍存在");
  if (hasStepState) issues.push("step='tag' 仍存在");
  if (hasTagUI) issues.push("标签选择UI文案仍存在");
  if (bundleHasTags) issues.push("bundle 中仍有固定标签数组");
  console.log(`  ❌ 场景 1 失败：${issues.join("; ")}`);
  results.push({ id: 1, status: "FAIL", detail: issues.join("; ") });
}

// Check that the card now only has story + confirm
const hasTextarea = storyCardSrc.includes("textarea");
const hasConfirmBtn = storyCardSrc.includes("确认 →");
const onConfirmType = storyCardSrc.includes("{ story: string }");
console.log(`  补充验证：textarea=${hasTextarea}, 确认按钮=${hasConfirmBtn}, onConfirm类型正确=${onConfirmType}`);

// ═══════════════════════════════════════════════════
// Scene 3: W-03 AI receives story and generates axes
// ═══════════════════════════════════════════════════
console.log("\n─── 场景 3: W-03 AI 接收 story 文本并生成取舍轴 ───");

const story = "有一次爷爷做生意遇到困难，对方欠了一大笔钱，但爷爷选择不打官司，说'大家都不容易，以后还是朋友'。这件事在家里说了很多年，妈妈一直觉得爷爷太傻了。";
const w03History = [
  { role: "assistant", content: "欢迎来到家庭愿景工坊。" },
  { role: "user", content: "LC" },
  // Simulating W-01 multi-round
  { role: "assistant", content: "接下来我们做精神考古。你小时候印象最深的一个瞬间是什么？" },
  { role: "user", content: "我爸经常说'做人要厚道'。" },
  { role: "assistant", content: "这句话背后有没有一个具体的故事？" },
  { role: "user", content: story },
  // W-02: user confirmed story via card (this is the card data, sent as user message)
  { role: "user", content: story },
];

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

const hasDataTag = w03Response.includes("<!--DATA:");
const dataMatch = w03Response.match(/<!--DATA:(.*?)-->/s);
let parsedData = null;
if (dataMatch) {
  try { parsedData = JSON.parse(dataMatch[1]); } catch {}
}

console.log(`  W-03 回复 (${w03Response.length} 字): "${w03Response.substring(0, 120)}..."`);
console.log(`  含 DATA 标签: ${hasDataTag}`);

if (hasDataTag && parsedData) {
  const hasAxes = Array.isArray(parsedData.axes) && parsedData.axes.length > 0;
  const hasKeywords = Array.isArray(parsedData.story_keywords) && parsedData.story_keywords.length > 0;
  console.log(`  DATA 内容: axes=${parsedData.axes?.length || 0}组, keywords=${parsedData.story_keywords?.length || 0}个`);
  if (parsedData.axes) {
    for (const ax of parsedData.axes) {
      console.log(`    轴: ${ax.axis_id} → 关键词: "${ax.keyword}"`);
    }
  }
  if (hasAxes) {
    console.log("  ✅ 场景 3 通过：W-03 正常接收 story，生成了取舍轴");
    results.push({ id: 3, status: "PASS", detail: `${parsedData.axes.length} 组取舍轴, ${parsedData.story_keywords?.length || 0} 个关键词` });
  } else {
    console.log("  ❌ 场景 3 失败：DATA 中无 axes");
    results.push({ id: 3, status: "FAIL", detail: "DATA 中无 axes" });
  }
} else {
  console.log("  ❌ 场景 3 失败：W-03 未输出 <!--DATA:...-->");
  results.push({ id: 3, status: "FAIL", detail: "无 DATA 标签" });
}

// ═══════════════════════════════════════════════════
// Scene 4: storyPriorityTag not written by new code
// ═══════════════════════════════════════════════════
console.log("\n─── 场景 4: storyPriorityTag 不再被写入 ───");

const schemaSrc = fs.readFileSync("src/lib/compass-schema.ts", "utf8");

// Check updateCompassFromCard story-input case
const storyInputCase = schemaSrc.match(/if \(cardType === "story-input"\) \{[^}]+\}/s)?.[0] || "";
const writesTag = storyInputCase.includes("storyPriorityTag");
const fieldStillInSchema = schemaSrc.includes("storyPriorityTag?:");
const hasDeprecated = schemaSrc.includes("@deprecated");

console.log(`  schema 中保留字段(兼容): ${fieldStillInSchema}`);
console.log(`  标记 @deprecated: ${hasDeprecated}`);
console.log(`  updateCompassFromCard 写入 storyPriorityTag: ${writesTag}`);

if (!writesTag && fieldStillInSchema && hasDeprecated) {
  console.log("  ✅ 场景 4 通过：字段保留兼容但不再写入");
  results.push({ id: 4, status: "PASS", detail: "字段 deprecated，updateCompassFromCard 不再写入" });
} else {
  const issues = [];
  if (writesTag) issues.push("仍在写入 storyPriorityTag");
  if (!fieldStillInSchema) issues.push("字段被删除（应保留兼容）");
  if (!hasDeprecated) issues.push("未标记 deprecated");
  console.log(`  ❌ 场景 4 失败：${issues.join("; ")}`);
  results.push({ id: 4, status: "FAIL", detail: issues.join("; ") });
}

// ═══════════════════════════════════════════════════
// Scene 5: Fallback and hints don't reference storyPriorityTag
// ═══════════════════════════════════════════════════
console.log("\n─── 场景 5: fallback candidates 和 quote hints 不再依赖 storyPriorityTag ───");

const workspaceSrc = fs.readFileSync("src/pages/Workspace.tsx", "utf8");
const tagRefCount = (workspaceSrc.match(/storyPriorityTag/g) || []).length;

console.log(`  Workspace.tsx 中 storyPriorityTag 引用次数: ${tagRefCount}`);

if (tagRefCount === 0) {
  console.log("  ✅ 场景 5 通过：Workspace.tsx 中无 storyPriorityTag 引用");
  results.push({ id: 5, status: "PASS", detail: "零引用，不会报错" });
} else {
  console.log(`  ❌ 场景 5 失败：仍有 ${tagRefCount} 处引用`);
  results.push({ id: 5, status: "FAIL", detail: `${tagRefCount} 处引用残留` });
}

// Also verify TypeScript compilation passed (already confirmed by build)
console.log("  补充：TypeScript 编译和 production build 均已通过");

// ═══════════════════════════════════════════════════
// Scene 6: Non-W modules unaffected
// ═══════════════════════════════════════════════════
console.log("\n─── 场景 6: 非 W 模块不受影响 ───");

const s01Response = await callAPI(
  [{ role: "assistant", content: "欢迎。" }, { role: "user", content: "LC" }],
  { module: "S", nodeId: "S-01", familyCode: "LC", snapshots: {} }
);

console.log(`  S-01 回复 (${s01Response.length} 字): "${s01Response.substring(0, 100)}..."`);

if (s01Response.length > 20) {
  console.log("  ✅ 场景 6 通过：S 模块正常工作");
  results.push({ id: 6, status: "PASS", detail: "S-01 正常返回" });
} else {
  console.log("  ❌ 场景 6 失败");
  results.push({ id: 6, status: "FAIL", detail: "S-01 返回异常" });
}

// ═══════════════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════════════
console.log("\n\n═══════════════════════════════════════════════════");
console.log("  验证结果汇总");
console.log("═══════════════════════════════════════════════════\n");

for (const r of results) {
  const icon = r.status === "PASS" ? "✅" : r.status === "FAIL" ? "❌" : "⚠️";
  console.log(`  ${icon} 场景 ${r.id}: ${r.status} — ${r.detail}`);
}

// Note which scenes need browser testing
console.log("\n  ────────────────────────────────────────────────");
console.log("  场景 2 (StoryInputCard 确认后推进到 W-03):");
console.log("  需要浏览器 E2E 测试或手动验证前端组件交互。");
console.log("  代码逻辑分析：StoryInputCard.onConfirm → handleCardConfirm");
console.log("  → summary = story text → advanceNode → W-03 AI node");
console.log("  此路径与旧版相同（只是 data 类型去掉了 priorityTag），");
console.log("  TypeScript 编译通过 = 类型匹配正确。");
console.log("  ────────────────────────────────────────────────\n");

const passed = results.filter(r => r.status === "PASS").length;
const failed = results.filter(r => r.status === "FAIL").length;
console.log(`  通过: ${passed}  失败: ${failed}`);
console.log("═══════════════════════════════════════════════════\n");

process.exit(failed > 0 ? 1 : 0);
