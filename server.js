import Anthropic from "@anthropic-ai/sdk";
import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const anthropic = new Anthropic();

const SYSTEM_PROMPT = `你是"彼灯教育·家庭愿景工坊"的 AI 导师。

## 你的角色
- 温暖、专业、像有经验的朋友，不是老师或权威
- 不说教、不评判、不给教育建议
- 帮用户命名模糊的感受，跨模块连接数据

## 核心规则
1. 每次回复控制在 80 字以内，最多不超过 120 字
2. 每次只说一件事、问一个问题
3. 用 **加粗** 强调关键词
4. 不要列清单、不要分点，用自然的对话语气
5. 不要重复用户说过的话，直接推进
6. 当你说"请在卡片中选择/填写"时，不要列出卡片里的选项或问题——卡片会自动出现在你的回复下方。你只需引导用户去操作卡片即可。

## 对话流程

你会收到一个 flowContext 字段，告诉你当前在哪个模块、哪个节点。根据节点生成对应的回复：

### 模块 S（家底）
- S-01: 简短介绍"家底盘点"。一句话说明接下来要做什么（评估三大资本）。然后提示用户在下方卡片中填写。
- S-03: 接住用户的资本矩阵数据。你必须严格根据用户填写的等级(L1/L2/L3)来分析，不得编造或扭曲等级关系。分析规则：
  - 先准确复述三项资本的等级，不要遗漏或改动
  - 如果有多项同等级（如两个L2），必须指出"并列"而非随意挑一个说"最强"
  - 找出最低项，指出它与其他项的差距（如"社会资本是目前相对短板"）
  - 分析等级之间的模式（如"文化和经济都不错但社会连接少=内功强但向外连接弱"）
  - 追问一个关于"这些资本之间如何互相影响"的问题
  - 禁止说"最可依仗的是X"除非该项确实是唯一最高等级
  - 注意：不要问"优先升级哪项"，这个问题后面有专门的卡片
- S-04: 基于用户的资本矩阵和确认结果，像咨询顾问一样追问：「你们做出这样的评估，背后的考虑是什么？比如为什么觉得某项资本是这个等级？你们的判断依据是什么？」引导用户 articulate 自己的思考逻辑。语气温和但有引导力，不要用封闭式问题。
- S-06: 基于用户阐述的逻辑做顾问式点评：1) 肯定用户思考中的洞察 2) 指出可能的盲区或被低估/高估的地方 3) 点明资本之间的联动关系。然后自然过渡："现在我们来做一个关键的战略选择——接下来请在卡片中选择你们最想优先升级的资本"。不要重复列出选项，卡片会自动出现。
- S-08: 基于选择做解读（选高项→拉长板；选低项→补短板），然后说"我帮你整理了一份家底快照，看看是否准确"。

### 模块 N（眼光）
- N-01: 从家底过渡到眼光。肯定他们在上一模块的成果，引出对未来趋势的思考。说"接下来请在卡片中选出你们最关注的 Top 3 趋势"。不要列出选项，卡片会自动出现。
- N-03: 接住用户的趋势排序（主假设 + 两个对冲），简短分析他们的战略判断——为什么把这个趋势排第一？和后两个之间有什么取舍逻辑？然后自然过渡："现在来做一个关键的能力押注——请在卡片中选出你认为孩子最需要的一项核心能力"。不要列出选项。
注意：N-05（诊断三段论）和 N-07（快照）由前端模板生成，不经过 AI。

### 模块 W（根基）— 13 节点
- W-01: 过渡开场。肯定前两个模块的成果，引出"家族精神内核"——代代相传的生存哲学。说"接下来请在卡片中回忆一个关键瞬间"。不要重复卡片里的问题。
- W-03: 接住用户的故事和归因标签。你的任务是从故事中提取关键词，并从冲突轴库中选 2-3 组最相关的取舍轴。
  **你必须在回复末尾输出结构化数据，格式：**
  <!--DATA:{"axes":[{"axis_id":"轴ID","keyword":"从故事提取的关键词"},...],"story_keywords":["关键词1","关键词2"]}-->
  可用的 axis_id：integrity-vs-result, safety-vs-growth, rules-vs-relations, achievement-vs-balance, obedience-vs-expression, face-vs-authenticity
  关键词必须来自用户原话，不要编造。最少选 2 组，最多 3 组。
  回复正文简短接住故事（2-3句），然后说"我帮你把故事翻译成几个取舍点，请在下方卡片中确认"。
- W-07: 综合用户在 Q1（故事）、Q2（取舍）、Q3（英雄）、Q4（口头禅）的所有数据，提炼 3-5 个"家风内核"候选命名。
  每个候选必须包含 name（2-4字中性策略命名）、definition（一句话定义）、evidence（引用 Q1-Q4 的具体数据作为依据）。
  **你必须在回复末尾输出结构化数据，格式：**
  <!--DATA:{"candidates":[{"name":"命名","definition":"一句话定义","evidence":{"story":"Q1证据","tradeoff":"Q2证据","hero":"Q3证据","quote":"Q4证据"}},...]}>-->
  回复正文简短总结用户给的信息模式（2-3句），然后说"我提炼了几个候选，请在下方卡片中选择"。
- W-09: 确认用户选择的命名，引出 flip side。基于用户确认的 core_code，说"每种家风都有正反两面。接下来我们看看这种精神可能的副作用，请在下方卡片中填写"。简短、温暖、不说教。
注意：W-12（final statement）由前端模板生成，不经过 AI。W 模块快照也由前端模板生成。

### 模块 E（共识）
- E-01: 引导做直觉锚定，说"请在下方卡片中凭直觉填写"。不要重复卡片里的问题。
- E-03: 接住直觉回答，简短回应，说"接下来请在价值观画廊中选出你们家最看重的价值观"。不要列出选项，卡片会自动出现。
- E-05: 分析用户选择的价值观分布模式，对比直觉锚定和画廊选择的一致性/差异，追问一轮。不要问卡片已经问过的问题。
- E-08: 汇总生成快照。

### 快照生成规则（必须严格遵守）
当 nodeId 为 S-08, E-08 时，你必须在回复末尾生成快照（N、W 模块快照由前端模板生成）。格式：
<!--SNAPSHOT:快照的完整文字内容-->

这是硬性要求，不可遗漏。快照要有温度，像专业分析报告，100-150字。
如果当前 nodeId 是上述四个之一，你的回复最后一行必须是 <!--SNAPSHOT:...-->。

## 数据传递
前端会在 flowContext 中提供之前模块收集的所有数据，你要在分析时引用这些数据做跨模块连接。`;

app.post("/api/chat", async (req, res) => {
  const { messages, flowContext } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "messages is required" });
  }

  // Build system prompt with flow context
  let systemWithContext = SYSTEM_PROMPT;
  if (flowContext) {
    const snapshotNodes = ["S-08", "E-08"];
    const mustSnapshot = snapshotNodes.includes(flowContext.nodeId);
    if (mustSnapshot) {
      systemWithContext += `\n\n## 当前上下文\n${JSON.stringify(flowContext, null, 2)}\n\n## ⚠️ 重要指令\n当前节点是 ${flowContext.nodeId}，你必须在回复末尾生成快照。格式：<!--SNAPSHOT:快照内容-->。不要追问，不要提新问题。直接汇总之前所有回答，生成快照。`;
    } else {
      systemWithContext += `\n\n## 当前上下文\n${JSON.stringify(flowContext, null, 2)}\n\n注意：当前节点是 ${flowContext.nodeId}，属于模块 ${flowContext.module}。请严格按照该模块该节点的要求回复，不要混淆模块。`;
    }
  }

  const anthropicMessages = messages.map((m) => ({
    role: m.role === "ai" ? "assistant" : "user",
    content: m.content,
  }));

  try {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const stream = anthropic.messages.stream({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      system: systemWithContext,
      messages: anthropicMessages,
    });

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
      }
    }

    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    console.error("Claude API error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to get AI response" });
    } else {
      res.write(
        `data: ${JSON.stringify({ error: "Stream interrupted" })}\n\n`
      );
      res.end();
    }
  }
});

// ═══════════════════════════════════════════════════════════
//  Report Agent — POST /api/report
//  Pipeline: Facts → Reasoner (Claude) → Validator → Response
// ═══════════════════════════════════════════════════════════

const REPORT_SYSTEM_PROMPT = `你是"彼灯教育·家庭战略罗盘"的报告分析师。

## 你的任务
根据用户在四个模块中的结构化数据（facts），生成两类内容：
1. **insights**（战略推演）：基于 facts 的跨模块交叉推理，帮用户发现"战略交点"
2. **drafts**（愿景与行动）：可编辑的建议草案（用户会自行修改）

## 严格规则

### Insights 规则
- 每条 insight 必须引用具体的 fact IDs（在 based_on 字段）
- 使用"可能/倾向于/值得关注"等不确定表达
- 绝不使用"一定/必须/肯定"等断言
- 不得引入 facts 中不存在的家庭具体细节
- 前三条 insight 必须严格对应下方三个战略交点题目

### Drafts 规则
- 每个 draft 必须提供 2-3 个备选版本
- 绝不使用"你们一定适合/孩子一定会"等硬断言
- 每个选项应有不同侧重（如偏纪律/偏探索/偏连接）

## 必须生成的内容

### insights（5 条）— 战略推演：发现"战略交点"

1. **opportunity_match**（① 机遇匹配题 S×N）
   核心问题：家庭资本（S）中哪项优势，最适合用来培养未来时代需求（N）中看重的核心素养？
   输出格式：明确指出「____优势 × ____素养」的匹配关系，并解释为什么这个匹配最有杠杆效应。
   示例：你们家"多元拓展的社会资本"（S），最适合用来培养"跨文化协作能力"（N），因为...

2. **tension_resolve**（② 矛盾化解题 W×N）
   核心问题：家族精神内核（W）中需要升级的部分，与未来时代需求（N）之间，是否存在紧张或矛盾？如何创造性解决？
   输出格式：先指出矛盾点，再给出创造性的重新定义/化解方向。
   示例：家族"安全第一"的精神内核（W）与未来需要"冒险精神"的趋势（N）存在矛盾。化解方向：将"安全"重新定义为"在充分认知风险后的有准备探索"。

3. **philosophy_anchor**（③ 哲学锚定题 E×S×W）
   核心问题：价值观共识（E）中的战略方向，将如何决定利用家庭资本（S）和精神内核（W）的具体方式？
   输出格式：从价值观方向出发，说明它如何"着色"资本运用和精神传承。
   示例：既然选择"创造优先"的价值观（E），那么在使用"稳健经济资本"（S）时，就会更倾向于将其作为"创新试错的风险投资基金"，而非"保值储蓄"。

4. **strength_risk**（优势与风险）：基于以上三个交叉分析，指出当前家庭定位的最大优势和最大风险
5. **strategic_summary**（战略整合）：四模块交叉后的一句话战略定位总结

### drafts（3 个）— 愿景生成与行动

1. **vision_statement**（一句话教育战略宣言）
   必须严格按照以下模板结构生成 3 个版本（偏向不同战略方向），每个版本填入该家庭的具体数据：
   「我们，【家庭代号】家庭，将运用【家庭优势资本S】，秉承【升级后的家族精神W】，
   在充满【未来关键趋势N】的时代，坚定选择【价值观方向E】的道路，
   全力将孩子培养成一个【结合核心素养与价值基石的、鲜活的人像描述】的人。」
   三个版本的区别在于【人像描述】的侧重方向不同。

2. **action_plan_90d**（90天行动计划）：2 个版本，轻量版和强化版。每个版本 3-5 条具体行动项，每条需关联到具体的 S/N/W/E 模块。

3. **conversation_scripts**（家庭沟通脚本）：3 个场景的对话模板，帮助夫妻在日常中践行罗盘。

## 输出格式
严格按照 JSON 格式输出，不要包含任何其他文字。`;

/**
 * Step 1: Assemble facts from compass data
 */
function assembleFacts(compassData) {
  const facts = [];
  const cd = compassData || {};

  const add = (id, label, tracked, module) => {
    if (!tracked) {
      facts.push({ id, label, value: null, source: "user_typed", module });
      return;
    }
    let displayValue;
    const v = tracked.value;
    if (Array.isArray(v)) {
      displayValue = v.join("、");
    } else if (typeof v === "object" && v !== null) {
      displayValue = JSON.stringify(v);
    } else {
      displayValue = String(v ?? "");
    }
    facts.push({ id, label, value: displayValue || null, source: tracked.source, module });
  };

  // S
  if (cd.S?.capitalMatrix) {
    const rows = cd.S.capitalMatrix.value || [];
    for (const row of rows) {
      add(`S.capital_${row.label}`, `${row.label}`, { value: `${row.level}${row.keyword ? `（${row.keyword}）` : ""}`, source: cd.S.capitalMatrix.source }, "S");
    }
  } else {
    add("S.capitalMatrix", "家庭资本矩阵", null, "S");
  }
  add("S.capitalRationale", "评估逻辑", cd.S?.capitalRationale, "S");
  add("S.priorityUpgrade", "优先升级资本", cd.S?.priorityUpgrade, "S");

  // N
  add("N.trendsRanked", "趋势判断 Top 3", cd.N?.trendsRanked, "N");
  add("N.coreAbility", "能力押注", cd.N?.coreAbility, "N");
  add("N.insightExplain", "趋势洞察", cd.N?.insightExplain, "N");
  add("N.insightConnect", "家底关联", cd.N?.insightConnect, "N");
  add("N.insightGap", "现状差距", cd.N?.insightGap, "N");

  // W
  add("W.story", "情感地标故事", cd.W?.story, "W");
  add("W.storyPriorityTag", "故事归因", cd.W?.storyPriorityTag, "W");
  add("W.heroTraits", "英雄基因", cd.W?.heroTraits, "W");
  add("W.coreCode", "家风内核", cd.W?.coreCode ? {
    value: `${cd.W.coreCode.value?.name}（${cd.W.coreCode.value?.definition}）${cd.W.coreCode.value?.userEdited ? " [用户改写]" : ""}`,
    source: cd.W.coreCode.source,
  } : null, "W");
  add("W.flipsideBenefit", "家风好处", cd.W?.flipsideBenefit, "W");
  add("W.flipsideCost", "家风代价", cd.W?.flipsideCost, "W");
  add("W.finalStatement", "升级宣言", cd.W?.finalStatement, "W");

  // E
  add("E.anchors", "直觉锚点", cd.E?.anchors ? {
    value: `最希望拥有「${cd.E.anchors.value?.gift_to_child}」，最怕缺少「${cd.E.anchors.value?.fear_child_lacks}」`,
    source: cd.E.anchors.source,
  } : null, "E");
  add("E.coreValues", "核心价值观", cd.E?.coreValues, "E");
  add("E.deferredValues", "战略暂缓", cd.E?.deferredValues, "E");
  add("E.direction", "战略方向", cd.E?.direction, "E");

  return facts;
}

/**
 * Step 3: Validate the report output (warn mode)
 */
function validateReport(facts, insights, drafts) {
  const warnings = [];
  const factIds = new Set(facts.map((f) => f.id));

  // Check: insights must reference valid fact IDs
  for (const insight of insights) {
    if (!insight.based_on || insight.based_on.length === 0) {
      warnings.push({
        rule: "insight_no_reference",
        detail: `Insight "${insight.id}" 没有引用任何 fact`,
        severity: "warn",
      });
    } else {
      for (const ref of insight.based_on) {
        if (!factIds.has(ref)) {
          warnings.push({
            rule: "insight_invalid_reference",
            detail: `Insight "${insight.id}" 引用了不存在的 fact "${ref}"`,
            severity: "warn",
          });
        }
      }
    }

    // Check for forbidden assertions
    const forbidden = ["一定", "必须", "肯定", "孩子一定", "你们一定", "家庭一定"];
    for (const word of forbidden) {
      if (insight.content.includes(word)) {
        warnings.push({
          rule: "insight_hard_assertion",
          detail: `Insight "${insight.id}" 包含硬断言"${word}"`,
          severity: "warn",
        });
      }
    }
  }

  // Check: drafts must have 2+ options
  for (const draft of drafts) {
    if (!draft.options || draft.options.length < 2) {
      warnings.push({
        rule: "draft_insufficient_options",
        detail: `Draft "${draft.id}" 只有 ${draft.options?.length || 0} 个选项（需要至少 2 个）`,
        severity: "warn",
      });
    }
  }

  // Check: missing facts should not appear filled in insights
  const missingFactIds = facts.filter((f) => f.value === null).map((f) => f.id);
  for (const insight of insights) {
    for (const ref of (insight.based_on || [])) {
      if (missingFactIds.includes(ref)) {
        warnings.push({
          rule: "insight_uses_missing_fact",
          detail: `Insight "${insight.id}" 引用了缺失的 fact "${ref}"`,
          severity: "warn",
        });
      }
    }
  }

  return warnings;
}

app.post("/api/report", async (req, res) => {
  const { compassData } = req.body;

  if (!compassData) {
    return res.status(400).json({ error: "compassData is required" });
  }

  try {
    // Step 1: Assemble facts
    const facts = assembleFacts(compassData);

    // Check if we have enough data
    const filledFacts = facts.filter((f) => f.value !== null);
    if (filledFacts.length < 3) {
      return res.status(400).json({
        error: "数据不足，至少需要完成 2 个模块才能生成报告",
        facts,
      });
    }

    // Step 2: Call Claude for insights + drafts
    const factsJson = JSON.stringify(facts, null, 2);
    const userPrompt = `以下是用户在家庭愿景工坊中的结构化数据（facts）：

\`\`\`json
${factsJson}
\`\`\`

请根据这些 facts 生成 insights 和 drafts。严格按以下 JSON 格式输出：

{
  "insights": [
    {
      "id": "opportunity_match",
      "title": "机遇匹配（S×N）",
      "content": "...",
      "based_on": ["S.xxx", "N.xxx"],
      "confidence": "high|medium|low"
    },
    ...共 5 条
  ],
  "drafts": [
    {
      "id": "vision_statement",
      "title": "一句话愿景",
      "description": "整合四模块的教育战略宣言",
      "options": [
        { "label": "版本A：偏xxx", "content": "..." },
        { "label": "版本B：偏xxx", "content": "..." },
        { "label": "版本C：偏xxx", "content": "..." }
      ]
    },
    ...共 3 个
  ]
}

只输出 JSON，不要任何其他文字。`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: REPORT_SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });

    // Parse Claude's response
    const rawText = response.content[0]?.text || "{}";
    // Extract JSON from potential markdown code blocks
    const jsonMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, rawText];
    let parsed;
    try {
      parsed = JSON.parse(jsonMatch[1].trim());
    } catch {
      console.error("Failed to parse Claude report response:", rawText.slice(0, 500));
      return res.status(500).json({ error: "报告生成失败：AI 返回格式异常" });
    }

    const insights = parsed.insights || [];
    const drafts = parsed.drafts || [];

    // Step 3: Validate
    const warnings = validateReport(facts, insights, drafts);

    // Return full report
    res.json({
      facts,
      insights,
      drafts,
      warnings,
      generated_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Report generation error:", error);
    res.status(500).json({ error: "报告生成失败" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
