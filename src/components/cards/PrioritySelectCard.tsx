import { useState } from "react";
import { ChevronLeft } from "lucide-react";

interface Option {
  label: string;
  subtitle: string;
}

interface ExplainItem {
  title: string;
  meaning: string;
  actions: string[];
}

interface Props {
  question: string;
  hint: string;
  options: Option[];
  unsureExplain: ExplainItem[];
  commentPlaceholder?: string;
  onConfirm: (data: { selected: string; comment?: string }) => void;
  disabled?: boolean;
}

const PrioritySelectCard = ({
  question,
  hint,
  options,
  unsureExplain,
  commentPlaceholder = "比如：我们家在这方面已经有一些想法……",
  onConfirm,
  disabled = false,
}: Props) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [showExplain, setShowExplain] = useState(false);
  const [comment, setComment] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = () => {
    if (!selected) return;
    setConfirmed(true);
    onConfirm({ selected, comment: comment.trim() || undefined });
  };

  if (confirmed || disabled) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 opacity-80">
        <p className="text-[12px] text-muted-foreground mb-1">{question} · 已完成</p>
        <p className="text-[13px] font-medium text-primary">{selected}</p>
        {comment.trim() && (
          <p className="text-[12px] text-muted-foreground mt-1">补充：{comment}</p>
        )}
      </div>
    );
  }

  // Explanation view
  if (showExplain) {
    return (
      <div className="bg-card border-2 border-primary/20 rounded-xl p-5 space-y-4">
        <div>
          <button
            onClick={() => setShowExplain(false)}
            className="flex items-center gap-1 text-[12px] text-primary font-medium mb-3 hover:opacity-80 transition-opacity"
          >
            <ChevronLeft size={14} />
            返回选择
          </button>
          <p className="text-[14px] font-medium text-foreground">三大资本分别是什么？</p>
          <p className="text-[12px] text-muted-foreground mt-0.5">看完后返回做选择</p>
        </div>

        <div className="space-y-3">
          {unsureExplain.map((item) => (
            <div key={item.title} className="bg-secondary/40 rounded-lg px-4 py-3">
              <p className="text-[13px] font-semibold text-foreground mb-1">{item.title}</p>
              <p className="text-[12px] text-muted-foreground mb-2">{item.meaning}</p>
              <div className="space-y-1">
                {item.actions.map((a, i) => (
                  <p key={i} className="text-[12px] text-foreground/70 flex items-start gap-1.5">
                    <span className="text-primary mt-0.5 flex-shrink-0">·</span>
                    {a}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => setShowExplain(false)}
          className="w-full py-2 rounded-lg text-[13px] font-medium bg-primary text-primary-foreground hover:opacity-90 transition-all"
        >
          我想好了，返回选择
        </button>
      </div>
    );
  }

  // Main selection view
  return (
    <div className="bg-card border-2 border-primary/20 rounded-xl p-5 space-y-3">
      <div>
        <p className="text-[14px] font-medium text-foreground">{question}</p>
        <p className="text-[12px] text-muted-foreground mt-0.5">{hint}</p>
      </div>

      <div className="space-y-2">
        {options.map((opt) => (
          <button
            key={opt.label}
            onClick={() => setSelected(opt.label)}
            className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
              selected === opt.label
                ? "bg-primary/10 ring-1 ring-primary/40"
                : "bg-secondary/40 hover:bg-secondary/60"
            }`}
          >
            <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
              selected === opt.label ? "border-primary" : "border-gray-300"
            }`}>
              {selected === opt.label && <span className="w-2 h-2 rounded-full bg-primary" />}
            </span>
            <div>
              <p className={`text-[13px] font-medium ${selected === opt.label ? "text-foreground" : "text-foreground/80"}`}>
                {opt.label}
              </p>
              <p className="text-[11px] text-muted-foreground">{opt.subtitle}</p>
            </div>
          </button>
        ))}

        {/* Unsure option */}
        <button
          onClick={() => setShowExplain(true)}
          className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg bg-secondary/20 hover:bg-secondary/40 transition-all"
        >
          <span className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
          <div>
            <p className="text-[13px] text-muted-foreground">暂不确定</p>
            <p className="text-[11px] text-muted-foreground/60">点击查看三大资本的解释</p>
          </div>
        </button>
      </div>

      {/* Optional comment — only appears after selection */}
      {selected && (
        <div className="pt-1">
          <label className="text-[11px] text-muted-foreground">补充说明（可选）</label>
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={commentPlaceholder}
            className="w-full bg-secondary/30 rounded-lg px-3 py-2 mt-1 text-[12px] outline-none placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary/30"
          />
        </div>
      )}

      <div className="flex justify-end pt-1">
        <button
          onClick={handleConfirm}
          disabled={!selected}
          className="px-5 py-2 rounded-lg text-[13px] font-medium transition-all bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          确认优先级 →
        </button>
      </div>
    </div>
  );
};

export default PrioritySelectCard;
