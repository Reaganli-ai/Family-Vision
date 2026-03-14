import { useState, useEffect } from "react";

interface FlipsideSuggestions {
  tags?: string[];
  example?: string;
  benefits?: string[];
  costs?: string[];
}

interface Props {
  coreCodeName: string;
  suggestions?: FlipsideSuggestions;
  onConfirm: (data: { tags: string[]; example: string; benefit: string; cost: string }) => void;
  disabled?: boolean;
}

const FlipsideFillCard = ({ coreCodeName, suggestions, onConfirm, disabled = false }: Props) => {
  // Pre-fill from AI suggestions
  const [tag1, setTag1] = useState(suggestions?.tags?.[0] || "");
  const [tag2, setTag2] = useState(suggestions?.tags?.[1] || "");
  const [example, setExample] = useState(suggestions?.example || "");
  const [benefits, setBenefits] = useState<string[]>(
    suggestions?.benefits?.length ? suggestions.benefits : ["", "", ""]
  );
  const [costs, setCosts] = useState<string[]>(
    suggestions?.costs?.length ? suggestions.costs : ["", "", ""]
  );
  const [confirmed, setConfirmed] = useState(false);

  // Update if suggestions arrive after mount
  useEffect(() => {
    if (suggestions && !confirmed) {
      if (suggestions.tags?.[0] && !tag1) setTag1(suggestions.tags[0]);
      if (suggestions.tags?.[1] && !tag2) setTag2(suggestions.tags[1]);
      if (suggestions.example && !example) setExample(suggestions.example);
      if (suggestions.benefits?.length && benefits.every((b) => !b)) setBenefits(suggestions.benefits);
      if (suggestions.costs?.length && costs.every((c) => !c)) setCosts(suggestions.costs);
    }
  }, [suggestions]);

  const hasSuggestions = !!(suggestions?.tags?.length || suggestions?.example || suggestions?.benefits?.length);

  const updateBenefit = (idx: number, val: string) => {
    setBenefits((prev) => prev.map((b, i) => (i === idx ? val : b)));
  };
  const updateCost = (idx: number, val: string) => {
    setCosts((prev) => prev.map((c, i) => (i === idx ? val : c)));
  };

  const filledBenefits = benefits.filter((b) => b.trim());
  const filledCosts = costs.filter((c) => c.trim());
  const canConfirm = tag1.trim() && example.trim() && filledBenefits.length > 0 && filledCosts.length > 0;

  const handleConfirm = () => {
    setConfirmed(true);
    onConfirm({
      tags: [tag1.trim(), tag2.trim()].filter(Boolean),
      example: example.trim(),
      benefit: filledBenefits.join("；"),
      cost: filledCosts.join("；"),
    });
  };

  if (confirmed || disabled) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 opacity-80">
        <p className="text-[12px] text-muted-foreground mb-1">「{coreCodeName}」副作用 · 已完成</p>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {[tag1, tag2].filter(Boolean).map((t) => (
            <span key={t} className="text-[12px] bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">{t}</span>
          ))}
        </div>
        <p className="text-[13px] text-foreground/80">表现：<span className="font-medium text-primary">{example}</span></p>
        <p className="text-[13px] text-foreground/80">好处：<span className="font-medium text-primary">{filledBenefits.join("；")}</span></p>
        <p className="text-[13px] text-foreground/80">代价：<span className="font-medium text-primary">{filledCosts.join("；")}</span></p>
      </div>
    );
  }

  return (
    <div className="bg-card border-2 border-primary/20 rounded-xl p-5 space-y-4">
      <p className="text-[14px] font-medium text-foreground">
        「{coreCodeName}」的另一面
      </p>
      {hasSuggestions && (
        <p className="text-[11px] text-muted-foreground -mt-2">
          以下是基于你之前故事的分析，可以直接修改
        </p>
      )}

      {/* Tags */}
      <div className="space-y-2">
        <label className="text-[13px] font-medium text-foreground">可能的副作用</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={tag1}
            onChange={(e) => setTag1(e.target.value)}
            placeholder="副作用 1，如：过度严格"
            className="flex-1 bg-secondary/40 rounded-lg px-3 py-2 text-[13px] outline-none placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary/30"
          />
          <input
            type="text"
            value={tag2}
            onChange={(e) => setTag2(e.target.value)}
            placeholder="副作用 2（可选）"
            className="flex-1 bg-secondary/40 rounded-lg px-3 py-2 text-[13px] outline-none placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Example */}
      <div className="space-y-1">
        <label className="text-[13px] font-medium text-foreground">在我们家，它可能表现为：</label>
        <textarea
          value={example}
          onChange={(e) => setExample(e.target.value)}
          placeholder="具体的生活场景……"
          rows={2}
          className="w-full bg-secondary/40 rounded-lg px-3 py-2 text-[13px] outline-none placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary/30 resize-none"
        />
      </div>

      {/* Benefits */}
      <div className="space-y-1.5">
        <label className="text-[13px] font-medium text-foreground">它的好处</label>
        {benefits.map((b, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-[12px] text-muted-foreground/60 w-4 shrink-0">{String.fromCharCode(97 + i)}.</span>
            <input
              type="text"
              value={b}
              onChange={(e) => updateBenefit(i, e.target.value)}
              placeholder={i === 0 ? "好处…" : "（可选）"}
              className="flex-1 bg-secondary/40 rounded-lg px-3 py-2 text-[13px] outline-none placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary/30"
            />
          </div>
        ))}
      </div>

      {/* Costs */}
      <div className="space-y-1.5">
        <label className="text-[13px] font-medium text-foreground">它的代价</label>
        {costs.map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="text-[12px] text-muted-foreground/60 w-4 shrink-0">{String.fromCharCode(97 + i)}.</span>
            <input
              type="text"
              value={c}
              onChange={(e) => updateCost(i, e.target.value)}
              placeholder={i === 0 ? "代价…" : "（可选）"}
              className="flex-1 bg-secondary/40 rounded-lg px-3 py-2 text-[13px] outline-none placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary/30"
            />
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-1">
        <button
          onClick={handleConfirm}
          disabled={!canConfirm}
          className="px-5 py-2 rounded-lg text-[13px] font-medium transition-all bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          确认 →
        </button>
      </div>
    </div>
  );
};

export default FlipsideFillCard;
