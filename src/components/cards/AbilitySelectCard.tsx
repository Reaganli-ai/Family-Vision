import { useState } from "react";

// 6 domains × 4 abilities = 24 options (MECE)
const ABILITY_DOMAINS = [
  {
    name: "认知与学习",
    abilities: [
      { label: "自驱学习", description: "没人督促也能持续学习" },
      { label: "批判性思维", description: "不盲从，能独立分析判断" },
      { label: "信息甄别", description: "在信息洪流中辨别真伪" },
      { label: "深度阅读", description: "能沉下心啃透一本书/一个问题" },
    ],
  },
  {
    name: "创造与解决",
    abilities: [
      { label: "创造力", description: "能想出别人想不到的方案" },
      { label: "复杂问题拆解", description: "面对大难题不慌，能拆成小步骤" },
      { label: "跨学科整合", description: "把不同领域的知识串起来用" },
      { label: "动手实践", description: "不停留在想法，能做出来" },
    ],
  },
  {
    name: "情绪与韧性",
    abilities: [
      { label: "情绪调节", description: "能识别和管理自己的情绪" },
      { label: "抗挫韧性", description: "跌倒了能爬起来继续走" },
      { label: "延迟满足", description: "为了长远目标能忍住眼前诱惑" },
      { label: "内驱力", description: "做事的动力来自内心而非外部奖惩" },
    ],
  },
  {
    name: "社会与领导",
    abilities: [
      { label: "共情力", description: "能理解他人的感受和处境" },
      { label: "合作与冲突解决", description: "能跟不同人一起把事做成" },
      { label: "表达与影响力", description: "能清晰表达并说服他人" },
      { label: "跨文化沟通", description: "能与不同背景的人顺畅交流" },
    ],
  },
  {
    name: "品格与判断",
    abilities: [
      { label: "诚信与责任", description: "说到做到，敢于担当" },
      { label: "独立判断", description: "不人云亦云，有自己的是非观" },
      { label: "关怀弱势", description: "愿意为不如自己的人出力" },
      { label: "长期主义", description: "看得远，不被短期利益驱动" },
    ],
  },
  {
    name: "数字与AI",
    abilities: [
      { label: "人机协作", description: "能把 AI 当队友而非对手" },
      { label: "数据思维", description: "用数据说话，不凭感觉判断" },
      { label: "数字安全", description: "保护隐私、识别诈骗和操控" },
      { label: "技术放大优势", description: "用技术杠杆放大自身长板" },
    ],
  },
];

interface Props {
  aiHint?: string;
  onConfirm: (ability: string) => void;
  disabled?: boolean;
}

const AbilitySelectCard = ({ aiHint, onConfirm, disabled = false }: Props) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = () => {
    if (!selected) return;
    setConfirmed(true);
    onConfirm(selected);
  };

  if (confirmed || disabled) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 opacity-80">
        <p className="text-[12px] text-muted-foreground mb-1">能力押注 · 已完成</p>
        <span className="text-[12px] bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
          {selected}
        </span>
      </div>
    );
  }

  return (
    <div className="bg-card border-2 border-primary/20 rounded-xl p-5 space-y-4">
      <div>
        <p className="text-[14px] font-medium text-foreground">
          如果只能押注一项能力，你最想让孩子拥有哪一个？
        </p>
        <p className="text-[12px] text-muted-foreground mt-1">
          6 个方向，24 项能力——只选 1 个作为战略重点
        </p>
      </div>

      {aiHint && (
        <div className="bg-primary/5 border border-primary/10 rounded-lg px-3 py-2">
          <p className="text-[11px] text-primary/80">{aiHint}</p>
        </div>
      )}

      <div className="space-y-3">
        {ABILITY_DOMAINS.map((group) => (
          <div key={group.name}>
            <p className="text-[11px] font-semibold text-muted-foreground tracking-wide mb-1.5">
              {group.name}
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {group.abilities.map((ability) => {
                const isThis = selected === ability.label;
                return (
                  <button
                    key={ability.label}
                    onClick={() => setSelected(ability.label)}
                    className={`text-left px-3 py-2 rounded-lg text-[12px] transition-all border ${
                      isThis
                        ? "border-primary bg-primary/10 text-primary font-medium"
                        : "border-transparent bg-secondary/50 text-foreground hover:bg-secondary/80"
                    }`}
                  >
                    <span className="font-medium">{ability.label}</span>
                    <span className={`block text-[10px] mt-0.5 leading-tight ${
                      isThis ? "text-primary/70" : "text-muted-foreground"
                    }`}>
                      {ability.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-1">
        <button
          onClick={handleConfirm}
          disabled={!selected}
          className="px-5 py-2 rounded-lg text-[13px] font-medium transition-all bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          确认重点 →
        </button>
      </div>
    </div>
  );
};

export default AbilitySelectCard;
