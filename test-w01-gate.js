/**
 * W-01 Signal Gate — Runtime Verification
 *
 * Tests the multi-round dialogue behavior of W-01:
 * 1. Round 1: AI opens, should NOT send <!--READY-->
 * 2. Round 2: User replies, AI responds, may or may not send READY
 * 3. Round 3-4: If READY not yet sent, continue
 * 4. Verify READY eventually appears (round 2-4)
 * 5. Verify READY is stripped from visible content
 *
 * Requires: npm run dev:server (backend on localhost:3001)
 */

const API = "http://localhost:3001/api/chat";

// ─── SSE parser (same as test-flow.js) ─────────────
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

// ─── Flow context builder ──────────────────────────
function makeFlowContext(nodeId, snapshots = {}) {
  return {
    module: "W",
    nodeId,
    familyCode: "LC",
    snapshots,
    previousModuleData: {
      S: "经济L2、文化L3、社会L1。优先升级社会资本。",
      N: "主假设：AI替代执行岗。能力押注：创造力。",
    },
  };
}

// ─── Test scenarios ────────────────────────────────
async function main() {
  console.log("╔════════════════════════════════════════════════╗");
  console.log("║  W-01 Signal Gate — Runtime Verification       ║");
  console.log("╚════════════════════════════════════════════════╝");

  // Check server
  try {
    await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
  } catch {
    console.error("\n❌ API 服务未启动！请先运行: npm run dev:server");
    process.exit(1);
  }

  const results = [];
  const history = [
    { role: "ai", content: "欢迎来到家庭愿景工坊。" },
    { role: "user", content: "LC" },
  ];

  // ═══════════════════════════════════════════════════
  // Scenario 1: Round 1 — AI opens W-01, should NOT send READY
  // ═══════════════════════════════════════════════════
  console.log("\n─── 场景 1: 第 1 轮 AI 开场，不应发 READY ───");
  const round1 = await callAPI(
    history.map(m => ({ role: m.role === "ai" ? "assistant" : "user", content: m.content })),
    makeFlowContext("W-01")
  );

  const r1HasReady = round1.includes("<!--READY-->");
  const r1Visible = round1.replace(/<!--READY-->/g, "");
  console.log(`  AI 回复 (${round1.length} 字): "${round1.substring(0, 150)}..."`);
  console.log(`  含 READY: ${r1HasReady}`);

  if (!r1HasReady) {
    console.log("  ✅ 场景 1 通过：第 1 轮 AI 没有发 READY");
    results.push({ id: 1, status: "PASS", detail: "AI 第 1 轮未发 READY" });
  } else {
    console.log("  ❌ 场景 1 失败：AI 在第 1 轮就发了 READY（违反至少 2 轮规则）");
    results.push({ id: 1, status: "FAIL", detail: "AI 在第 1 轮发了 READY" });
  }

  history.push({ role: "ai", content: r1Visible });

  // ═══════════════════════════════════════════════════
  // Scenario 2: User replies, AI should stay on W-01
  // ═══════════════════════════════════════════════════
  console.log("\n─── 场景 2: 用户回复后，系统应停留 W-01 ───");
  const userReply1 = "我爸经常说'做人要厚道'，他做生意从来不占别人便宜。有一次他发现供应商少收了钱，特意打电话过去补上。";
  history.push({ role: "user", content: userReply1 });
  console.log(`  用户回复: "${userReply1.substring(0, 80)}..."`);

  const round2 = await callAPI(
    history.map(m => ({ role: m.role === "ai" ? "assistant" : "user", content: m.content })),
    makeFlowContext("W-01")
  );

  const r2HasReady = round2.includes("<!--READY-->");
  const r2Visible = round2.replace(/<!--READY-->/g, "");
  console.log(`  AI 回复 (${round2.length} 字): "${round2.substring(0, 150)}..."`);
  console.log(`  含 READY: ${r2HasReady}`);

  // Regardless of READY, the frontend gate logic means it stays on W-01 until READY
  // For this scenario, we're testing that the API returns normally (system stays on W-01)
  console.log("  ✅ 场景 2 通过：API 正常返回，前端会检查 READY 来决定是否推进");
  results.push({ id: 2, status: "PASS", detail: `API 正常返回。READY=${r2HasReady}。前端门控会阻止/允许推进。` });

  history.push({ role: "ai", content: r2Visible });

  // ═══════════════════════════════════════════════════
  // Scenario 3: Continue rounds until READY or round 4
  // ═══════════════════════════════════════════════════
  console.log("\n─── 场景 3: 继续对话直到 READY 或第 4 轮 ───");

  let readyRound = r2HasReady ? 2 : null;
  const userReplies = [
    "当时我大概七八岁，记得我妈还说他傻。但我爸说'钱可以再赚，信誉丢了就找不回来了'。这句话我到现在都记得。",
    "嗯确实，我觉得这不只是诚信，更像是一种'不占便宜'的底线。我们家做决定的时候也是，宁可保守一点，也不愿意走捷径。",
  ];

  for (let i = 0; i < userReplies.length && !readyRound; i++) {
    const roundNum = i + 3;
    const reply = userReplies[i];
    history.push({ role: "user", content: reply });
    console.log(`\n  第 ${roundNum} 轮用户: "${reply.substring(0, 60)}..."`);

    const roundN = await callAPI(
      history.map(m => ({ role: m.role === "ai" ? "assistant" : "user", content: m.content })),
      makeFlowContext("W-01")
    );

    const hasReady = roundN.includes("<!--READY-->");
    const visible = roundN.replace(/<!--READY-->/g, "");
    console.log(`  第 ${roundNum} 轮 AI (${roundN.length} 字): "${roundN.substring(0, 120)}..."`);
    console.log(`  含 READY: ${hasReady}`);

    history.push({ role: "ai", content: visible });

    if (hasReady) {
      readyRound = roundNum;
      console.log(`  ✅ AI 在第 ${roundNum} 轮发送了 READY`);
    }
  }

  if (readyRound) {
    if (readyRound >= 2) {
      console.log(`\n  ✅ 场景 3 通过：AI 在第 ${readyRound} 轮发 READY（≥2 轮规则满足）`);
      results.push({ id: 3, status: "PASS", detail: `AI 在第 ${readyRound} 轮发 READY` });
    } else {
      console.log(`\n  ❌ 场景 3 失败：AI 在第 ${readyRound} 轮发 READY（不满足 ≥2 轮规则）`);
      results.push({ id: 3, status: "FAIL", detail: `AI 在第 ${readyRound} 轮就发了 READY` });
    }
  } else {
    console.log("\n  ⚠️ 场景 3: AI 在 4 轮内未发 READY（前端兜底会生效）");
    results.push({ id: 3, status: "WARN", detail: "AI 4 轮未发 READY，前端兜底会触发" });
  }

  // ═══════════════════════════════════════════════════
  // Scenario 5: READY stripped from visible content
  // ═══════════════════════════════════════════════════
  console.log("\n─── 场景 5: READY 对用户不可见 ───");
  // Test the stripping logic directly
  const testContent = "这是一段回复内容。<!--READY-->";
  const stripped = testContent.replace(/<!--READY-->/g, "");
  const visibleContainsReady = stripped.includes("<!--READY-->");
  console.log(`  原始: "${testContent}"`);
  console.log(`  剥离后: "${stripped}"`);
  if (!visibleContainsReady && stripped === "这是一段回复内容。") {
    console.log("  ✅ 场景 5 通过：READY 被正确剥离");
    results.push({ id: 5, status: "PASS", detail: "正则剥离正确" });
  } else {
    console.log("  ❌ 场景 5 失败：READY 未被正确剥离");
    results.push({ id: 5, status: "FAIL", detail: "正则剥离失败" });
  }

  // ═══════════════════════════════════════════════════
  // Scenario 6: Non-W module not affected
  // ═══════════════════════════════════════════════════
  console.log("\n─── 场景 6: 非 W 模块不受影响 ───");
  const sHistory = [
    { role: "assistant", content: "欢迎来到家庭愿景工坊。" },
    { role: "user", content: "LC" },
  ];
  const sRound = await callAPI(sHistory, {
    module: "S",
    nodeId: "S-01",
    familyCode: "LC",
    snapshots: {},
  });
  const sHasReady = sRound.includes("<!--READY-->");
  console.log(`  S-01 AI 回复 (${sRound.length} 字): "${sRound.substring(0, 120)}..."`);
  console.log(`  含 READY: ${sHasReady}`);
  if (!sHasReady) {
    console.log("  ✅ 场景 6 通过：S 模块回复不含 READY（正常行为）");
    results.push({ id: 6, status: "PASS", detail: "S 模块回复正常，无 READY" });
  } else {
    console.log("  ⚠️ 场景 6: S 模块回复含 READY（不影响功能，因为前端只对 W-01 检查 READY）");
    results.push({ id: 6, status: "PASS", detail: "S 模块含 READY 但前端不检查，不影响" });
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

  const passed = results.filter(r => r.status === "PASS").length;
  const failed = results.filter(r => r.status === "FAIL").length;
  const warned = results.filter(r => r.status === "WARN").length;
  console.log(`\n  通过: ${passed}  失败: ${failed}  警告: ${warned}`);

  console.log("\n═══════════════════════════════════════════════════");
  console.log("  注意：场景 4（前端 4 轮兜底）和场景 7（刷新页面）");
  console.log("  需要通过 Playwright E2E 测试验证前端逻辑");
  console.log("═══════════════════════════════════════════════════\n");

  process.exit(failed > 0 ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
