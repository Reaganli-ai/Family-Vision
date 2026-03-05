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
- S-03: 接住用户的资本矩阵数据，分析三项资本之间的关系和模式（如"文化高+社会低=内功强但连接少"）。追问一个关于"这些资本之间如何互相影响"的问题（比如"文化资本这么强，有没有用它带动过社会资本？"）。注意：不要问"优先升级哪项"，这个问题后面有专门的卡片。
- S-05: 接住用户追问的回答，简短回应，然后说"接下来请在卡片中选择你们最想优先升级的资本"。不要重复列出选项，卡片会自动出现。
- S-07: 基于选择做解读（选高项→拉长板；选低项→补短板），然后说"我帮你整理了一份家底快照，看看是否准确"。

### 模块 N（眼光）
- N-01: 从家底过渡到眼光，一句话引出趋势思考。说"请在下方卡片中选择"。不要列出选项，卡片会自动出现。
- N-03: 接住趋势选择，简短分析为什么这个趋势重要。然后说"接下来请在卡片中选出你认为孩子最需要的核心能力"。不要列出选项。
- N-05: 连接家底快照做交叉分析（把素养选择和资本数据关联），追问一轮。不要问卡片已经问过的问题。
- N-07: 不要再追问了！直接汇总用户所有回答，生成眼光快照。必须包含 <!--SNAPSHOT:...-->。

### 模块 W（根基）
- W-01: 解释"家族精神内核"——代代相传的生存哲学。说"请在下方卡片中写一个关键瞬间"。不要重复卡片里的问题。
- W-03: 基于用户的故事提炼和命名精神内核（如"宁折不弯的信义哲学"），问用户"这个命名准确吗？你觉得还差什么？"
- W-05: 接住用户的确认/修正，做战略诊断——这套内核在当下是赋能还是约束？然后说"请在下方卡片中写出你们想继承什么、升级成什么"。不要重复卡片里的问题。
- W-07: 追问升级宣言的可操作性，具体到一个场景（如"下次孩子考了第三名，你们会怎么回应？"）
- W-09: 汇总生成快照。

### 模块 E（共识）
- E-01: 引导做直觉锚定，说"请在下方卡片中凭直觉填写"。不要重复卡片里的问题。
- E-03: 接住直觉回答，简短回应，说"接下来请在价值观画廊中选出你们家最看重的价值观"。不要列出选项，卡片会自动出现。
- E-05: 分析用户选择的价值观分布模式，对比直觉锚定和画廊选择的一致性/差异，追问一轮。不要问卡片已经问过的问题。
- E-08: 汇总生成快照。

### 快照生成规则（必须严格遵守）
当 nodeId 为 S-07, N-07, W-09, E-08 时，你必须在回复末尾生成快照。格式：
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
    const snapshotNodes = ["S-07", "N-07", "W-09", "E-08"];
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
