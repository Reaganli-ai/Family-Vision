// Conversation flow definition based on PRD
// Each step has a sequence of nodes: AI message, card, user input

export type CardType = "capital-matrix" | "capital-summary" | "single-select" | "tag-select" | "keyword-fill" | "snapshot" | "short-text" | "value-gallery" | "priority-select" | "agree-disagree" | "spirit-upgrade" | "trend-rank" | "ability-select" | "story-input" | "tradeoff-choice" | "hero-select" | "quote-fill" | "core-code-confirm" | "flipside-fill" | "upgrade-path";

export interface CardNode {
  type: "card";
  cardType: CardType;
  cardProps: Record<string, unknown>;
}

export interface AINode {
  type: "ai";
  // AI generates this dynamically based on context
}

export interface UserNode {
  type: "user";
}

export type FlowNode = CardNode | AINode | UserNode;

export interface StepFlow {
  id: string;
  label: string;
  direction: string;
  subtitle: string;
  nodes: FlowNode[];
}

export const FLOW: StepFlow[] = [
  {
    id: "S",
    label: "我们的家底",
    direction: "S",
    subtitle: "我们有什么资源？",
    nodes: [
      { type: "ai" },                          // S-01: 开场引导
      {                                         // S-02: 资本矩阵卡
        type: "card",
        cardType: "capital-matrix",
        cardProps: {},
      },
      {                                         // S-03: 确定性总结 + 符合/不符合
        type: "card",
        cardType: "capital-summary",
        cardProps: {},
      },
      { type: "ai" },                          // S-04: AI 追问评估逻辑
      { type: "user" },                        // S-05: 用户打字阐述逻辑
      { type: "ai" },                          // S-06: AI 点评 + 过渡到优先级
      {                                         // S-07: 战略优先级选择
        type: "card",
        cardType: "priority-select",
        cardProps: {
          question: "接下来几年，你们最想优先升级哪项资本？",
          hint: "只选 1 个战略重点，集中力量办大事",
          options: [
            { label: "经济资本", subtitle: "增加家庭选择权——理财、收入结构、教育预算" },
            { label: "文化资本", subtitle: "让认知成为竞争力——阅读、见识、思维方式" },
            { label: "社会资本", subtitle: "用连接撬动资源——人脉、社区、合作网络" },
          ],
          unsureExplain: [
            {
              title: "经济资本",
              meaning: "家庭的财务安全垫和选择自由度",
              actions: [
                "优化家庭收入结构，增加被动收入",
                "建立教育专项基金，避免临时决策",
                "提升财务素养，让孩子从小理解钱",
              ],
            },
            {
              title: "文化资本",
              meaning: "家庭的知识储备和认知水平",
              actions: [
                "建立家庭阅读和讨论的习惯",
                "拓展孩子的见识（旅行、展览、行业接触）",
                "提升父母自身的学习能力和思维框架",
              ],
            },
            {
              title: "社会资本",
              meaning: "家庭的外部连接和资源网络",
              actions: [
                "主动参与社区、学校、行业组织",
                "帮孩子建立多元的同伴和导师关系",
                "打开信息渠道，不靠运气靠网络",
              ],
            },
          ],
          commentPlaceholder: "比如：我们最近正好在考虑换工作/搬家/让孩子转学……",
        },
      },
      { type: "ai" },                          // S-08: AI 生成快照内容
      {                                         // S-09: 快照预览
        type: "card",
        cardType: "snapshot",
        cardProps: { title: "你们的家底快照" },
      },
    ],
  },
  {
    id: "N",
    label: "我们的眼光",
    direction: "N",
    subtitle: "世界往哪走？",
    nodes: [
      { type: "ai" },                          // N-01: 开场引导
      {                                         // N-02: Top 3 趋势排序
        type: "card",
        cardType: "trend-rank",
        cardProps: {},
      },
      { type: "ai" },                          // N-03: 接住趋势选择 + 过渡到能力
      {                                         // N-04: 两级素养选择
        type: "card",
        cardType: "ability-select",
        cardProps: {},
      },
      { type: "ai" },                          // N-05: 诊断三段论（template_based，由前端生成）
      {                                         // N-06: 结构化确认
        type: "card",
        cardType: "agree-disagree",
        cardProps: {
          disagreePlaceholder: "你觉得哪里不对？比如：我们更看重的其实是……",
        },
      },
      { type: "ai" },                          // N-07: 汇总（template_based 快照内容）
      {                                         // N-08: 快照预览
        type: "card",
        cardType: "snapshot",
        cardProps: { title: "你们的眼光快照" },
      },
    ],
  },
  {
    id: "W",
    label: "我们的根基",
    direction: "W",
    subtitle: "家族的底层逻辑",
    nodes: [
      { type: "ai" },                          // W-01: 开场引导
      {                                         // W-02: 故事采集（Q1 + Q1b）
        type: "card",
        cardType: "story-input",
        cardProps: {},
      },
      { type: "ai" },                          // W-03: 接住故事 → 动态选轴（输出 DATA）
      {                                         // W-04: 二选一取舍（Q2，props 由 W-03 DATA 注入）
        type: "card",
        cardType: "tradeoff-choice",
        cardProps: {},
      },
      {                                         // W-05: 英雄原型（Q3）
        type: "card",
        cardType: "hero-select",
        cardProps: {},
      },
      {                                         // W-06: 口头禅双引号（Q4）
        type: "card",
        cardType: "quote-fill",
        cardProps: {},
      },
      { type: "ai" },                          // W-07: 综合 Q1-Q4 → 提炼候选（输出 DATA）
      {                                         // W-08: 命名确认
        type: "card",
        cardType: "core-code-confirm",
        cardProps: {},
      },
      { type: "ai" },                          // W-09: 确认命名 → 引出 flip side
      {                                         // W-10: Flip side 填写
        type: "card",
        cardType: "flipside-fill",
        cardProps: {},
      },
      {                                         // W-11: 升级路径
        type: "card",
        cardType: "upgrade-path",
        cardProps: {},
      },
      { type: "ai" },                          // W-12: 模板生成 final statement（template_based）
      {                                         // W-13: 快照确认
        type: "card",
        cardType: "snapshot",
        cardProps: { title: "你们的根基快照" },
      },
    ],
  },
  {
    id: "E",
    label: "我们的共识",
    direction: "E",
    subtitle: "教育的底线和方向",
    nodes: [
      { type: "ai" },                          // E-01: 开场引导
      {                                         // E-02: 关键词填写
        type: "card",
        cardType: "keyword-fill",
        cardProps: {
          fields: [
            { label: "如果只能给孩子一样东西，你最希望他拥有", placeholder: "凭直觉写，如：独立思考、善良、内心强大……" },
            { label: "你最害怕孩子长大后缺少什么", placeholder: "不用想太多，如：抗压能力、自信、共情力……" },
          ],
        },
      },
      { type: "ai" },                          // E-03: 接住直觉
      {                                         // E-04: 价值观画廊
        type: "card",
        cardType: "value-gallery",
        cardProps: {},
      },
      { type: "ai" },                          // E-05: 分析选择模式 + 追问
      {                                         // E-06: 用户确认/回复
        type: "card",
        cardType: "agree-disagree",
        cardProps: {
          disagreePlaceholder: "你觉得哪里不对？比如：我们其实更看重的是……",
        },
      },
      {                                         // E-07: 战略方向单选
        type: "card",
        cardType: "single-select",
        cardProps: {
          question: "你们家的教育战略方向更偏向哪一个？",
          options: ["内核 · 向内探索、夯实自我，让孩子先认识自己", "创造 · 向外开拓、定义新事物，鼓励孩子去创造", "连接 · 搭建关系、成就他人，培养孩子的社会力"],
          reasonPlaceholder: "因为我们相信，最终能让孩子获得幸福与成就的，是……",
        },
      },
      { type: "ai" },                          // E-08: 汇总
      {                                         // E-09: 快照预览
        type: "card",
        cardType: "snapshot",
        cardProps: { title: "你们的共识快照" },
      },
    ],
  },
];
