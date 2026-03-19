import Anthropic from "@anthropic-ai/sdk";
import express from "express";
import cors from "cors";
import { createClient } from "@supabase/supabase-js";

const app = express();
app.use(cors());
app.use(express.json());

function createFeedbackId() {
  return `fb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseServiceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Supabase admin env missing: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function resolveUserIdByConversationId(supabaseAdmin, conversationId) {
  if (!conversationId) return null;
  const { data, error } = await supabaseAdmin
    .from("conversations")
    .select("user_id")
    .eq("id", conversationId)
    .single();
  if (error) {
    console.warn("[feedback] resolve user_id failed:", error.message);
    return null;
  }
  return data?.user_id || null;
}

async function forwardFeedbackToWebhook(payload) {
  const webhookUrl = process.env.FEEDBACK_WEBHOOK_URL;
  if (!webhookUrl) return;
  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("[feedback] webhook forward failed:", error);
  }
}

const anthropic = new Anthropic();

const AXIS_DEFINITIONS = [
  { axis_id: "integrity-vs-result", triggers: ["诚信", "守信", "承诺", "厚道", "信用", "说到做到"], fallbackKeyword: "诚信底线" },
  { axis_id: "safety-vs-growth", triggers: ["风险", "安全", "保守", "稳", "冒险", "谨慎"], fallbackKeyword: "稳健取舍" },
  { axis_id: "rules-vs-relations", triggers: ["规矩", "规则", "人情", "关系", "情义", "讲理"], fallbackKeyword: "规矩与人情" },
  { axis_id: "achievement-vs-balance", triggers: ["成绩", "最好", "优秀", "卓越", "平衡", "压力"], fallbackKeyword: "成就与平衡" },
  { axis_id: "obedience-vs-expression", triggers: ["听话", "表达", "独立", "服从", "反思"], fallbackKeyword: "服从与表达" },
  { axis_id: "face-vs-authenticity", triggers: ["面子", "真实", "体面", "坦诚", "自尊"], fallbackKeyword: "面子与真实" },
];

const HERO_TRAIT_LIBRARY = [
  { label: "守信重诺", description: "答应的事会尽力做到", triggers: ["诚信", "守信", "承诺", "信用", "说到做到"] },
  { label: "稳健审慎", description: "权衡风险后再行动", triggers: ["风险", "安全", "保守", "稳", "谨慎"] },
  { label: "重情守义", description: "讲原则也讲情分", triggers: ["人情", "关系", "情义", "规矩"] },
  { label: "追求卓越", description: "做事希望达到更高标准", triggers: ["成绩", "最好", "优秀", "卓越"] },
  { label: "独立担当", description: "遇事先承担再反思", triggers: ["独立", "担当", "反思", "自己"] },
  { label: "真诚坦荡", description: "真实表达，不做表面功夫", triggers: ["真实", "坦诚", "面子", "体面"] },
];

function normalizeText(text) {
  return (text || "").replace(/\s+/g, "").toLowerCase();
}

function extractStoryKeywords(sourceText) {
  const keywords = [];
  const pushUnique = (word) => {
    if (!word) return;
    if (!keywords.includes(word)) keywords.push(word);
  };
  const keywordCandidates = ["诚信", "守信", "承诺", "厚道", "风险", "稳健", "规矩", "人情", "成绩", "平衡", "独立", "反思", "真实"];
  for (const candidate of keywordCandidates) {
    if (sourceText.includes(candidate)) pushUnique(candidate);
    if (keywords.length >= 4) break;
  }
  if (keywords.length < 2) {
    pushUnique("价值取舍");
    pushUnique("家庭底线");
  }
  return keywords.slice(0, 4);
}

function buildW03FallbackData(messages) {
  const latestUserMessage = [...(messages || [])]
    .reverse()
    .find((message) => message?.role === "user" && typeof message?.content === "string")
    ?.content || "";
  const normalizedUserText = normalizeText(latestUserMessage);

  const matchedAxes = [];
  for (const axisDefinition of AXIS_DEFINITIONS) {
    const matchedTrigger = axisDefinition.triggers.find((trigger) => normalizedUserText.includes(trigger));
    if (!matchedTrigger) continue;
    matchedAxes.push({ axis_id: axisDefinition.axis_id, keyword: matchedTrigger });
    if (matchedAxes.length >= 3) break;
  }
  if (matchedAxes.length < 2) {
    for (const axisDefinition of AXIS_DEFINITIONS) {
      if (matchedAxes.some((axis) => axis.axis_id === axisDefinition.axis_id)) continue;
      matchedAxes.push({ axis_id: axisDefinition.axis_id, keyword: axisDefinition.fallbackKeyword });
      if (matchedAxes.length >= 2) break;
    }
  }

  const heroTraits = [];
  const pushHeroTrait = (heroTrait) => {
    if (heroTraits.some((item) => item.label === heroTrait.label)) return;
    heroTraits.push({ label: heroTrait.label, description: heroTrait.description });
  };
  for (const heroTrait of HERO_TRAIT_LIBRARY) {
    const hasTrigger = heroTrait.triggers.some((trigger) => normalizedUserText.includes(trigger));
    if (!hasTrigger) continue;
    pushHeroTrait(heroTrait);
    if (heroTraits.length >= 4) break;
  }
  if (heroTraits.length < 2) {
    pushHeroTrait(HERO_TRAIT_LIBRARY[0]);
    pushHeroTrait(HERO_TRAIT_LIBRARY[1]);
  }

  return {
    axes: matchedAxes.slice(0, 3),
    story_keywords: extractStoryKeywords(latestUserMessage),
    hero_traits: heroTraits.slice(0, 4),
  };
}

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
- W-01: **多轮引导对话（2-4 轮）**。你的角色是家庭战略咨询师，通过追问帮用户"挖"出家族的底层行为模式。不要急着收结论，要帮用户打开记忆。

  **轮次控制规则**：
  - 至少完成 2 轮对话后才允许发 <!--READY-->
  - 最多 4 轮对话后必须发 <!--READY-->
  - 每轮只问一件事
  - 判断素材是否足够：需要有"具体事件 + 情绪/态度 + 行为反应"

  **判断当前是第几轮的方法**：看对话历史中，在 W-01 阶段用户回复了几条消息。如果用户还没回复过，这是第 1 轮。

  **第 1 轮（开场引导）**：
  肯定前两个模块的成果，然后引入"精神考古"。问：
  "先从记忆开始——你觉得你自己的父母（也就是孩子的爷爷奶奶或外公外婆），他们经常在家里说的话是什么？或者你小时候，印象很深的一次冲突、批评、或者让你特别骄傲的瞬间？不用想太完整，先随便聊聊。"

  **第 2 轮（聚焦具体场景）**：根据用户回答追问——
  - 如果用户说了口头禅 → "这句话背后，有没有一个具体的事情让你印象特别深？当时发生了什么？"
  - 如果用户说了冲突/事件 → "当时你或家人是怎么反应的？最后怎么处理的？"
  - 如果用户说了笼统感受 → "能不能想一个具体的瞬间？比如某次吃饭时、某个重要决定时？"

  **第 3 轮（深挖价值取舍，如果素材足够可跳过直接 READY）**：
  "听你说这个故事，我感觉你们家在那个瞬间，其实是把「A」看得比「B」更重要——"然后给一个你的判断，问用户对不对。
  可以引用以下对比帮打开思路（选最相关的 1 个）：
  · 关于诚信与利益："咱宁可吃亏，也不能占没良心的便宜" vs "别那么死板，能拿到是你的本事"
  · 关于风险与安全："不要瞎折腾，安安稳稳的最好" vs "去做吧，失败了算我的"
  · 关于规则与人情："规矩是死的，人是活的" vs "再亲的人，借钱也要打借条"
  · 关于个人与集体："家里的事，关起门来说" vs 孩子受委屈时先问"你是不是先惹别人了？"

  **第 4 轮（兜底收尾）**：
  简短总结你从对话中听到的核心模式（1-2句），然后说"好的，我大致理解了。现在请在下面的卡片里，把你的故事用 1-3 句话写下来。"必须带 <!--READY-->。

  **READY 信号规则**：
  - 当你认为已经收集到足够素材（有具体事件+情绪+行为），在回复末尾加 <!--READY-->
  - 说 READY 时要自然过渡到卡片："现在请在下面的卡片里，把你印象最深的那个瞬间用 1-3 句话写下来"
  - <!--READY--> 必须是回复的最后一行，用户看不到这个标记
- W-03: 接住用户的故事。你的任务是：1) 从故事中提取关键词并选取舍轴；2) 基于故事推断家族英雄特质。
  **你必须在回复末尾输出结构化数据，格式：**
  <!--DATA:{"axes":[{"axis_id":"轴ID","keyword":"从故事提取的关键词"},...], "hero_traits":[{"label":"特质名(2-4字)","description":"一句话说明(10字内)"},...], "story_keywords":["关键词1","关键词2"]}-->
  axes 规则：可用的 axis_id：integrity-vs-result, safety-vs-growth, rules-vs-relations, achievement-vs-balance, obedience-vs-expression, face-vs-authenticity。关键词必须来自用户原话，不要编造。最少选 2 组，最多 3 组。
  hero_traits 规则：基于故事中体现的行为模式，推断家族最受尊敬的人可能具备的 4-6 个特质。每个特质用 2-4 字命名 + 10 字内说明。必须贴合用户故事，不要用通用模板。
  回复正文简短接住故事（2-3句），然后说"我帮你把故事翻译成几个取舍点，请在下方卡片中确认"。
  **⚠️ <!--DATA:...-->必须作为回复的最后一行输出，这是前端渲染卡片的唯一数据来源，缺失则卡片无法正常显示。**
- W-07: 综合用户在 Q1（故事）、Q2（取舍）、Q3（英雄）、Q4（口头禅）的所有数据，提炼 3-5 个"家风内核"候选命名。
  每个候选必须包含 name（2-4字中性策略命名）、definition（一句话定义）、evidence（引用 Q1-Q4 的具体数据作为依据）。
  **你必须在回复末尾输出结构化数据，格式：**
  <!--DATA:{"candidates":[{"name":"命名","definition":"一句话定义","evidence":{"story":"Q1证据","tradeoff":"Q2证据","hero":"Q3证据","quote":"Q4证据"}},...]}>-->
  回复正文简短总结用户给的信息模式（2-3句），然后说"我提炼了几个候选，请在下方卡片中选择"。
- W-09: 确认用户选择的命名，引出 flip side。基于用户确认的 core_code 和之前的故事，像咨询师一样说"每种家风都有正反两面"，然后简短过渡到下方卡片。
  **你必须在回复末尾输出结构化数据，格式：**
  <!--DATA:{"flipside":{"tags":["副作用标签1","副作用标签2"],"example":"基于用户故事推测的具体表现场景","benefits":["好处1","好处2","好处3"],"costs":["代价1","代价2","代价3"]}}-->
  tags: 从用户故事和家风中推断最可能的2个副作用（用简短的词，如"过度严格""回避冲突""压抑情感"等）
  example: 根据用户之前讲的故事，推测一个这种家风可能导致的具体生活场景（要贴近用户的真实情境，不要泛泛而谈）
  benefits: 3个这种家风带来的好处（简短，每个10字以内）
  costs: 3个这种家风可能的代价（简短，每个10字以内）
  注意：这些只是AI的建议，用户可以在卡片中修改。要基于用户之前的故事和context来生成，不要用通用模板。
注意：W-12（final statement）由前端模板生成，不经过 AI。W 模块快照也由前端模板生成。

### 模块 E（共识）
- E-01: 引导做直觉锚定，说"请在下方卡片中凭直觉填写"。不要重复卡片里的问题。
- E-03: 接住直觉回答，简短回应，说"接下来请在价值观画廊中选出你们家最看重的价值观"。不要列出选项，卡片会自动出现。
- E-05: 分析用户选择的价值观分布模式，对比直觉锚定和画廊选择的一致性/差异。如果用户消息中包含"我选的"和"伴侣选的"（即双人模式），重点分析两人选择的交集与差异，指出可能的价值观张力或互补，并点评共识结果的取舍逻辑。追问一轮。不要问卡片已经问过的问题。
- E-08: 汇总生成共识快照。必须整合以下数据：(1) 直觉锚点（最希望孩子拥有什么、最怕缺少什么）(2) 核心价值观和战略暂缓 (3) 如果是双人模式（用户消息中出现"我选的"和"伴侣选的"），点明双方选择的关键差异及最终共识取舍 (4) 战略方向及用户给出的理由。快照应像一段完整的共识宣言，不要用列表格式。

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

    let streamedText = "";
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
        streamedText += event.delta.text;
        res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
      }
    }

    const isW03 = flowContext?.nodeId === "W-03";
    const missingDataTag = !streamedText.includes("<!--DATA:");
    if (isW03 && missingDataTag) {
      const fallbackPayload = buildW03FallbackData(messages);
      const fallbackDataTag = `<!--DATA:${JSON.stringify(fallbackPayload)}-->`;
      res.write(`data: ${JSON.stringify({ text: fallbackDataTag })}\n\n`);
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

app.post("/api/feedback", async (req, res) => {
  const {
    area,
    issueType,
    description,
    reproducibility,
    contact,
    context,
    recentMessages,
  } = req.body || {};

  if (!description || typeof description !== "string" || !description.trim()) {
    return res.status(400).json({ error: "description is required" });
  }

  const feedbackRecord = {
    id: createFeedbackId(),
    area: typeof area === "string" ? area : "未分类",
    issueType: typeof issueType === "string" ? issueType : "其他",
    description: description.trim(),
    reproducibility: typeof reproducibility === "string" ? reproducibility : undefined,
    contact: typeof contact === "string" ? contact : undefined,
    context: context || {},
    recentMessages: Array.isArray(recentMessages) ? recentMessages : [],
    receivedAt: new Date().toISOString(),
  };

  try {
    const supabaseAdmin = getSupabaseAdminClient();
    const conversationId = context?.conversationId || null;
    const resolvedUserId = await resolveUserIdByConversationId(supabaseAdmin, conversationId);
    const insertPayload = {
      id: feedbackRecord.id,
      user_id: resolvedUserId,
      conversation_id: conversationId,
      area: feedbackRecord.area,
      issue_type: feedbackRecord.issueType,
      description: feedbackRecord.description,
      reproducibility: feedbackRecord.reproducibility || null,
      contact: feedbackRecord.contact || null,
      context: feedbackRecord.context || {},
      recent_messages: feedbackRecord.recentMessages || [],
      source: "in_app_widget",
      created_at: feedbackRecord.receivedAt,
    };

    const { error } = await supabaseAdmin.from("feedbacks").insert(insertPayload);
    if (error) {
      console.error("[feedback] supabase insert failed:", error);
      return res.status(500).json({ error: "failed to store feedback" });
    }

    await forwardFeedbackToWebhook(feedbackRecord);
    return res.status(200).json({ ok: true, feedbackId: feedbackRecord.id });
  } catch (error) {
    console.error("[feedback] submit failed:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "feedback submit failed",
    });
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

4. **strength_risk**（优势与风险）：基于以上三个交叉分析，指出当前家庭定位的最大优势和最大风险。如果 facts 中包含 W.flipsideTags，应将家风副作用作为风险来源之一。
5. **strategic_summary**（战略整合）：四模块交叉后的一句话战略定位总结

### 必须引用的字段绑定（based_on 中必须包含对应 fact ID，前提是该字段在 facts 中存在且 value 不为 null）
- tension_resolve 必须在 based_on 中包含 W.tradeoffChoices（如果存在），并在 content 中分析取舍倾向对矛盾化解的影响
- tension_resolve 必须在 based_on 中包含 W.upgradeKeep 和 W.upgradeTo（如果存在），并引用"保留…升级为…"的路径
- philosophy_anchor 必须在 based_on 中包含 E.directionReason（如果存在），并在 content 中引用用户给出的理由原文
- strength_risk 必须在 based_on 中包含 W.flipsideTags（如果存在），并将家风副作用作为风险来源之一

### 单人/双人模式
- 如果 facts 中存在 E.selfCore 和 E.partnerCore（即双人模式）：
  - philosophy_anchor 必须在 based_on 中包含 E.selfCore 和 E.partnerCore，并明确分析双方选择的差异（如"一方更看重X，另一方更看重Y"）和最终共识的取舍逻辑
  - vision_statement 使用"我们"措辞，体现双方共识
- 如果 facts 中不存在这些字段（即单人模式）：使用"你的价值选择"措辞，不要提及"双方共识"或"伴侣"。vision_statement 使用"我们家"视角（代表家庭整体，但不暗示双人协商过程）。

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
  add("W.tradeoffChoices", "取舍倾向", cd.W?.tradeoffChoices ? {
    value: (cd.W.tradeoffChoices.value || [])
      .map(t => `在「${t.labelA} vs ${t.labelB}」上更偏向${t.choice === "A" ? t.labelA : t.labelB}`)
      .join("；"),
    source: cd.W.tradeoffChoices.source,
  } : null, "W");
  add("W.flipsideTags", "家风副作用", cd.W?.flipsideTags, "W");
  add("W.flipsideBenefit", "家风好处", cd.W?.flipsideBenefit, "W");
  add("W.flipsideCost", "家风代价", cd.W?.flipsideCost, "W");
  add("W.upgradeKeep", "升级保留", cd.W?.upgradeKeep, "W");
  add("W.upgradeReduce", "升级减少", cd.W?.upgradeReduce, "W");
  add("W.upgradeFrom", "升级起点", cd.W?.upgradeFrom, "W");
  add("W.upgradeTo", "升级方向", cd.W?.upgradeTo, "W");
  add("W.finalStatement", "升级宣言", cd.W?.finalStatement, "W");

  // E
  add("E.anchors", "直觉锚点", cd.E?.anchors ? {
    value: `最希望拥有「${cd.E.anchors.value?.gift_to_child}」，最怕缺少「${cd.E.anchors.value?.fear_child_lacks}」`,
    source: cd.E.anchors.source,
  } : null, "E");
  add("E.coreValues", "核心价值观", cd.E?.coreValues, "E");
  add("E.deferredValues", "战略暂缓", cd.E?.deferredValues, "E");
  add("E.direction", "战略方向", cd.E?.direction, "E");
  add("E.directionReason", "方向理由", cd.E?.directionReason, "E");

  // 双人模式：传入各自选择，让报告 AI 能分析差异
  if (cd.E?.partnerSkipped?.value === false) {
    add("E.selfCore", "我的核心价值观", cd.E?.selfCore, "E");
    add("E.selfDeferred", "我的战略暂缓", cd.E?.selfDeferred, "E");
    add("E.partnerCore", "伴侣的核心价值观", cd.E?.partnerCore, "E");
    add("E.partnerDeferred", "伴侣的战略暂缓", cd.E?.partnerDeferred, "E");
  }

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

请根据这些 facts 生成 insights 和 drafts。

重要规则：based_on 只能引用上方 facts 中实际存在且 value 不为 null 的 fact ID。如果某个字段在 facts 中不存在或 value 为 null，不要将其放入 based_on。
如果上方 facts 中存在 E.selfCore 和 E.partnerCore（即双人模式），则 philosophy_anchor 的 based_on 必须包含这两个 fact ID，并在 content 中分析双方选择的差异与最终共识取舍。

严格按以下 JSON 格式输出：

{
  "insights": [
    {
      "id": "opportunity_match",
      "title": "机遇匹配（S×N）",
      "content": "你们家「xxx资本」最适合用来培养「xxx能力」...",
      "based_on": ["S.capital_文化资本", "N.coreAbility"],
      "confidence": "high"
    },
    {
      "id": "tension_resolve",
      "title": "矛盾化解（W×N）",
      "content": "家族「xxx」的精神内核与未来需要「xxx」存在张力...取舍倾向显示...升级路径是保留...升级为...",
      "based_on": ["W.coreCode", "N.coreAbility", "W.tradeoffChoices", "W.upgradeKeep", "W.upgradeTo"],
      "confidence": "medium"
    },
    {
      "id": "philosophy_anchor",
      "title": "哲学锚定（E×S×W）",
      "content": "选择「xxx」方向是因为（引用用户理由原文）...这将决定资本运用方式...",
      "based_on": ["E.direction", "E.directionReason", "S.capital_文化资本", "W.coreCode"],
      "confidence": "high"
    },
    {
      "id": "strength_risk",
      "title": "优势与风险",
      "content": "最大优势：...最大风险：...家风副作用（如xxx）也是风险来源之一...",
      "based_on": ["S.capital_社会资本", "W.flipsideTags", "E.direction"],
      "confidence": "medium"
    },
    {
      "id": "strategic_summary",
      "title": "战略整合",
      "content": "一句话战略定位总结...",
      "based_on": ["S.capital_文化资本", "W.coreCode", "N.coreAbility", "E.coreValues"],
      "confidence": "high"
    }
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
    ...共 3 个 draft
  ]
}

不要在 JSON 之外添加任何说明文字、markdown 标记或换行。直接以 { 开头，以 } 结尾。只输出 JSON，不要任何其他文字。`;

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
