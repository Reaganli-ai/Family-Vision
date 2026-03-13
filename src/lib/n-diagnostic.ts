/**
 * N Module Diagnostic Engine — template-based, zero AI.
 *
 * Generates the "So What" three-part diagnosis:
 *   1. Explain: Why this trend matters
 *   2. Connect: How it relates to this family's capital data
 *   3. Gap: What's the current advantage vs. shortcoming
 *
 * All content comes from pre-written templates + structured field substitution.
 */

// ─── Trend Insight Templates ─────────────────────────

interface TrendInsight {
  challenge: string;      // What this trend means for kids
  abilityLink: string;    // Why ability matters under this trend
  highCapitalAdvantage: Record<string, string>;  // capital label → advantage text
  lowCapitalRisk: Record<string, string>;        // capital label → risk text
}

const TREND_INSIGHTS: Record<string, TrendInsight> = {
  "AI 替代执行岗": {
    challenge: "重复性脑力劳动正在被自动化取代，孩子未来的竞争力不在于「会做什么」，而在于「能想什么、能创造什么」",
    abilityLink: "在 AI 时代，这个能力决定了孩子是被工具替代，还是驾驭工具",
    highCapitalAdvantage: {
      "经济资本": "经济基础让你们有余力为孩子提供更多探索空间，而不是只追求短期应试",
      "文化资本": "家庭的知识氛围能帮孩子建立 AI 难以替代的深度思考能力",
      "社会资本": "社会连接能让孩子提前接触真实行业场景，理解 AI 正在改变什么",
    },
    lowCapitalRisk: {
      "经济资本": "经济压力可能让教育投入偏向短期回报（应试），错过对创造力的长线投资",
      "文化资本": "如果家庭缺少深度阅读和讨论的氛围，孩子容易停留在 AI 可替代的执行层面",
      "社会资本": "信息渠道有限，可能对 AI 趋势的感知滞后，错过提前准备的窗口期",
    },
  },
  "人机协作常态化": {
    challenge: "会用 AI 的人将淘汰不会用的人，未来的核心不是与 AI 竞争，而是学会与 AI 协作",
    abilityLink: "这个能力决定了孩子在人机协作时代的位置——是指挥者还是被边缘化的旁观者",
    highCapitalAdvantage: {
      "经济资本": "有资源让孩子更早接触和实践 AI 工具，建立直觉和经验",
      "文化资本": "认知深度决定了孩子能否提出好问题——这是人机协作中人最不可替代的部分",
      "社会资本": "多元连接能帮孩子在不同场景中实践人机协作，而不只是在课堂里",
    },
    lowCapitalRisk: {
      "经济资本": "可能缺少让孩子动手体验 AI 工具的条件，导致认知停留在概念层面",
      "文化资本": "如果缺少批判性思维的训练，孩子容易对 AI 产出照单全收",
      "社会资本": "圈子有限可能导致信息茧房，对技术变化的感知不够敏锐",
    },
  },
  "注意力成稀缺资源": {
    challenge: "信息过载下，深度思考能力正在断崖式下降——能专注的人将成为稀缺人才",
    abilityLink: "在注意力碎片化的时代，这个能力是孩子建立深度竞争力的地基",
    highCapitalAdvantage: {
      "经济资本": "有条件为孩子创造低干扰的学习环境和优质注意力训练资源",
      "文化资本": "家庭的阅读和讨论习惯本身就是对抗注意力碎片化的最好训练",
      "社会资本": "好的社交圈能帮孩子建立「深度交流」的习惯，对抗浅层社交",
    },
    lowCapitalRisk: {
      "经济资本": "经济压力下容易依赖屏幕看管孩子，加速注意力碎片化",
      "文化资本": "缺少深度阅读氛围，孩子更容易被短视频和碎片信息俘获",
      "社会资本": "如果周围的孩子都在刷手机，缺乏正向同伴影响来抵抗潮流",
    },
  },
  "终身职业消失": {
    challenge: "一份工作干到退休的时代已经结束，孩子需要适应不断转换角色和技能的人生",
    abilityLink: "在职业不断迭代的时代，这个能力是孩子持续创造价值的底层操作系统",
    highCapitalAdvantage: {
      "经济资本": "经济安全垫让孩子有试错的空间，不必因恐惧而固守一条路",
      "文化资本": "学习能力和认知弹性是职业转型最核心的底层资本",
      "社会资本": "广泛的人脉能提供职业转型时的信息、机会和支持网络",
    },
    lowCapitalRisk: {
      "经济资本": "缺少安全垫意味着职业选择更保守，容易错过转型窗口",
      "文化资本": "如果学习习惯没建立好，职业转型的心理和能力门槛会很高",
      "社会资本": "信息闭塞可能导致看不到新机会，只能在有限选项中被动选择",
    },
  },
  "创业自雇比例上升": {
    challenge: "打工不再是唯一安全选项，越来越多人需要具备「为自己创造价值」的能力",
    abilityLink: "创业和自雇时代需要的不只是技能，更是这种底层能力来支撑长期的不确定性",
    highCapitalAdvantage: {
      "经济资本": "家庭资源可以成为孩子未来创业的第一桶金和安全网",
      "文化资本": "创业需要的跨领域知识、判断力和学习能力，文化资本是最好的投资",
      "社会资本": "创业的本质是资源整合，社会连接越广，机会越多",
    },
    lowCapitalRisk: {
      "经济资本": "缺少经济缓冲，冒险成本太高，可能被迫走保守路线",
      "文化资本": "创业需要独立判断和快速学习，文化积累不足会导致决策质量低",
      "社会资本": "没有人脉支持的创业非常孤独，获取资源和信息的成本极高",
    },
  },
  "阶层流动收窄": {
    challenge: "教育投资回报率持续分化，起跑线不同的孩子面对的机会结构越来越不一样",
    abilityLink: "在阶层固化趋势下，这个能力能帮孩子在有限的机会窗口中把握住关键转折点",
    highCapitalAdvantage: {
      "经济资本": "经济优势意味着更多教育选择权，能为孩子匹配更好的成长环境",
      "文化资本": "认知优势是最难被阶层壁垒阻挡的——知识和思维方式可以代际传递",
      "社会资本": "社会连接是穿透阶层壁垒最有力的工具，一个好的引路人胜过十年苦读",
    },
    lowCapitalRisk: {
      "经济资本": "经济劣势意味着教育选择空间更小，需要更精准地分配有限资源",
      "文化资本": "缺少认知引导，孩子可能看不到更大的世界，自我设限",
      "社会资本": "圈层封闭是阶层固化的加速器——看不到可能性，就无法突破",
    },
  },
  "多元价值观碰撞": {
    challenge: "「正确答案」越来越少，孩子需要在价值观冲突中找到自己的判断锚点",
    abilityLink: "当外部标准不再可靠时，这个能力是孩子在混乱中保持方向感的内在罗盘",
    highCapitalAdvantage: {
      "经济资本": "经济安全感让家庭有底气不随波逐流，坚持自己认为对的教育方式",
      "文化资本": "丰富的文化积累帮孩子建立多元视角，而不是非黑即白地看世界",
      "社会资本": "多元的社交网络本身就是价值观训练的最好课堂",
    },
    lowCapitalRisk: {
      "经济资本": "经济压力可能让家庭更关注「有用」而非「有意义」，价值观讨论被搁置",
      "文化资本": "如果家庭缺少开放讨论的氛围，孩子容易被单一信息源洗脑",
      "社会资本": "同质化社交圈会加固偏见，削弱多元思考能力",
    },
  },
  "全球化与本土化并行": {
    challenge: "孩子既要有全球视野，又要有扎实的本土身份认同——这两者的平衡是新时代的关键课题",
    abilityLink: "在全球化与本土化的张力中，这个能力帮孩子在两个世界之间自如切换",
    highCapitalAdvantage: {
      "经济资本": "有条件让孩子通过旅行、交换、国际项目等获得全球化体验",
      "文化资本": "深厚的文化根基是全球化中保持身份认同的锚",
      "社会资本": "跨文化的社会连接帮孩子建立真实的全球视野，而非停留在想象",
    },
    lowCapitalRisk: {
      "经济资本": "缺少国际化体验的经济条件，全球视野可能只是口号",
      "文化资本": "文化积累不足，既缺乏本土根基，全球化也只是浮在表面",
      "社会资本": "社交圈单一，对不同文化的理解停留在刻板印象",
    },
  },
  "社交媒体重塑关系": {
    challenge: "线上人设正在替代真实连接，孩子在虚拟和现实之间的边界越来越模糊",
    abilityLink: "当社交被算法操控时，这个能力决定了孩子能否建立真实的人际关系",
    highCapitalAdvantage: {
      "经济资本": "有条件为孩子创造更多线下真实社交的机会（营地、社团、旅行）",
      "文化资本": "家庭中有深度对话的氛围，孩子更容易分辨虚拟和真实的边界",
      "社会资本": "真实的社会连接是对抗社交媒体虚拟化的最好解药",
    },
    lowCapitalRisk: {
      "经济资本": "缺少线下社交替代方案，孩子更容易沉溺于线上虚拟关系",
      "文化资本": "缺少媒介素养教育，孩子容易被算法塑造认知和行为",
      "社会资本": "现实社交资源匮乏，社交媒体可能成为唯一的人际窗口",
    },
  },
  "心理问题低龄化": {
    challenge: "焦虑和抑郁正在向小学生蔓延，心理健康已经从「锦上添花」变成「刚性需求」",
    abilityLink: "在心理压力前所未有的时代，这个能力是孩子的心理免疫系统",
    highCapitalAdvantage: {
      "经济资本": "有条件获取专业心理支持资源，不必等到问题严重才干预",
      "文化资本": "家庭中重视情绪表达和心理健康的文化氛围，是最好的预防",
      "社会资本": "支持性的社交网络是孩子心理韧性的重要外部资源",
    },
    lowCapitalRisk: {
      "经济资本": "心理支持资源获取受限，问题容易被忽视或延误",
      "文化资本": "如果家庭文化中忽视情绪（「别哭」「坚强点」），孩子的心理需求可能被压抑",
      "社会资本": "缺少同伴支持和安全的倾诉空间，孩子独自承担心理压力",
    },
  },
  "屏幕侵蚀身心": {
    challenge: "久坐、蓝光、碎片刺激正在改变孩子的大脑发育模式——这是一场静默的健康危机",
    abilityLink: "在屏幕无处不在的时代，这个能力帮孩子建立与技术的健康边界",
    highCapitalAdvantage: {
      "经济资本": "有条件为孩子安排更多户外运动和线下体验，对冲屏幕时间",
      "文化资本": "家庭中有阅读、运动、对话的习惯，自然减少对屏幕的依赖",
      "社会资本": "丰富的线下社交让孩子有理由放下屏幕",
    },
    lowCapitalRisk: {
      "经济资本": "替代活动的成本不低，经济受限的家庭更容易让屏幕成为「免费保姆」",
      "文化资本": "如果家长自己也是重度屏幕用户，很难为孩子树立边界榜样",
      "社会资本": "缺少线下社交圈子，屏幕成为孩子唯一的娱乐和社交窗口",
    },
  },
  "孤独感蔓延": {
    challenge: "社交在线化导致深度归属感缺失——未来最稀缺的可能不是技能，而是真实的连接",
    abilityLink: "在孤独成为流行病的时代，这个能力是孩子建立有意义人际关系的基础",
    highCapitalAdvantage: {
      "经济资本": "有条件创造社区感（选择好学校、参加社团、家庭聚会等）",
      "文化资本": "家庭本身的归属感和文化传承是对抗孤独感的最强后盾",
      "社会资本": "社会资本的本质就是连接——已有的连接网络为孩子提供归属感",
    },
    lowCapitalRisk: {
      "经济资本": "选择空间有限，可能被困在缺乏社区感的环境中",
      "文化资本": "如果家庭内部沟通不畅，孩子在家也找不到归属感",
      "社会资本": "社交孤立本身就是孤独感的直接原因——这项短板需要格外重视",
    },
  },
  "地缘冲突常态化": {
    challenge: "和平红利正在消退，孩子需要在更不确定的世界中建立安全感和适应力",
    abilityLink: "当外部世界越不稳定，这个内在能力就越是孩子的稳定锚点",
    highCapitalAdvantage: {
      "经济资本": "经济储备是面对地缘风险时最直接的安全垫",
      "文化资本": "历史素养和全局思维帮孩子理解冲突的本质，而非被恐惧驱动",
      "社会资本": "跨区域的社会网络提供更多「退路」和信息渠道",
    },
    lowCapitalRisk: {
      "经济资本": "缺少经济缓冲，地缘风险对生活的冲击会更大",
      "文化资本": "缺少历史和地缘视角，容易被情绪化信息裹挟",
      "社会资本": "社交网络局限于本地，一旦本地环境恶化缺少外部支持",
    },
  },
  "气候与环境危机": {
    challenge: "下一代将直面资源约束型社会——节制、创新和适应力不再是选修课",
    abilityLink: "在资源约束的未来，这个能力帮孩子在限制条件下依然创造价值",
    highCapitalAdvantage: {
      "经济资本": "有余力投资环保教育和可持续生活方式，让理念落地为行动",
      "文化资本": "科学素养和系统思维帮孩子理解环境问题的复杂性",
      "社会资本": "参与环保社区和行动，让孩子从旁观者变成参与者",
    },
    lowCapitalRisk: {
      "经济资本": "环境成本上升（食物、能源、居住）首先冲击经济弱势家庭",
      "文化资本": "缺少科学素养，容易对环境问题产生无力感或否认",
      "社会资本": "缺少行动网络，个体面对系统性问题时感到无力",
    },
  },
  "黑天鹅频率上升": {
    challenge: "疫情级别的冲击可能每 5-10 年来一次——孩子需要的不是预测未来，而是适应意外",
    abilityLink: "在不可预测的世界里，这个能力决定了孩子能否在混乱中站稳脚跟",
    highCapitalAdvantage: {
      "经济资本": "经济储备是应对黑天鹅事件时最基本的生存保障",
      "文化资本": "认知弹性和学习能力让孩子在突变中更快找到新方向",
      "社会资本": "危机时刻，社会网络是最可靠的互助资源",
    },
    lowCapitalRisk: {
      "经济资本": "没有缓冲的家庭在黑天鹅事件中最脆弱",
      "文化资本": "缺少应变思维，可能在危机中陷入恐慌和被动",
      "社会资本": "孤立的家庭在危机中得不到及时的信息和支持",
    },
  },
};

// Fallback for any trend not in the map (e.g. user custom input)
const FALLBACK_INSIGHT: TrendInsight = {
  challenge: "这是一个你们独特关注的趋势方向。能识别出主流视野之外的信号，本身就说明你们的敏锐度",
  abilityLink: "面对这个趋势，你们选择的能力方向体现了家庭独特的判断",
  highCapitalAdvantage: {
    "经济资本": "经济基础让你们有更大的空间去应对这个趋势带来的变化",
    "文化资本": "家庭的知识积累能帮孩子更深入地理解这个趋势的含义",
    "社会资本": "社会连接能提供更多关于这个趋势的一手信息和实践机会",
  },
  lowCapitalRisk: {
    "经济资本": "在这个趋势下，经济资源的不足可能会限制应对的灵活性",
    "文化资本": "对这个趋势的理解深度可能受限于当前的知识储备",
    "社会资本": "有限的社会连接可能影响对这个趋势的感知和应对能力",
  },
};

// ─── Ability → Domain reverse map ─────────────────────

export const ABILITY_DOMAIN_MAP: Record<string, string> = {
  "自驱学习": "认知与学习", "批判性思维": "认知与学习", "信息甄别": "认知与学习", "深度阅读": "认知与学习",
  "创造力": "创造与解决", "复杂问题拆解": "创造与解决", "跨学科整合": "创造与解决", "动手实践": "创造与解决",
  "情绪调节": "情绪与韧性", "抗挫韧性": "情绪与韧性", "延迟满足": "情绪与韧性", "内驱力": "情绪与韧性",
  "共情力": "社会与领导", "合作与冲突解决": "社会与领导", "表达与影响力": "社会与领导", "跨文化沟通": "社会与领导",
  "诚信与责任": "品格与判断", "独立判断": "品格与判断", "关怀弱势": "品格与判断", "长期主义": "品格与判断",
  "人机协作": "数字与AI", "数据思维": "数字与AI", "数字安全": "数字与AI", "技术放大优势": "数字与AI",
};

// ─── Trend → Recommended ability domains ──────────────

const TREND_DOMAIN_HINTS: Record<string, string[]> = {
  "AI 替代执行岗": ["创造与解决", "数字与AI"],
  "人机协作常态化": ["数字与AI", "认知与学习"],
  "注意力成稀缺资源": ["认知与学习", "情绪与韧性"],
  "终身职业消失": ["认知与学习", "情绪与韧性"],
  "创业自雇比例上升": ["创造与解决", "社会与领导"],
  "阶层流动收窄": ["认知与学习", "社会与领导"],
  "多元价值观碰撞": ["品格与判断", "社会与领导"],
  "全球化与本土化并行": ["社会与领导", "品格与判断"],
  "社交媒体重塑关系": ["情绪与韧性", "社会与领导"],
  "心理问题低龄化": ["情绪与韧性", "品格与判断"],
  "屏幕侵蚀身心": ["情绪与韧性", "认知与学习"],
  "孤独感蔓延": ["社会与领导", "情绪与韧性"],
  "地缘冲突常态化": ["品格与判断", "情绪与韧性"],
  "气候与环境危机": ["品格与判断", "创造与解决"],
  "黑天鹅频率上升": ["情绪与韧性", "认知与学习"],
};

export function getDomainHint(topTrend: string): string {
  const domains = TREND_DOMAIN_HINTS[topTrend];
  if (!domains) return "";
  return `基于你们的主假设「${topTrend}」，${domains[0]}和${domains[1]}方向可能更值得关注`;
}

// ─── Diagnostic Generator ─────────────────────────────

interface CapitalRow {
  label: string;
  level: string;
  keyword: string;
}

interface DiagnosticInput {
  topTrend: string;
  coreAbility: string;
  capitalMatrix?: CapitalRow[];
  priorityUpgrade?: string;
}

interface DiagnosticOutput {
  explain: string;
  connect: string;
  gap: string;
}

export function generateDiagnostic(input: DiagnosticInput): DiagnosticOutput {
  const insight = TREND_INSIGHTS[input.topTrend] || FALLBACK_INSIGHT;
  const domain = ABILITY_DOMAIN_MAP[input.coreAbility] || "";

  // ─── Explain ───
  const explain = `${insight.challenge}。在这个趋势下，「${input.coreAbility}」${domain ? `（${domain}）` : ""}是关键——${insight.abilityLink}。`;

  // ─── Connect ───
  let connect: string;
  if (!input.capitalMatrix || input.capitalMatrix.length === 0) {
    connect = "（S 模块数据不足，暂无家底关联分析）";
  } else {
    const levelOrder: Record<string, number> = { L3: 3, L2: 2, L1: 1 };
    const sorted = [...input.capitalMatrix].sort(
      (a, b) => (levelOrder[b.level] || 0) - (levelOrder[a.level] || 0)
    );
    const highest = sorted[0];
    const lowest = sorted[sorted.length - 1];

    const overview = input.capitalMatrix
      .map((r) => `${r.label} ${r.level}`)
      .join("、");

    const highText = insight.highCapitalAdvantage[highest.label] || `${highest.label}是你们当前的优势项`;
    const lowText = insight.lowCapitalRisk[lowest.label] || `${lowest.label}在这个趋势下需要关注`;

    connect = `你们的资本格局是${overview}。在「${input.topTrend}」趋势下，${highText}。同时，${lowText}。`;
    if (input.priorityUpgrade) {
      connect += `你们选择优先升级「${input.priorityUpgrade}」`;
      if (input.priorityUpgrade === lowest.label) {
        connect += "——这恰好补的是当前短板，方向一致。";
      } else if (input.priorityUpgrade === highest.label) {
        connect += "——这是在拉长优势板，让强项更强。";
      } else {
        connect += "。";
      }
    }
  }

  // ─── Gap ───
  let gap: string;
  if (!input.capitalMatrix || input.capitalMatrix.length === 0) {
    gap = "（数据不足，暂无差距分析）";
  } else {
    const levelOrder: Record<string, number> = { L3: 3, L2: 2, L1: 1 };
    const sorted = [...input.capitalMatrix].sort(
      (a, b) => (levelOrder[b.level] || 0) - (levelOrder[a.level] || 0)
    );
    const maxLevel = levelOrder[sorted[0].level] || 0;
    const minLevel = levelOrder[sorted[sorted.length - 1].level] || 0;
    const tops = sorted.filter((r) => (levelOrder[r.level] || 0) === maxLevel);
    const bottoms = sorted.filter((r) => (levelOrder[r.level] || 0) === minLevel);

    if (maxLevel === minLevel) {
      gap = `在「${input.topTrend}」趋势下，你们三项资本水平相当（均为 ${sorted[0].level}），没有明显短板，但也没有突出优势——需要思考在哪个方向上建立差异化。`;
    } else {
      const topLabels = tops.map((r) => r.label).join("和");
      const bottomLabels = bottoms.map((r) => r.label).join("和");
      gap = `在「${input.topTrend}」趋势下，你们的优势是${topLabels}（${tops[0].level}），短板是${bottomLabels}（${bottoms[0].level}）。`;
    }
  }

  return { explain, connect, gap };
}
