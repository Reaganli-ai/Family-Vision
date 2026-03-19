# 家庭愿景工坊 · 对话流 v2.0（2026-03-18 实现版）

> **本文档定位**：反映截至 2026-03-18 的**真实工程实现状态**，不是理想态。
>
> **与原版的关系**：
> - `conversation-flow.md` = 产品理想态 / 方法论原稿 / 理想规格基线
> - `conversation-flow-v2-mvp.md`（本文档）= 当前工程实现 / 开发协作基准
>
> **后续开发以本文档为准。** 如需回溯产品设计意图，参考原版。
> 本文档不发明新方法论，所有方法论、模块顺序、核心问题均以 Word 母稿为准。

---

## 一、产品架构概览

- **4 模块 + FINAL 报告**：S（家底）→ N（眼光）→ W（根基）→ E（共识）→ 罗盘报告
- **Workspace 布局**：65:35 分栏（左侧聊天 : 右侧信息栏）
- **对话引擎**：flow.ts 定义节点序列，每个模块由 AI 节点 + 卡片节点交替组成
- **数据持久化**：CompassDataSchema（结构化）+ 聊天历史（非结构化）
- **快照生成**：S/E 由 AI 生成（`<!--SNAPSHOT:...-->`），N/W 由前端模板生成

### nodeId 编号规则

flow.ts 中每个模块的节点从 0 开始编号，nodeId 格式为 `{模块}-{节点索引+1}`，如 S-01、W-03。server.js prompt 中的 step 编号（如 E-05、E-08）对应的是 nodeId，不是 conversation-flow.md 中的 step 编号。

---

## 二、模块总览表

> 任务类型：收集 / 判断 / 提炼 / 校准 / 确认
> AI 介入：无 / 轻 / 重
> 状态：✅ 完整通过 / ⚠️ MVP 通过（有已接受偏差）

| Step | 名称 | 任务类型 | AI介入 | 展示形式 | 状态 |
|------|------|---------|-------|---------|------|
| **S-01** | 资本自评 | 收集 | 无 | 矩阵卡片 | ✅ |
| **S-02** | 资本总结确认 | 确认 | 轻 | 确认卡片 | ✅ |
| **S-03** | AI 追问判断依据 | 校准 | 重 | AI 对话 | ✅ |
| **S-04** | 优先升级选择 | 判断 | 无 | 单选+理由卡片 | ✅ |
| **S-05** | AI 校准 + 家底快照 | 提炼 | 重 | AI → 快照卡片 | ✅ |
| | | | | | |
| **N-01** | 情绪雷达 + 信号捕捉 | 收集 | 无 | 趋势排序卡片 | ✅ |
| **N-02** | AI 趋势转译 → 排序 | 提炼+判断 | 重 | AI → 能力卡片 | ✅ |
| **N-03** | 素养聚焦 | 判断 | 无 | 同意/不同意卡片 | ✅ |
| **N-04** | AI 叩问 + 眼光快照 | 校准+提炼 | 重 | 模板快照 → 确认 | ✅ |
| | | | | | |
| **W-01** | AI 多轮故事引导 | 收集 | 重 | AI 多轮对话 | ✅ |
| **W-02** | 故事结构化确认 | 确认 | 无 | 故事填写卡片 | ✅ |
| **W-03** | AI 提取取舍轴+英雄特质 | 提炼+判断 | 重 | AI → 取舍卡片 → 英雄卡片 | ⚠️ |
| **W-04** | 用户命名家风内核 | 判断 | 重 | AI → 命名卡片 | ✅ |
| **W-05** | AI 副作用诊断 | 校准 | 重 | AI → 副作用卡片 | ✅ |
| **W-06** | 升级路径 | 判断 | 轻 | 升级路径卡片 | ✅ |
| **W-07** | AI 校准 + 根基快照 | 提炼 | 重 | 模板快照 → 确认 | ✅ |
| | | | | | |
| **E-01** | 直觉锚定 | 收集 | 无 | 关键词填写卡片 | ⚠️ |
| **E-02** | 价值观画廊（双人） | 判断 | 无 | 5 阶段画廊卡片 | ⚠️ |
| **E-03** | AI 校准共识与差异 | 校准 | 重 | AI 对话 | ⚠️ |
| **E-04** | 战略方向 + 理由 | 判断 | 无 | 同意/不同意 → 方向+理由卡片 | ✅ |
| **E-05** | AI 校准 + 共识快照 | 提炼 | 重 | AI 快照 → 确认 | ✅ |
| | | | | | |
| **FINAL** | 罗盘报告生成 | — | 重 | 服务端 AI 报告 | ✅ |

---

## 三、Step 详细规格

---

### 模块 S — 我们的家底

> 与原版 conversation-flow.md 一致，本轮未修改。
> 详细规格请参考原版 S-01 ~ S-05。

**flow.ts 节点映射**：

| nodeId | 索引 | 类型 | 对应 Step |
|--------|------|------|-----------|
| S-01 | 0 | ai | 开场引导 |
| S-02 | 1 | card:capital-matrix | S-01 资本自评 |
| S-03 | 2 | card:capital-summary | S-02 资本确认 |
| S-04 | 3 | ai | S-03 AI 追问 |
| S-05 | 4 | user | 用户阐述 |
| S-06 | 5 | ai | AI 点评 + 过渡 |
| S-07 | 6 | card:priority-select | S-04 优先升级 |
| S-08 | 7 | ai | S-05 AI 生成快照 |
| S-09 | 8 | card:snapshot | 快照确认 |

**快照生成方式**：AI 生成（`<!--SNAPSHOT:...-->`）

---

### 模块 N — 我们的眼光

> 与原版 conversation-flow.md 一致，本轮未修改。
> 详细规格请参考原版 N-01 ~ N-04。

**flow.ts 节点映射**：

| nodeId | 索引 | 类型 | 对应 Step |
|--------|------|------|-----------|
| N-01 | 0 | ai | 开场引导 |
| N-02 | 1 | card:trend-rank | N-01 趋势排序 |
| N-03 | 2 | ai | N-02 接住趋势 |
| N-04 | 3 | card:ability-select | N-03 能力押注 |
| N-05 | 4 | ai | 诊断三段论（前端模板生成） |
| N-06 | 5 | card:agree-disagree | 同意/不同意 |
| N-07 | 6 | ai | 汇总（模板快照） |
| N-08 | 7 | card:snapshot | 快照确认 |

**快照生成方式**：前端模板生成（`generateSnapshotFromFields`）

---

### 模块 W — 我们的根基

> **Word 原意**：连接家族的精神血脉
> **快照产出**：底层代码 / 源于什么看重 / 继承什么内核 / 升级为什么形式

**flow.ts 节点映射**：

| nodeId | 索引 | 类型 | 对应 Step |
|--------|------|------|-----------|
| W-01 | 0 | ai | W-01 多轮故事引导 |
| W-02 | 1 | card:story-input | W-02 故事填写 |
| W-03 | 2 | ai | W-03 AI 提取取舍轴+英雄特质 |
| W-04 | 3 | card:tradeoff-choice | W-03 取舍卡片 |
| W-05 | 4 | card:hero-select | W-03 英雄特质卡片 |
| W-06 | 5 | card:quote-fill | 口头禅卡片 |
| W-07 | 6 | ai | W-04 AI 综合提炼候选 |
| W-08 | 7 | card:core-code-confirm | W-04 命名确认 |
| W-09 | 8 | ai | W-05 AI 引出副作用 |
| W-10 | 9 | card:flipside-fill | W-05 副作用卡片 |
| W-11 | 10 | card:upgrade-path | W-06 升级路径 |
| W-12 | 11 | ai | W-07 升级宣言（模板生成） |
| W-13 | 12 | card:snapshot | W-07 快照确认 |

---

#### W-01 · AI 多轮故事引导

| 字段 | 内容 |
|------|------|
| **目标** | 通过 2-4 轮引导，帮用户从抽象印象进入体现家族行为模式的具体故事 |
| **展示形式** | AI 多轮对话（`<!--READY-->` 信号控制推进） |
| **数据写入** | 无结构化写入，故事在 W-02 卡片中确认 |

---

#### W-02 · 故事结构化确认

| 字段 | 内容 |
|------|------|
| **目标** | 用户将关键瞬间用 1-3 句话写下来并确认 |
| **展示形式** | card:story-input（textarea，300 字上限） |
| **数据写入** | `W.story`（source: user_typed） |

---

#### W-03 · AI 提取取舍轴 + 英雄特质

| 字段 | 内容 |
|------|------|
| **目标** | AI 从故事中提取取舍轴和英雄特质 → 用户通过两张卡片确认 |
| **展示形式** | AI 消息（`<!--DATA:{axes, hero_traits}-->`）→ card:tradeoff-choice → card:hero-select |
| **数据写入** | `W.tradeoffChoices`（source: user_selected）、`W.heroTraits`（source: user_selected） |

> **MVP 偏差**：英雄特质选项由 AI 动态生成，但 Haiku 不稳定输出 hero_traits 字段。前端有 fallback（4 个通用参考选项 + 自定义入口）。当前策略为"动态优先、fallback 托底、自定义补充"。日期：2026-03-18。

---

#### W-04 · 用户命名家风内核

| 字段 | 内容 |
|------|------|
| **目标** | 用户为家族底层代码命名 |
| **展示形式** | AI 消息（综合总结 + `<!--DATA:{candidates}-->`）→ card:core-code-confirm |
| **用户输入** | 从 AI 候选中选一个（可修改），或完全自定义 |
| **数据写入** | `W.coreCode`（`{name, definition, userEdited?}`，source: user_selected 或 user_typed） |

**与原版差异**：原版要求 `{name, reason}` 两个字段。实际实现为 `{name, definition}`——definition 回答"是什么"而非"为什么"。文案强调"参考方向，你完全可以用自己的词"。

> **MVP 偏差**：保留 definition 字段，未新增 reason 字段。原因：当前卡片交互已足够让用户自主命名，reason 的解释力由上下文（故事、取舍、英雄特质）间接覆盖。日期：2026-03-18。

---

#### W-05 · AI 副作用诊断

| 字段 | 内容 |
|------|------|
| **目标** | 帮用户看到家风的正反两面 |
| **展示形式** | AI 消息（生成副作用建议 `<!--DATA:{flipside}-->`）→ card:flipside-fill |
| **用户输入** | 副作用标签（选/改）、举例、好处、代价 |
| **数据写入** | `W.flipsideTags`、`W.flipsideExample`、`W.flipsideBenefit`、`W.flipsideCost` |

**与原版差异**：原版设计为多轮 AI 对话（分亲子/夫妻/个人场景追问 3-4 轮）。实际实现为单轮 AI + 一张卡片。

> **MVP 偏差**：保持单 AI + 卡片架构，未实现多轮分场景诊断。原因：MVP 阶段优先保证流程完整性，多轮深挖作为后续增强。日期：2026-03-18。

---

#### W-06 · 升级路径

| 字段 | 内容 |
|------|------|
| **目标** | 用户确定保留什么内核 + 升级为什么形式 |
| **展示形式** | card:upgrade-path（4 个字段） |
| **用户输入** | 保留/减少/从/到 |
| **数据写入** | `W.upgradeKeep`、`W.upgradeReduce`、`W.upgradeFrom`、`W.upgradeTo`（source: user_typed） |

---

#### W-07 · AI 校准 + 根基快照

| 字段 | 内容 |
|------|------|
| **目标** | 生成升级宣言 + 根基快照 |
| **展示形式** | AI 消息（升级宣言，前端模板生成）→ card:snapshot |
| **快照生成** | 前端模板生成（`generateSnapshotFromFields`），对齐 Word 模板格式 |

**Word 模板四个空的字段映射**：

| Word 空位 | 映射字段 | 说明 |
|-----------|---------|------|
| 底层代码「___」的生存哲学 | `W.coreCode.name` | 精确匹配 |
| 源于对「___」的看重 | `W.coreCode.definition` | 近似匹配 |
| 继承其「___」内核 | `W.upgradeKeep` | 精确匹配 |
| 升级为「___」 | `W.upgradeTo` | 精确匹配 |

> **MVP 偏差**：Word 第 2 空语义为"源于什么看重"（why），实际映射字段 definition 回答的是"是什么"（what）。当前为最佳近似，未引入 AI 辅助 value_root 生成。日期：2026-03-18。

---

### 模块 E — 我们的共识

> **Word 原意**：家庭教育的"战略价值观"对齐
> **快照产出**：核心价值观 / 战略暂缓 / 战略方向

**flow.ts 节点映射**：

| nodeId | 索引 | 类型 | 对应 Step |
|--------|------|------|-----------|
| E-01 | 0 | ai | 开场引导 |
| E-02 | 1 | card:keyword-fill | E-01 直觉锚定 |
| E-03 | 2 | ai | 接住直觉 → 过渡到画廊 |
| E-04 | 3 | card:value-gallery | E-02 价值观画廊 |
| E-05 | 4 | ai | E-03 AI 分析选择模式 |
| E-06 | 5 | card:agree-disagree | E-04 同意/不同意 |
| E-07 | 6 | card:single-select | E-04 战略方向 + 理由 |
| E-08 | 7 | ai | E-05 AI 汇总快照 |
| E-09 | 8 | card:snapshot | 快照确认 |

---

#### E-01 · 直觉锚定

| 字段 | 内容 |
|------|------|
| **目标** | 在理性选择前锚定直觉 |
| **展示形式** | card:keyword-fill（2 个字段） |
| **用户输入** | "最希望孩子拥有___" + "最怕孩子缺少___" |
| **数据写入** | `E.anchors`（`{gift_to_child, fear_child_lacks}`，source: user_typed） |

**与原版差异**：原版要求双人分别填写（我 + 伴侣各填一次）。实际实现为单人填写。

> **MVP 偏差**：E-01 保持单人填写，未实现双人分别锚定。原因：双人能力集中在 E-02 价值观画廊实现，直觉锚定的核心目的是快速捕捉第一反应，单人已满足。日期：2026-03-18。

---

#### E-02 · 价值观画廊（支持单人/双人）

| 字段 | 内容 |
|------|------|
| **目标** | 选出核心价值观 + 战略暂缓，支持双人协商 |
| **展示形式** | card:value-gallery（5 阶段内部状态机） |
| **数据写入** | 见下方 |

**5 阶段流程**：

1. **self-core**：我选 3 个核心聚焦
2. **self-deferred**：我选 2 个战略暂缓
3. **分叉点**：
   - "只有我一人，确认" → 直接以个人选择作为最终结果（partnerSkipped=true）
   - "伴侣也来选 →" → 进入 partner 阶段
4. **partner-core / partner-deferred**：伴侣独立选择（看不到我的选择）
5. **consensus**：共识协商面板（交集预选，用户微调）

**单人模式是正常路径，不是跳过异常。** 按钮文案明确提供两条并列选择，不暗示单人是在省略步骤。

**数据写入**：

| 字段 | 单人模式 | 双人模式 |
|------|---------|---------|
| `E.selfCore` | ✅ = 最终结果 | ✅ 我的选择 |
| `E.selfDeferred` | ✅ = 最终结果 | ✅ 我的暂缓 |
| `E.partnerCore` | 不写入 | ✅ 伴侣的选择 |
| `E.partnerDeferred` | 不写入 | ✅ 伴侣的暂缓 |
| `E.partnerSkipped` | true | false |
| `E.coreValues` | = selfCore | = 协商结果 |
| `E.deferredValues` | = selfDeferred | = 协商结果 |

**价值观选项**（4 类 × 4 项 = 16 项，硬编码在 ValueGalleryCard 中）：
- A 内在稳定：真实一致 / 情绪安全 / 自尊自信 / 韧性复原
- B 成长与连接：自主驱动 / 好奇探索 / 深度同理 / 协作共赢
- C 社会参与：责任担当 / 批判思维 / 公平正义 / 社会贡献
- D 精神意义：意义追寻 / 审美感知 / 财务智慧 / 实用技能

---

#### E-03 · AI 校准共识与差异

| 字段 | 内容 |
|------|------|
| **目标** | AI 分析选择模式，对比直觉锚定和画廊选择 |
| **展示形式** | AI 消息（分析+追问）→ 用户回应 |

**summary 格式（传给 AI 的 user message）**：
- 单人模式：`我选的核心价值观：A、B\n战略暂缓：C、D`
- 双人模式：三层——我的选择 / 伴侣的选择 / 最终共识

**AI prompt 行为**：
- 单人：分析个人选择模式 + 对比直觉锚定
- 双人（检测 summary 中包含"我选的"+"伴侣选的"）：额外分析交集/差异/张力/互补 + 点评共识取舍

> **MVP 偏差**：E-03 AI 双人分析依赖 prompt 条件分支遵循率。Haiku 可能偶尔忽略双人对比指令。数据通路已打通，行为质量属 prompt 调优范畴。日期：2026-03-18。

---

#### E-04 · 战略方向 + 理由

| 字段 | 内容 |
|------|------|
| **目标** | 确认 AI 分析 + 选定教育战略方向 + 说明理由 |
| **展示形式** | card:agree-disagree → card:single-select（含 reasonPlaceholder） |
| **用户输入** | 同意/不同意 → 选方向 + 必填理由 |
| **数据写入** | `E.agreeDisagree`、`E.direction`（关键词：内核/创造/连接）、`E.directionReason`（source: user_typed） |

**方向选项**（硬编码在 flow.ts）：
- 内核 · 向内探索、夯实自我，让孩子先认识自己
- 创造 · 向外开拓、定义新事物，鼓励孩子去创造
- 连接 · 搭建关系、成就他人，培养孩子的社会力

**理由字段**：必填，placeholder "因为我们相信，最终能让孩子获得幸福与成就的，是……"，切换方向时理由自动清空。

---

#### E-05 · AI 校准 + 共识快照

| 字段 | 内容 |
|------|------|
| **目标** | AI 整合全部 E 模块数据，生成共识快照 |
| **展示形式** | AI 消息（`<!--SNAPSHOT:...-->`）→ card:snapshot |
| **快照生成** | AI 生成（server.js E-08 prompt） |

**AI prompt 要求整合 4 点**：
1. 直觉锚点（最希望/最怕）
2. 核心价值观和战略暂缓
3. 双人模式下的差异与共识取舍
4. 战略方向及理由

---

### 模块 E — 单人/双人模式对照

| 维度 | 单人模式 | 双人模式 |
|------|---------|---------|
| E-01 直觉锚定 | 一人填写 | 同左（未实现双人） |
| E-02 画廊 | 选完点"只有我一人，确认" | 选完点"伴侣也来选" → 共识面板 |
| E-02 数据 | partnerSkipped=true | partnerSkipped=false |
| E-03 AI | 分析个人选择 | 额外分析双方差异 |
| E-03 summary | 一层（我的选择） | 三层（我/伴侣/共识） |
| E-04 方向+理由 | 完全相同 | 完全相同 |
| E-05 快照 | 整合个人数据 | 额外整合双人差异 |
| 报告 facts | 不传 selfCore/partnerCore | 传入双人字段 |
| 报告措辞 | "你的价值选择" | "你们的共识" |

---

### FINAL — 罗盘报告链路

> **实现方式**：服务端 AI 报告生成（`POST /api/report`），使用 Claude Sonnet。
> 不在对话流中，由用户点击"导出家庭罗盘"触发。

#### 报告生成流程

```
用户点"导出" → POST /api/report { compassData }
  → Step 1: assembleFacts — 从 compassData 拼装结构化 facts
  → Step 2: AI 生成 insights + drafts（REPORT_SYSTEM_PROMPT 指导）
  → Step 3: validateReport — 校验引用合法性
  → 返回 { facts, insights, drafts, warnings }
```

#### assembleFacts 字段清单

**S 模块**（3 facts）：

| fact ID | label | 来源字段 |
|---------|-------|---------|
| S.capital_{label} | 各资本 | S.capitalMatrix（按行展开） |
| S.capitalRationale | 评估逻辑 | S.capitalRationale |
| S.priorityUpgrade | 优先升级资本 | S.priorityUpgrade |

**N 模块**（5 facts）：

| fact ID | label | 来源字段 |
|---------|-------|---------|
| N.trendsRanked | 趋势判断 Top 3 | N.trendsRanked |
| N.coreAbility | 能力押注 | N.coreAbility |
| N.insightExplain | 趋势洞察 | N.insightExplain |
| N.insightConnect | 家底关联 | N.insightConnect |
| N.insightGap | 现状差距 | N.insightGap |

**W 模块**（13 facts）：

| fact ID | label | 来源字段 | 报告用途 |
|---------|-------|---------|---------|
| W.story | 情感地标故事 | W.story | 背景 |
| W.storyPriorityTag | 故事归因 | W.storyPriorityTag | 兼容旧数据（已废弃，不再采集） |
| W.heroTraits | 英雄基因 | W.heroTraits | 交叉分析 |
| W.coreCode | 家风内核 | W.coreCode（拼为 name+definition） | 核心素材 |
| W.tradeoffChoices | 取舍倾向 | W.tradeoffChoices（格式化为"在X vs Y上更偏向Z"） | tension_resolve |
| W.flipsideTags | 家风副作用 | W.flipsideTags | strength_risk |
| W.flipsideBenefit | 家风好处 | W.flipsideBenefit | 交叉分析 |
| W.flipsideCost | 家风代价 | W.flipsideCost | 交叉分析 |
| W.upgradeKeep | 升级保留 | W.upgradeKeep | tension_resolve |
| W.upgradeReduce | 升级减少 | W.upgradeReduce | tension_resolve |
| W.upgradeFrom | 升级起点 | W.upgradeFrom | tension_resolve |
| W.upgradeTo | 升级方向 | W.upgradeTo | tension_resolve |
| W.finalStatement | 升级宣言 | W.finalStatement | 愿景生成 |

**E 模块**（5~9 facts，取决于单人/双人）：

| fact ID | label | 来源字段 | 条件 |
|---------|-------|---------|------|
| E.anchors | 直觉锚点 | E.anchors（格式化为自然语言） | 始终 |
| E.coreValues | 核心价值观 | E.coreValues | 始终 |
| E.deferredValues | 战略暂缓 | E.deferredValues | 始终 |
| E.direction | 战略方向 | E.direction | 始终 |
| E.directionReason | 方向理由 | E.directionReason | 始终 |
| E.selfCore | 我的核心价值观 | E.selfCore | 仅双人 |
| E.selfDeferred | 我的战略暂缓 | E.selfDeferred | 仅双人 |
| E.partnerCore | 伴侣的核心价值观 | E.partnerCore | 仅双人 |
| E.partnerDeferred | 伴侣的战略暂缓 | E.partnerDeferred | 仅双人 |

#### 报告 AI 生成内容

**insights（5 条）**：
1. opportunity_match（S×N）：机遇匹配
2. tension_resolve（W×N）：矛盾化解（引用 W.upgradeKeep/To、W.tradeoffChoices）
3. philosophy_anchor（E×S×W）：哲学锚定（引用 E.directionReason）
4. strength_risk：优势与风险（引用 W.flipsideTags）
5. strategic_summary：一句话战略定位

**drafts（3 个）**：
1. vision_statement：一句话教育战略宣言（3 个版本）
2. action_plan_90d：90天行动计划（2 个版本）
3. conversation_scripts：家庭沟通脚本（3 个场景）

#### 报告单人/双人措辞规则

- 双人（facts 中存在 E.selfCore + E.partnerCore）：可分析差异与共识，使用"你们"
- 单人（不存在这些字段）：使用"你的价值选择"，不提"伴侣"或"双方共识"

---

## 四、数据结构参考（CompassDataSchema）

```typescript
interface CompassDataSchema {
  familyCode?: TrackedField<string>;

  S?: {
    capitalMatrix?: TrackedField<{ label: string; level: string; keyword: string }[]>;
    capitalSummaryAgreed?: TrackedField<boolean>;
    capitalRationale?: TrackedField<string>;
    priorityUpgrade?: TrackedField<string>;
    snapshot?: TrackedField<string>;
  };

  N?: {
    trendsRanked?: TrackedField<string[]>;
    coreAbility?: TrackedField<string>;
    insightExplain?: TrackedField<string>;
    insightConnect?: TrackedField<string>;
    insightGap?: TrackedField<string>;
    agreeDisagree?: TrackedField<{ agreed: boolean; reasons?: string[]; detail?: string }>;
    snapshot?: TrackedField<string>;
  };

  W?: {
    story?: TrackedField<string>;
    storyPriorityTag?: TrackedField<string>;           // @deprecated 不再采集
    tradeoffChoices?: TrackedField<{ axisId: string; labelA: string; labelB: string; choice: "A" | "B" }[]>;
    heroTraits?: TrackedField<string[]>;
    quoteChildhood?: TrackedField<string>;              // 未被报告消费
    quoteNow?: TrackedField<string>;                    // 未被报告消费
    quoteThemeTag?: TrackedField<string>;               // 未被报告消费
    coreCode?: TrackedField<{ name: string; definition: string; userEdited?: boolean }>;
    flipsideTags?: TrackedField<string[]>;
    flipsideExample?: TrackedField<string>;             // 未被报告消费
    flipsideBenefit?: TrackedField<string>;
    flipsideCost?: TrackedField<string>;
    upgradeKeep?: TrackedField<string>;
    upgradeReduce?: TrackedField<string>;
    upgradeFrom?: TrackedField<string>;
    upgradeTo?: TrackedField<string>;
    finalStatement?: TrackedField<string>;
    snapshot?: TrackedField<string>;
  };

  E?: {
    anchors?: TrackedField<{ gift_to_child: string; fear_child_lacks: string }>;
    selfCore?: TrackedField<string[]>;
    selfDeferred?: TrackedField<string[]>;
    partnerCore?: TrackedField<string[]>;
    partnerDeferred?: TrackedField<string[]>;
    partnerSkipped?: TrackedField<boolean>;
    coreValues?: TrackedField<string[]>;                // 最终共识（下游消费）
    deferredValues?: TrackedField<string[]>;            // 最终共识（下游消费）
    agreeDisagree?: TrackedField<string>;               // 未被报告消费
    direction?: TrackedField<string>;
    directionReason?: TrackedField<string>;
    snapshot?: TrackedField<string>;
  };
}
```

---

## 五、AI 行为规范

> 核心规范与原版一致。以下列出 server.js 中的实际 prompt 指令。

### 通用规范

| 规范 | 说明 |
|------|------|
| 每次只问一件事 | 不堆积问题 |
| 不重复卡片内容 | 说"请在卡片中选择"即可，不列出选项 |
| 每段不超过 3 句 | 保持简洁，自然口吻 |
| 不用列表/bullet | 对话感，不是报告感 |
| AI 不替用户做价值选择 | 理解、追问、提炼、给 hint，选择权在用户 |
| 快照 = 判断句沉淀 | 对应 Word 模板的每个空 |

### 各节点 AI prompt（server.js 实际配置）

| nodeId | prompt 要点 |
|--------|------------|
| S-04 | 追问评估逻辑 |
| S-06 | 顾问式点评 + 过渡到优先级选择 |
| S-08 | 解读选择 → 生成快照（`<!--SNAPSHOT:...-->`） |
| N-01 | 从家底过渡到眼光 |
| E-01 | 引导直觉锚定 |
| E-03 | 接住直觉 → 过渡到画廊 |
| E-05 | 分析选择模式 + 双人模式下分析交集/差异/张力 |
| E-08 | 汇总共识快照：整合锚点/价值观/双人差异/方向理由 |

### 结构化数据输出

| 标记 | 使用节点 | 说明 |
|------|---------|------|
| `<!--DATA:{...}-->` | W-03 | 取舍轴 + 英雄特质 |
| `<!--DATA:{...}-->` | W-07 | 家风内核候选 |
| `<!--DATA:{...}-->` | W-09 | 副作用建议 |
| `<!--SNAPSHOT:...-->` | S-08, E-08 | AI 生成快照 |
| `<!--READY-->` | W-01 | 多轮对话推进信号 |

### 快照生成方式汇总

| 模块 | 生成方式 | 函数/标记 |
|------|---------|----------|
| S | AI 生成 | `<!--SNAPSHOT:...-->` |
| N | 前端模板 | `generateSnapshotFromFields(data, "N")` |
| W | 前端模板 | `generateSnapshotFromFields(data, "W")` |
| E | AI 生成 | `<!--SNAPSHOT:...-->` |

---

## 六、数据流总览

```
S-01 资本自评 → S-02 确认 → S-03 AI追问 → S-04 优先升级 → S-05 家底快照(AI)
                                                                    ↓
N-01 趋势排序 → N-02 AI转译→能力 → N-03 同意/不同意 → N-04 眼光快照(模板)
                                                                    ↓
W-01 AI多轮故事 → W-02 故事卡片 → W-03 AI提取→取舍→英雄→口头禅
  (2-4轮)                                              ↓
                                            W-04 AI候选→命名卡片
                                                        ↓
                                            W-05 AI建议→副作用卡片
                                                        ↓
                                            W-06 升级路径卡片
                                                        ↓
                                            W-07 宣言+根基快照(模板)
                                                        ↓
E-01 直觉锚定 → E-02 价值观画廊 ─┬─ 单人确认 ─┐
                                 └─ 双人→共识 ─┘
                                        ↓
                               E-03 AI分析 → E-04 方向+理由 → E-05 共识快照(AI)
                                                                        ↓
                                                              FINAL 罗盘报告
                                                     (26~30 facts → 5 insights + 3 drafts)
```

---

## 七、MVP 偏差汇总

以下为本轮开发中所有已识别并接受的产品级偏差。

| # | 位置 | 偏差内容 | 原因 | 日期 |
|---|------|---------|------|------|
| 1 | W-03 | 英雄特质 AI 动态生成不稳定，依赖 fallback | Haiku 对 hero_traits 字段输出不稳定，fallback + 自定义兜底 | 2026-03-18 |
| 2 | W-04 | 保留 definition 字段，未新增 reason 字段 | 当前交互已满足用户自主命名，reason 由上下文间接覆盖 | 2026-03-18 |
| 3 | W-05 | 单 AI + 卡片，未实现多轮分场景副作用诊断 | MVP 优先流程完整性，多轮深挖作为后续增强 | 2026-03-18 |
| 4 | W-07 | Word 第 2 空用 definition 近似替代 value_root | 未引入 AI 辅助 value_root 生成，避免扩大改动面 | 2026-03-18 |
| 5 | E-01 | 单人填写，未实现规格要求的双人分别锚定 | 双人能力集中在 E-02 实现，直觉锚定单人已满足 | 2026-03-18 |
| 6 | E-03 | AI 双人分析依赖 prompt 条件分支遵循率 | 数据通路已打通，行为质量属 prompt 调优范畴 | 2026-03-18 |
| 7 | FINAL | W.storyPriorityTag 已废弃但仍在报告中 | 兼容旧数据，不做清理式删除 | 2026-03-18 |
| 8 | FINAL | 部分字段未被报告消费（W.quote*、W.flipsideExample、E.agreeDisagree） | 当前优先补齐高价值字段，低优先字段后续按需接入 | 2026-03-18 |
