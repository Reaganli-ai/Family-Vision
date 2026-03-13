import { useState } from "react";

const FLIPSIDE_TAGS = [
  "过度严格/恐惧驱动",
  "过度僵化/非黑即白",
  "关系损耗/压抑表达",
  "焦虑内耗/完美主义",
  "回避冲突",
];

interface Props {
  coreCodeName: string;
  onConfirm: (data: { tags: string[]; example: string; benefit: string; cost: string }) => void;
  disabled?: boolean;
}

const FlipsideFillCard = ({ coreCodeName, onConfirm, disabled = false }: Props) => {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [example, setExample] = useState("");
  const [benefit, setBenefit] = useState("");
  const [cost, setCost] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => {
      if (prev.includes(tag)) return prev.filter((t) => t !== tag);
      if (prev.length >= 2) return prev;
      return [...prev, tag];
    });
  };

  const canConfirm =
    selectedTags.length > 0 && example.trim() && benefit.trim() && cost.trim();

  const handleConfirm = () => {
    setConfirmed(true);
    onConfirm({
      tags: selectedTags,
      example: example.trim(),
      benefit: benefit.trim(),
      cost: cost.trim(),
    });
  };

  if (confirmed || disabled) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 opacity-80">
        <p className="text-[12px] text-muted-foreground mb-1">「{coreCodeName}」副作用 · 已完成</p>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {selectedTags.map((t) => (
            <span key={t} className="text-[12px] bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">{t}</span>
          ))}
        </div>
        <p className="text-[13px] text-foreground/80">表现：<span className="font-medium text-primary">{example}</span></p>
        <p className="text-[13px] text-foreground/80">好处：<span className="font-medium text-primary">{benefit}</span></p>
        <p className="text-[13px] text-foreground/80">代价：<span className="font-medium text-primary">{cost}</span></p>
      </div>
    );
  }

  return (
    <div className="bg-card border-2 border-primary/20 rounded-xl p-5 space-y-3">
      <div>
        <p className="text-[14px] font-medium text-foreground">
          针对你们的家风「{coreCodeName}」，在今天可能出现哪些副作用？
        </p>
        <p className="text-[11px] text-primary font-medium mt-1.5">选 1-2 个</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FLIPSIDE_TAGS.map((tag) => (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all ${
              selectedTags.includes(tag)
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {selectedTags.length > 0 && (
        <div className="space-y-3 border-t border-border pt-3">
          <div className="space-y-1">
            <label className="text-[13px] font-medium text-foreground">在我们家，它可能表现为：</label>
            <textarea
              value={example}
              onChange={(e) => setExample(e.target.value)}
              placeholder="举一个具体场景/行为"
              rows={2}
              className="w-full bg-secondary/40 rounded-lg px-3 py-2 text-[13px] outline-none placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary/30 resize-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[13px] font-medium text-foreground">它的好处是：</label>
            <textarea
              value={benefit}
              onChange={(e) => setBenefit(e.target.value)}
              placeholder=""
              rows={2}
              className="w-full bg-secondary/40 rounded-lg px-3 py-2 text-[13px] outline-none placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary/30 resize-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[13px] font-medium text-foreground">它的代价/风险是：</label>
            <textarea
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder=""
              rows={2}
              className="w-full bg-secondary/40 rounded-lg px-3 py-2 text-[13px] outline-none placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary/30 resize-none"
            />
          </div>
        </div>
      )}

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
