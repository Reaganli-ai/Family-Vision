import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

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

function validateReport(facts, insights, drafts) {
  const warnings = [];
  const factIds = new Set(facts.map((f) => f.id));

  for (const insight of insights) {
    if (!insight.based_on || insight.based_on.length === 0) {
      warnings.push({ rule: "insight_no_reference", detail: `Insight "${insight.id}" 没有引用任何 fact`, severity: "warn" });
    } else {
      for (const ref of insight.based_on) {
        if (!factIds.has(ref)) {
          warnings.push({ rule: "insight_invalid_reference", detail: `Insight "${insight.id}" 引用了不存在的 fact "${ref}"`, severity: "warn" });
        }
      }
    }
    const forbidden = ["一定", "必须", "肯定", "孩子一定", "你们一定", "家庭一定"];
    for (const word of forbidden) {
      if (insight.content.includes(word)) {
        warnings.push({ rule: "insight_hard_assertion", detail: `Insight "${insight.id}" 包含硬断言"${word}"`, severity: "warn" });
      }
    }
  }

  for (const draft of drafts) {
    if (!draft.options || draft.options.length < 2) {
      warnings.push({ rule: "draft_insufficient_options", detail: `Draft "${draft.id}" 只有 ${draft.options?.length || 0} 个选项`, severity: "warn" });
    }
  }

  const missingFactIds = facts.filter((f) => f.value === null).map((f) => f.id);
  for (const insight of insights) {
    for (const ref of (insight.based_on || [])) {
      if (missingFactIds.includes(ref)) {
        warnings.push({ rule: "insight_uses_missing_fact", detail: `Insight "${insight.id}" 引用了缺失的 fact "${ref}"`, severity: "warn" });
      }
    }
  }

  return warnings;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { compassData } = req.body;

  if (!compassData) {
    return res.status(400).json({ error: "compassData is required" });
  }

  try {
    const facts = assembleFacts(compassData);
    const filledFacts = facts.filter((f) => f.value !== null);
    if (filledFacts.length < 3) {
      return res.status(400).json({ error: "数据不足，至少需要完成 2 个模块才能生成报告", facts });
    }

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

    const rawText = response.content[0]?.text || "{}";
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
    const warnings = validateReport(facts, insights, drafts);

    res.json({ facts, insights, drafts, warnings, generated_at: new Date().toISOString() });
  } catch (error) {
    console.error("Report generation error:", error);
    const detail = error instanceof Error ? error.message : String(error);
    res.status(500).json({ error: "报告生成失败", detail });
  }
}
