import { useState } from "react";

const FALLBACK_TRAITS = [
  { label: "白手起家", description: "从无到有，靠自己闯出来" },
  { label: "守信重诺", description: "答应了就做到，从不食言" },
  { label: "坚韧不拔", description: "再苦再难也不放弃" },
  { label: "庇护全族", description: "遇到事扛在前面，保护家人" },
];

interface Trait {
  label: string;
  description: string;
}

interface Props {
  traits?: Trait[];
  onConfirm: (traits: string[]) => void;
  disabled?: boolean;
}

const HeroSelectCard = ({ traits, onConfirm, disabled = false }: Props) => {
  const displayTraits = traits?.length ? traits : FALLBACK_TRAITS;
  const [selected, setSelected] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const toggleTrait = (label: string) => {
    setSelected((prev) => {
      if (prev.includes(label)) return prev.filter((t) => t !== label);
      if (prev.length >= 2) return prev;
      return [...prev, label];
    });
  };

  const addCustom = () => {
    const trimmed = customTag.trim();
    if (!trimmed) return;
    if (selected.length >= 2) return;
    setSelected((prev) => [...prev, trimmed]);
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
        <p className="text-[12px] text-muted-foreground mb-1">家族英雄特质 · 已完成</p>
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
        <p className="text-[14px] font-medium text-foreground">
          你们家族里最受尊敬的那个人，他/她因为什么赢得地位？
        </p>
        <p className="text-[11px] text-primary font-medium mt-1.5">
          最多选 2 个{traits?.length ? "" : "（通用参考，也可以自定义）"}
        </p>
      </div>

      <div className="space-y-2">
        {displayTraits.map((trait) => (
          <button
            key={trait.label}
            onClick={() => toggleTrait(trait.label)}
            className={`w-full text-left px-3.5 py-2.5 rounded-lg transition-all ${
              selected.includes(trait.label)
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
            }`}
          >
            <span className="text-[13px] font-medium">{trait.label}</span>
            <span className={`block text-[11px] mt-0.5 ${
              selected.includes(trait.label)
                ? "text-primary-foreground/70"
                : "text-muted-foreground/60"
            }`}>
              {trait.description}
            </span>
          </button>
        ))}
      </div>

      {/* Custom entry */}
      {!showCustom && (
        <button
          onClick={() => setShowCustom(true)}
          className="text-[12px] text-primary font-medium hover:opacity-80 transition-opacity"
        >
          + 自定义
        </button>
      )}
      {showCustom && (
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
            placeholder="输入自定义特质..."
            className="flex-1 bg-secondary/40 rounded-lg px-3 py-1.5 text-[12px] outline-none placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary/30 border border-border"
          />
          <button
            onClick={(e) => { e.stopPropagation(); addCustom(); }}
            disabled={!customTag.trim() || selected.length >= 2}
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
          确认 →
        </button>
      </div>
    </div>
  );
};

export default HeroSelectCard;
