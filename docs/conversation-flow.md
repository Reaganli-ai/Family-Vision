# 当前对话流程完整梳理

> 导出时间：2026-03-08
> 来源文件：`src/lib/flow.ts`

---

## 总览

| 模块 | ID | 标题 | 方向 | 节点数 | 核心交互 |
|---|---|---|---|---|---|
| 1 | S | 我们的家底 | 南 | 9 | 资本矩阵打分 → 确认 → AI追问逻辑 → 用户阐述 → AI点评 → 优先级选择 → 快照 |
| 2 | N | 我们的眼光 | 北 | 8 | Top 3 趋势排序 → AI过渡 → 能力押注 → 模板诊断 → 确认 → 模板快照 → 快照 |
| 3 | W | 我们的根基 | 西 | 10 | 家族故事 → AI 命名 → 确认 → 精神升级 → 用户回复 → 快照 |
| 4 | E | 我们的共识 | 东 | 9 | 直觉填写 → 价值观画廊 → 确认 → 方向单选 → 快照 |

---

## 模块 1：S — 我们的家底（9 节点）

| 序号 | 节点ID | 类型 | 卡片类型 | 用户做什么 | 数据写入 compass_data |
|---|---|---|---|---|---|
| 0 | S-01 | ai | — | 听 AI 开场引导 | — |
| 1 | S-02 | card | `capital-matrix` | 给经济/文化/社会资本打 L1-L3 + 关键词 | `S.capitalMatrix` (user_selected) |
| 2 | S-03 | card | `capital-summary` | 看 AI 总结，选"符合"或"不符合"+补充 | `S.capitalSummaryAgreed` (user_selected) |
| 3 | S-04 | ai | — | AI 追问：你做出这个评估的逻辑是什么？ | — |
| 4 | S-05 | user | — | 用户打字阐述评估逻辑 | `S.capitalRationale` (user_typed) |
| 5 | S-06 | ai | — | AI 顾问式点评 + 过渡到优先级选择 | — |
| 6 | S-07 | card | `priority-select` | 选择优先升级哪项资本（1个）+ 可选补充 | `S.priorityUpgrade` (user_selected) |
| 7 | S-08 | ai | — | AI 生成快照内容 | — |
| 8 | S-09 | card | `snapshot` | 确认/编辑快照 | `S.snapshot` (ai_inferred) |

**用户输入汇总**：资本矩阵(3×3)、是否同意总结、评估逻辑（文本）、优先升级选择、快照确认

---

## 模块 2：N — 我们的眼光（8 节点）

| 序号 | 节点ID | 类型 | 卡片类型 | 用户做什么 | 数据写入 compass_data |
|---|---|---|---|---|---|
| 0 | N-01 | ai | — | AI 开场引导 | — |
| 1 | N-02 | card | `trend-rank` | 从 15 个趋势中点击选出 Top 3（主假设+2对冲） | `N.trendsRanked` (user_selected) |
| 2 | N-03 | ai | — | AI 接住趋势排序，分析战略判断逻辑，过渡到能力 | — |
| 3 | N-04 | card | `ability-select` | 两级选择：先选能力域（6个），再选具体能力（24选1） | `N.coreAbility` (user_selected) |
| 4 | N-05 | template | — | 前端生成诊断三段论（趋势洞察+家底关联+现状差距） | `N.insightExplain/Connect/Gap` (template_based) |
| 5 | N-06 | card | `agree-disagree` | 同意或不同意诊断分析 | `N.agreeDisagree` (user_selected) |
| 6 | N-07 | template | — | 前端生成模板快照 | `N.snapshot` (template_based) |
| 7 | N-08 | card | `snapshot` | 确认/编辑快照 | `N.snapshot` (template_based) |

**关键设计**：N-05 和 N-07 不调用 AI，由 `n-diagnostic.ts` 模板引擎生成。确保"零新事实"——所有内容均来自用户选择 + 预写模板。

**用户输入汇总**：趋势排序(Top 3)、能力押注(1个)、同意/不同意诊断、快照确认

---

## 模块 3：W — 我们的根基（10 节点）

| 序号 | 节点ID | 类型 | 卡片类型 | 用户做什么 | 数据写入 compass_data |
|---|---|---|---|---|---|
| 0 | W-01 | ai | — | 听 AI 开场引导 | — |
| 1 | W-02 | card | `short-text` | 写一段家族故事/瞬间 | `W.story` (user_typed) |
| 2 | W-03 | ai | — | AI 命名核心精神 + 追问 | — |
| 3 | W-04 | card | `agree-disagree` | 同意或修正 AI 的命名 | `W.agreeDisagree` (user_selected) |
| 4 | W-05 | ai | — | AI 引导战略诊断 | — |
| 5 | W-06 | card | `spirit-upgrade` | 填写：核心精神、从「旧」→ 到「新」 | `W.spiritUpgrade` (user_selected) |
| 6 | W-07 | ai | — | AI 追问可操作性（动态场景） | — |
| 7 | W-08 | user | — | 用户自由回复 | `W.userReflection` (user_typed) |
| 8 | W-09 | ai | — | AI 汇总 | — |
| 9 | W-10 | card | `snapshot` | 确认/编辑快照 | `W.snapshot` (ai_inferred) |

**用户输入汇总**：家族故事(文本)、同意/修正、精神升级三件套、自由回复、快照确认

---

## 模块 4：E — 我们的共识（9 节点）

| 序号 | 节点ID | 类型 | 卡片类型 | 用户做什么 | 数据写入 compass_data |
|---|---|---|---|---|---|
| 0 | E-01 | ai | — | 听 AI 开场引导 | — |
| 1 | E-02 | card | `keyword-fill` | 填"最希望孩子拥有"+"最怕孩子缺少" | `E.anchors` (user_typed) |
| 2 | E-03 | ai | — | AI 接住直觉 | — |
| 3 | E-04 | card | `value-gallery` | 从价值观画廊选核心+暂缓 | `E.coreValues` + `E.deferredValues` (user_selected) |
| 4 | E-05 | ai | — | AI 分析选择模式 + 追问 | — |
| 5 | E-06 | card | `agree-disagree` | 同意或不同意 | `E.agreeDisagree` (user_selected) |
| 6 | E-07 | card | `single-select` | 选战略方向：内核/创造/连接 | `E.direction` (user_selected) |
| 7 | E-08 | ai | — | AI 汇总 | — |
| 8 | E-09 | card | `snapshot` | 确认/编辑快照 | `E.snapshot` (ai_inferred) |

**用户输入汇总**：直觉锚点(2个填空)、核心/暂缓价值观、同意/不同意、方向选择、快照确认

---

## 数据结构汇总（compass_data.data）

```
CompassDataSchema {
  familyCode          — user_typed    — string

  S.capitalMatrix     — user_selected — [{label, level, keyword}]
  S.capitalSummaryAgreed — user_selected — boolean
  S.capitalRationale  — user_typed    — string
  S.priorityUpgrade   — user_selected — string
  S.snapshot          — ai_inferred   — string

  N.trendsRanked      — user_selected — string[] (Top 3: [主假设, 对冲1, 对冲2])
  N.coreAbility       — user_selected — string (单个能力)
  N.insightExplain    — template_based — string (趋势洞察)
  N.insightConnect    — template_based — string (家底关联)
  N.insightGap        — template_based — string (现状差距)
  N.agreeDisagree     — user_selected — {agreed, reasons?, detail?}
  N.snapshot          — template_based — string

  W.story             — user_typed    — string
  W.agreeDisagree     — user_selected — string
  W.spiritUpgrade     — user_selected — {spirit, from, to}
  W.userReflection    — user_typed    — string
  W.snapshot          — ai_inferred   — string

  E.anchors           — user_typed    — {gift_to_child, fear_child_lacks}
  E.coreValues        — user_selected — string[]
  E.deferredValues    — user_selected — string[]
  E.agreeDisagree     — user_selected — string
  E.direction         — user_selected — string
  E.snapshot          — ai_inferred   — string
}
```

---

## 对话流程图（简化）

```
[欢迎语] → [家庭代号卡]
    ↓
S: AI引导 → 资本矩阵 → AI总结确认 → AI追问逻辑 → 用户阐述 → AI点评 → 优先升级 → AI快照 → 确认
    ↓
N: AI引导 → Top3趋势排序 → AI过渡 → 能力押注 → [模板诊断] → 同意? → [模板快照] → 确认
    ↓
W: AI引导 → 家族故事 → AI命名 → 同意? → AI诊断 → 精神升级 → AI追问 → 用户回复 → AI汇总 → 确认
    ↓
E: AI引导 → 直觉填空 → AI接住 → 价值观画廊 → AI分析 → 同意? → 方向选择 → AI汇总 → 确认
    ↓
[导出罗盘报告]（战略推演由 Report Agent 在报告生成时完成）
```

---

## N 模块诊断引擎（n-diagnostic.ts）

模板引擎包含：
- **TREND_INSIGHTS**：15 个趋势 × 3 维度（challenge, abilityLink, per-capital advantage/risk）
- **ABILITY_DOMAIN_MAP**：24 个能力 → 6 个能力域的反向映射
- **TREND_DOMAIN_HINTS**：每个趋势推荐的 2 个能力域（用于 AI hint）
- **generateDiagnostic()**：输入(topTrend, coreAbility, capitalMatrix, priorityUpgrade) → 输出(explain, connect, gap)
- **getDomainHint()**：输入(topTrend) → 输出能力选择卡的 AI 提示文本
