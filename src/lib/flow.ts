// Conversation flow definition based on PRD
// Each step has a sequence of nodes: AI message, card, user input

export type CardType = "capital-matrix" | "capital-summary" | "single-select" | "tag-select" | "keyword-fill" | "snapshot" | "short-text" | "value-gallery" | "priority-select" | "agree-disagree" | "spirit-upgrade" | "opt-in" | "deep-dive";

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
      {                                         // S-04: 可选深挖
        type: "card",
        cardType: "opt-in",
        cardProps: {
          title: "想进一步思考吗？",
          description: "下面有一道关于资本转化的深挖题，帮你看清资源之间的隐藏联系。跳过也不影响后续流程。",
          confirmText: "我愿意想一想",
          skipText: "跳过，直接继续",
        },
      },
      // S-05: deep-dive（仅 opt-in 后才显示，由 handleCardConfirm 控制跳过）
      {
        type: "card",
        cardType: "deep-dive",
        cardProps: {
          questions: [
            {
              question: "你们家的文化资本（阅读、讨论、见识）有没有转化成社会连接？",
              options: [
                "有明显转化：通过知识结识了不少人",
                "有一些但不多：偶尔因此认识新朋友",
                "几乎没有：阅读讨论主要在家庭内部",
                "没想过这个角度",
              ],
              commentPlaceholder: "比如：因为读书会认识了几个家长……",
            },
          ],
        },
      },
      {                                         // S-06: 战略优先级选择
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
      { type: "ai" },                          // S-07: AI 生成快照内容
      {                                         // S-08: 快照预览
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
      {                                         // N-02: 标签选择（趋势）
        type: "card",
        cardType: "tag-select",
        cardProps: {
          question: "未来 10 年，哪个趋势最会影响你的孩子？",
          subtitle: "不需要选「最正确的」，选你们家最在意的那一个",
          tags: ["AI替代执行岗", "全球竞争合作", "心理健康重要性上升", "创造力成为硬通货", "终身学习常态化", "虚拟与现实融合"],
          maxSelect: 1,
          selectHint: "只选 1 个作为你们的战略判断",
          customPlaceholder: "写一个你观察到的趋势，比如「大城市内卷加剧」",
          confirmText: "确认判断 →",
        },
      },
      { type: "ai" },                          // N-03: 分析，引出素养
      {                                         // N-04: 标签选择（素养）
        type: "card",
        cardType: "tag-select",
        cardProps: {
          question: "面对这个趋势，你最想让孩子拥有什么能力？",
          subtitle: "其他能力也重要，但如果只能押注一个——选哪个？",
          tags: ["复杂问题解决", "批判性思维", "创造力", "同理心", "韧性", "自我驱动学习", "人机协作", "跨文化沟通"],
          maxSelect: 1,
          selectHint: "只选 1 个作为战略重点",
          customPlaceholder: "比如「能把一件事做到极致的专注力」",
          confirmText: "确认重点 →",
        },
      },
      { type: "ai" },                          // N-05: 交叉分析 + 追问
      {                                         // N-06: 用户确认/回复
        type: "card",
        cardType: "agree-disagree",
        cardProps: {
          disagreePlaceholder: "你觉得哪里不对？比如：我们更看重的其实是……",
        },
      },
      { type: "ai" },                          // N-07: 汇总
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
      {                                         // W-02: 短文填写
        type: "card",
        cardType: "short-text",
        cardProps: {
          question: "回忆一个让你感受到「我们家就会这么办」的瞬间或故事",
          placeholder: "比如：有一次爷爷遇到困难，他选择了……这件事让全家人都记住了……",
        },
      },
      { type: "ai" },                          // W-03: 命名 + 追问
      {                                         // W-04: 用户确认/修正
        type: "card",
        cardType: "agree-disagree",
        cardProps: {
          disagreePlaceholder: "哪里不准确？比如：我觉得我们家的核心精神更像是……",
        },
      },
      { type: "ai" },                          // W-05: 引导战略诊断
      {                                         // W-06: 精神继承与升级
        type: "card",
        cardType: "spirit-upgrade",
        cardProps: {},
      },
      { type: "ai" },                          // W-07: 追问可操作性
      { type: "user" },                        // W-08: 用户回复
      { type: "ai" },                          // W-09: 汇总
      {                                         // W-10: 快照预览
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
