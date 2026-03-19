/**
 * Deterministic summary card that renders a templated description
 * based on the capital matrix L-values. No AI, no drift.
 *
 * State machine position: CAPITAL_RESULT → [this] → CONFIRM
 */

interface CapitalRow {
  label: string;
  level: string;
  keyword: string;
}

interface Props {
  rows: CapitalRow[];
  onConfirm: (agreed: boolean, reason?: string, detail?: string) => void;
  disabled?: boolean;
}

// ─── Deterministic text templates per L-value ────────────

const LEVEL_DESC: Record<string, Record<string, string>> = {
  经济资本: {
    L1: "经济上处于基础保障阶段，资源有限但稳定",
    L2: "经济上较为稳健，有一定的规划和储蓄意识",
    L3: "经济上有较高的自由度，能为教育做战略性投入",
  },
  文化资本: {
    L1: "文化氛围以实用为主，学习资源还有提升空间",
    L2: "有不错的文化基础，家庭中有阅读或讨论的习惯",
    L3: "文化资本丰厚，家庭对知识和思维的投入持续且深入",
  },
  社会资本: {
    L1: "社交网络以亲友为主，外部连接相对有限",
    L2: "有一定的社会连接，能获取到部分外部资源和信息",
    L3: "社会资源网络广泛，能主动为家庭创造多元机会",
  },
};


function buildSummary(rows: CapitalRow[]): string[] {
  return rows.map((r) => {
    const desc = LEVEL_DESC[r.label]?.[r.level] || `${r.label}：${r.level}`;
    const kw = r.keyword ? `（${r.keyword}）` : "";
    return `**${r.label}**（${r.level}）：${desc}${kw}`;
  });
}

function getHighlightText(rows: CapitalRow[]): string {
  const order: Record<string, number> = { L3: 3, L2: 2, L1: 1 };
  const sorted = [...rows].sort((a, b) => (order[b.level] || 0) - (order[a.level] || 0));
  const maxLevel = order[sorted[0]?.level] || 0;
  const minLevel = order[sorted[sorted.length - 1]?.level] || 0;

  const top = sorted.filter((r) => (order[r.level] || 0) === maxLevel);
  const bottom = sorted.filter((r) => (order[r.level] || 0) === minLevel);

  if (top.length === rows.length) {
    // All same level
    return "三项资本水平相当，整体均衡";
  }
  if (top.length === 1) {
    return `最可依仗的是${top[0].label}，${bottom.map((r) => r.label).join("和")}相对更需要提升`;
  }
  // Multiple tied at top
  return `${top.map((r) => r.label).join("和")}都不错，${bottom.map((r) => r.label).join("和")}相对更需要提升`;
}

const CapitalSummaryCard = ({ rows, onConfirm, disabled }: Props) => {
  const summaryLines = buildSummary(rows);
  const highlightText = getHighlightText(rows);

  if (disabled) {
    return (
      <div className="bg-card rounded-xl border border-border p-5 opacity-70">
        <p className="text-[12px] text-muted-foreground mb-1">资本总结 · 已确认</p>
        <div className="text-[13px] text-foreground leading-relaxed space-y-1">
          {summaryLines.map((line, i) => (
            <p key={i}>{line.replace(/\*\*/g, "")}</p>
          ))}
        </div>
      </div>
    );
  }

  // Single-step: summary + confirm
  return (
    <div className="bg-card rounded-xl border-2 border-primary/20 p-5 space-y-4 max-w-lg">
      <div>
        <p className="text-[14px] font-semibold text-foreground mb-3">你们的资本画像</p>
        <div className="space-y-2.5">
          {summaryLines.map((line, i) => (
            <p key={i} className="text-[13px] leading-relaxed text-foreground">
              {line.split(/(\*\*[^*]+\*\*)/).map((part, j) =>
                part.startsWith("**") && part.endsWith("**")
                  ? <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>
                  : <span key={j}>{part}</span>
              )}
            </p>
          ))}
        </div>
        <p className="text-[12px] text-muted-foreground mt-3">
          目前来看，{highlightText}。
        </p>
      </div>

      <div className="border-t border-border pt-3 space-y-3">
        <p className="text-[13px] font-medium text-foreground">以上总结符合你们家吗？</p>
        <button
          onClick={() => onConfirm(true)}
          className="w-full text-[13px] font-medium bg-foreground text-background rounded-lg py-2.5 hover:opacity-90 transition-opacity"
        >
          符合，继续 →
        </button>
      </div>
    </div>
  );
};

export default CapitalSummaryCard;
