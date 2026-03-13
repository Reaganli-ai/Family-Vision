import { useState } from "react";

interface Props {
  question: string;
  subtitle?: string;
  tags: string[];
  maxSelect?: number;
  selectHint?: string;
  allowCustom?: boolean;
  customPlaceholder?: string;
  confirmText?: string;
  onConfirm: (selected: string[]) => void;
  disabled?: boolean;
}

const TagSelectCard = ({
  question,
  subtitle,
  tags,
  maxSelect = 1,
  selectHint,
  allowCustom = true,
  customPlaceholder = "自定义...",
  confirmText = "确认 →",
  onConfirm,
  disabled = false,
}: Props) => {
  const [selected, setSelected] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const toggleTag = (tag: string) => {
    setSelected((prev) => {
      if (prev.includes(tag)) return prev.filter((t) => t !== tag);
      if (maxSelect === 1) return [tag]; // single select: replace
      if (prev.length >= maxSelect) return prev;
      return [...prev, tag];
    });
  };

  const addCustom = () => {
    if (!customTag.trim()) return;
    if (maxSelect === 1) {
      setSelected([customTag.trim()]);
    } else if (selected.length < maxSelect) {
      setSelected((prev) => [...prev, customTag.trim()]);
    }
    setCustomTag("");
    setShowCustom(false);
  };

  const handleConfirm = () => {
    setConfirmed(true);
    onConfirm(selected);
  };

  if (confirmed || disabled) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 opacity-80">
        <p className="text-[12px] text-muted-foreground mb-1">{question} · 已完成</p>
        <div className="flex flex-wrap gap-1.5">
          {selected.map((t) => (
            <span key={t} className="text-[12px] bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">{t}</span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border-2 border-primary/20 rounded-xl p-5 space-y-3">
      <div>
        <p className="text-[14px] font-medium text-foreground">{question}</p>
        {subtitle && (
          <p className="text-[12px] text-muted-foreground mt-1">{subtitle}</p>
        )}
        <p className="text-[11px] text-primary font-medium mt-1.5">
          {selectHint || (maxSelect === 1 ? "只选 1 个" : `最多选 ${maxSelect} 个`)}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <button
            key={tag}
            onClick={() => toggleTag(tag)}
            className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all ${
              selected.includes(tag)
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* Custom entry */}
      {allowCustom && !showCustom && (
        <button
          onClick={() => setShowCustom(true)}
          className="text-[12px] text-primary font-medium hover:opacity-80 transition-opacity"
        >
          + 自定义
        </button>
      )}
      {allowCustom && showCustom && (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <input
            type="text"
            autoFocus
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter") {
                e.preventDefault();
                addCustom();
              }
            }}
            maxLength={30}
            placeholder={customPlaceholder}
            className="flex-1 bg-secondary/40 rounded-lg px-3 py-1.5 text-[12px] outline-none placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary/30 border border-border"
          />
          <button
            onClick={(e) => { e.stopPropagation(); addCustom(); }}
            disabled={!customTag.trim()}
            className="text-[12px] text-primary font-medium disabled:opacity-40 px-2 py-1 rounded hover:bg-primary/10 transition-colors"
          >
            添加
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setShowCustom(false); setCustomTag(""); }}
            className="text-[12px] text-muted-foreground px-2 py-1 rounded hover:bg-secondary transition-colors"
          >
            取消
          </button>
        </div>
      )}

      <div className="flex justify-end pt-1">
        <button
          onClick={handleConfirm}
          disabled={selected.length === 0}
          className="px-5 py-2 rounded-lg text-[13px] font-medium transition-all bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {confirmText}
        </button>
      </div>
    </div>
  );
};

export default TagSelectCard;
