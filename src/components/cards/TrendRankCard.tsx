import { useState } from "react";

// 5 domains × 3 trends = 15 options (MECE)
const TREND_GROUPS = [
  {
    domain: "技术与工作",
    options: [
      { label: "AI 替代执行岗", description: "重复脑力工作被自动化" },
      { label: "人机协作常态化", description: "会用 AI 的人淘汰不会用的人" },
      { label: "注意力成稀缺资源", description: "深度思考能力断崖式下降" },
    ],
  },
  {
    domain: "职业与经济",
    options: [
      { label: "终身职业消失", description: "一份工作干到退休不再现实" },
      { label: "创业自雇比例上升", description: "为自己创造价值成为常态" },
      { label: "阶层流动收窄", description: "教育投资回报率持续分化" },
    ],
  },
  {
    domain: "文化与社会",
    options: [
      { label: "多元价值观碰撞", description: "「正确答案」越来越少" },
      { label: "全球化与本土化并行", description: "全球视野与本土认同的平衡" },
      { label: "社交媒体重塑关系", description: "线上人设替代真实连接" },
    ],
  },
  {
    domain: "身心与健康",
    options: [
      { label: "心理问题低龄化", description: "焦虑抑郁向小学生蔓延" },
      { label: "屏幕侵蚀身心", description: "久坐蓝光改变大脑发育" },
      { label: "孤独感蔓延", description: "深度归属感正在消失" },
    ],
  },
  {
    domain: "全球风险",
    options: [
      { label: "地缘冲突常态化", description: "和平红利正在消退" },
      { label: "气候与环境危机", description: "资源约束型社会到来" },
      { label: "黑天鹅频率上升", description: "疫情级冲击可能每 5-10 年一次" },
    ],
  },
];

interface Props {
  onConfirm: (ranked: string[]) => void;
  disabled?: boolean;
}

const TrendRankCard = ({ onConfirm, disabled = false }: Props) => {
  const [ranked, setRanked] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);

  const toggle = (label: string) => {
    setRanked((prev) => {
      const idx = prev.indexOf(label);
      if (idx >= 0) return prev.filter((l) => l !== label);
      if (prev.length >= 3) return prev;
      return [...prev, label];
    });
  };

  const handleConfirm = () => {
    setConfirmed(true);
    onConfirm(ranked);
  };

  if (confirmed || disabled) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 opacity-80">
        <p className="text-[12px] text-muted-foreground mb-2">趋势判断 · 已完成</p>
        <div className="space-y-1">
          {ranked.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <span className="text-[12px] font-medium">{label}</span>
              <span className="text-[10px] text-muted-foreground">
                {i === 0 ? "主假设" : "对冲"}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const isFull = ranked.length >= 3;

  return (
    <div className="bg-card border-2 border-primary/20 rounded-xl p-5 space-y-4">
      <div>
        <p className="text-[14px] font-medium text-foreground">
          未来 10 年，哪些趋势最会影响你的孩子？
        </p>
        <p className="text-[12px] text-muted-foreground mt-1">
          不需要选「最正确的」，选你们家最在意的
        </p>
        <p className="text-[11px] text-primary font-medium mt-1.5">
          依次点击选出 Top 3：第 1 个 = 主假设，后 2 个 = 对冲
        </p>
      </div>

      {TREND_GROUPS.map((group) => (
        <div key={group.domain} className="space-y-2">
          <p className="text-[11px] font-semibold text-muted-foreground tracking-wide">
            {group.domain}
          </p>
          <div className="flex flex-wrap gap-2">
            {group.options.map((opt) => {
              const rankIndex = ranked.indexOf(opt.label);
              const isSelected = rankIndex >= 0;
              const isDisabled = !isSelected && isFull;

              return (
                <button
                  key={opt.label}
                  onClick={() => !isDisabled && toggle(opt.label)}
                  className={`px-3 py-2 rounded-lg text-[12px] transition-all border text-left flex items-start gap-1.5 ${
                    isSelected
                      ? "border-primary bg-primary/5 text-foreground font-medium"
                      : isDisabled
                        ? "border-border bg-secondary/30 text-muted-foreground opacity-40 cursor-not-allowed"
                        : "border-border bg-secondary/30 text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  {isSelected && (
                    <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {rankIndex + 1}
                    </span>
                  )}
                  <span className="flex flex-col">
                    <span>{opt.label}</span>
                    <span className="text-[10px] text-muted-foreground font-normal leading-tight mt-0.5">
                      {opt.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <div className="flex justify-between items-center pt-1">
        <p className="text-[11px] text-muted-foreground">
          {ranked.length === 0
            ? "点击选择"
            : ranked.length < 3
              ? `已选 ${ranked.length}/3`
              : "已选 3 个，可以确认了"}
        </p>
        <button
          onClick={handleConfirm}
          disabled={ranked.length < 3}
          className="px-5 py-2 rounded-lg text-[13px] font-medium transition-all bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          确认判断 →
        </button>
      </div>
    </div>
  );
};

export default TrendRankCard;
