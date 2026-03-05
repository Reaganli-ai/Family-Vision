/**
 * End-to-end flow test
 * Simulates the entire PRD conversation flow with pre-defined user responses.
 *
 * Usage:
 *   node --env-file=.env test-flow.js          # full test
 *   node --env-file=.env test-flow.js --module S   # test only module S
 *
 * Requires the API server running on localhost:3001
 */

const API = "http://localhost:3001/api/chat";

// ─── Test data ───────────────────────────────────────────

const FAMILY_CODE = "LC";

const MODULE_SCRIPTS = {
  S: {
    name: "家底",
    steps: [
      // S-01: AI opens → S-02: capital-matrix card
      { nodeId: "S-01", expectAI: true, desc: "AI 开场引导" },
      { nodeId: "S-02", userInput: "经济资本：L2 (稳健理财、有房贷)；文化资本：L3 (双硕士、爱阅读、常讨论)；社会资本：L1 (亲友圈为主、社交较窄)", desc: "用户填写资本矩阵" },
      // S-03: capital-summary card (deterministic, no AI)
      { nodeId: "S-03", userInput: "符合，继续", desc: "用户确认资本总结" },
      // S-04: opt-in card
      { nodeId: "S-04", userInput: "跳过深挖，直接继续", desc: "用户跳过深挖" },
      // S-05: deep-dive (skipped if user declined)
      // S-06: priority-select card
      { nodeId: "S-06", userInput: "我选择优先升级：社会资本", desc: "用户选择优先升级" },
      // S-07: AI generates snapshot
      { nodeId: "S-07", expectAI: true, expectSnapshot: true, desc: "AI 生成家底快照" },
      // S-08: User confirms snapshot
      { nodeId: "S-08", userInput: "确认，内容准确。", desc: "用户确认快照" },
    ],
  },
  N: {
    name: "眼光",
    steps: [
      { nodeId: "N-01", expectAI: true, desc: "AI 开场引导" },
      { nodeId: "N-02", userInput: "我选择：AI替代执行岗", desc: "用户选择核心趋势" },
      { nodeId: "N-03", expectAI: true, desc: "AI 分析趋势" },
      { nodeId: "N-04", userInput: "我选择：创造力", desc: "用户选择核心素养" },
      { nodeId: "N-05", expectAI: true, desc: "AI 交叉分析+追问" },
      { nodeId: "N-06", userInput: "同意", desc: "用户确认分析" },
      { nodeId: "N-07", expectAI: true, expectSnapshot: true, desc: "AI 生成眼光快照" },
      { nodeId: "N-08", userInput: "确认，内容准确。", desc: "用户确认快照" },
    ],
  },
  W: {
    name: "根基",
    steps: [
      { nodeId: "W-01", expectAI: true, desc: "AI 开场引导" },
      { nodeId: "W-02", userInput: "有一次家里生意遇到困难，爷爷宁愿自己吃亏也不愿意违约。他说'答应别人的事情，砸锅卖铁也要做到'。这件事在家里说了很多年。", desc: "用户描述关键瞬间" },
      { nodeId: "W-03", expectAI: true, desc: "AI 命名精神内核+追问" },
      { nodeId: "W-04", userInput: "不同意：我觉得不只是守信，更是一种'说到做到'的执行力", desc: "用户修正精神命名" },
      { nodeId: "W-05", expectAI: true, desc: "AI 引导继承与升级" },
      { nodeId: "W-06", userInput: "核心精神：说到做到的执行力；从「答应的事砸锅卖铁也要做到」→ 到「在热爱的领域坚持到极致」", desc: "用户填写精神升级" },
      { nodeId: "W-07", expectAI: true, desc: "AI 追问可操作性" },
      { nodeId: "W-08", userInput: "如果孩子考了第三名，我们会先问他自己满不满意，有没有尽力。如果他觉得这个领域值得继续投入，我们会支持他继续深耕。", desc: "用户回复场景" },
      { nodeId: "W-09", expectAI: true, expectSnapshot: true, desc: "AI 生成根基快照" },
      { nodeId: "W-10", userInput: "确认，内容准确。", desc: "用户确认快照" },
    ],
  },
  E: {
    name: "共识",
    steps: [
      { nodeId: "E-01", expectAI: true, desc: "AI 开场引导" },
      { nodeId: "E-02", userInput: "孩子最不能缺少的品格是：独立思考；我最担忧孩子缺少：面对挫折的韧性", desc: "用户直觉锚定" },
      { nodeId: "E-03", expectAI: true, desc: "AI 接住直觉" },
      { nodeId: "E-04", userInput: "核心价值观：好奇探索、创造创新、自主驱动；战略暂缓：学业成就、社会声誉", desc: "用户选择价值观" },
      { nodeId: "E-05", expectAI: true, desc: "AI 分析模式+追问" },
      { nodeId: "E-06", userInput: "同意", desc: "用户确认分析" },
      { nodeId: "E-07", userInput: "我选择：创造 · 向外开拓、定义新事物", desc: "用户选择战略方向" },
      { nodeId: "E-08", expectAI: true, expectSnapshot: true, desc: "AI 生成共识快照" },
      { nodeId: "E-09", userInput: "确认，内容准确。", desc: "用户确认快照" },
    ],
  },
};

// ─── API call ────────────────────────────────────────────

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

  let snapshot = null;
  const m = full.match(/<!--SNAPSHOT:(.*?)-->/s);
  if (m) snapshot = m[1].trim();
  const clean = full.replace(/<!--SNAPSHOT:.*?-->/s, "").replace(/<!--SNAPSHOT:.*/s, "").trim();

  return { content: clean, snapshot };
}

// ─── Runner ──────────────────────────────────────────────

async function runModule(moduleId, script, conversationHistory, snapshots) {
  const moduleLabel = script.name;
  console.log(`\n${"═".repeat(60)}`);
  console.log(`  模块 ${moduleId}: ${moduleLabel}`);
  console.log(`${"═".repeat(60)}`);

  let passed = 0, failed = 0;

  for (const step of script.steps) {
    const tag = `[${step.nodeId}]`;

    if (step.expectAI) {
      // Request AI response
      const flowContext = {
        module: moduleId,
        nodeId: step.nodeId,
        familyCode: FAMILY_CODE,
        snapshots,
        previousModuleData: Object.fromEntries(
          Object.entries(snapshots).map(([k, v]) => [k, v.substring(0, 200)])
        ),
      };

      const { content, snapshot } = await callAPI(
        conversationHistory.map((m) => ({ role: m.role, content: m.content })),
        flowContext
      );

      conversationHistory.push({ role: "ai", content });

      // Display
      const short = content.length > 120 ? content.substring(0, 120) + "..." : content;
      console.log(`\n  ${tag} 🤖 ${step.desc}`);
      console.log(`     "${short}"`);

      // Checks
      const charCount = content.length;
      if (charCount > 200) {
        console.log(`     ⚠️  回复过长: ${charCount} 字 (应 ≤ 120)`);
        failed++;
      } else {
        console.log(`     ✅ 字数: ${charCount}`);
        passed++;
      }

      if (step.expectSnapshot) {
        if (snapshot) {
          snapshots[moduleId] = snapshot;
          console.log(`     ✅ 快照已生成 (${snapshot.length} 字)`);
          console.log(`     📸 "${snapshot.substring(0, 100)}..."`);
          passed++;
        } else {
          console.log(`     ❌ 期望生成快照但未收到`);
          failed++;
        }
      }
    }

    if (step.userInput) {
      conversationHistory.push({ role: "user", content: step.userInput });
      const short = step.userInput.length > 80 ? step.userInput.substring(0, 80) + "..." : step.userInput;
      console.log(`\n  ${tag} 👤 ${step.desc}`);
      console.log(`     "${short}"`);
      passed++;
    }
  }

  return { passed, failed };
}

async function main() {
  const args = process.argv.slice(2);
  const onlyModule = args.includes("--module") ? args[args.indexOf("--module") + 1]?.toUpperCase() : null;

  console.log("╔" + "═".repeat(58) + "╗");
  console.log("║  家庭愿景工坊 · 端到端流程测试                          ║");
  console.log("║  家庭代号: " + FAMILY_CODE.padEnd(47) + "║");
  if (onlyModule) {
    console.log("║  测试范围: 仅模块 " + onlyModule.padEnd(40) + "║");
  }
  console.log("╚" + "═".repeat(58) + "╝");

  // Check server
  try {
    await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
  } catch {
    console.error("\n❌ API 服务未启动！请先运行: npm run dev:server");
    process.exit(1);
  }

  const history = [];
  const snapshots = {};
  let totalPassed = 0, totalFailed = 0;

  // Welcome
  const welcome = "欢迎来到家庭愿景工坊。接下来我会引导你完成四个模块的思考。请先为你的家庭取一个代号。";
  history.push({ role: "ai", content: welcome });
  history.push({ role: "user", content: FAMILY_CODE });
  console.log(`\n  [开始] 👤 家庭代号: ${FAMILY_CODE}`);

  const modulesToRun = onlyModule ? [onlyModule] : ["S", "N", "W", "E"];

  for (const modId of modulesToRun) {
    const script = MODULE_SCRIPTS[modId];
    if (!script) {
      console.error(`\n❌ 未知模块: ${modId}`);
      continue;
    }
    const { passed, failed } = await runModule(modId, script, history, snapshots);
    totalPassed += passed;
    totalFailed += failed;
  }

  // ─── Final Report ──────────────────────────────────────
  console.log(`\n\n${"═".repeat(60)}`);
  console.log("  测试报告");
  console.log(`${"═".repeat(60)}`);

  console.log(`\n  ✅ 通过: ${totalPassed}`);
  console.log(`  ❌ 失败: ${totalFailed}`);
  console.log(`  📝 对话轮次: ${history.length}`);
  console.log(`  📸 快照: ${Object.keys(snapshots).length}/4`);

  if (Object.keys(snapshots).length > 0) {
    console.log(`\n${"─".repeat(60)}`);
    console.log("  生成的快照：");
    console.log(`${"─".repeat(60)}`);
    for (const [id, text] of Object.entries(snapshots)) {
      const name = MODULE_SCRIPTS[id]?.name || id;
      console.log(`\n  【${name}快照】`);
      console.log(`  ${text}\n`);
    }
  }

  console.log(`${"═".repeat(60)}`);
  process.exit(totalFailed > 0 ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
