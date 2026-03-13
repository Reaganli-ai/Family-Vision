import { useState } from "react";

const THEME_TAGS = ["安全感", "秩序", "关系", "面子", "效率", "成长", "尊严"];

interface Props {
  onConfirm: (data: { childhood: string; now: string; themeTag?: string }) => void;
  disabled?: boolean;
}

const QuoteFillCard = ({ onConfirm, disabled = false }: Props) => {
  const [childhood, setChildhood] = useState("");
  const [now, setNow] = useState("");
  const [themeTag, setThemeTag] = useState<string | undefined>(undefined);
  const [confirmed, setConfirmed] = useState(false);

  const canConfirm = childhood.trim() && now.trim();

  const handleConfirm = () => {
    setConfirmed(true);
    onConfirm({ childhood: childhood.trim(), now: now.trim(), themeTag });
  };

  if (confirmed || disabled) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 opacity-80">
        <p className="text-[12px] text-muted-foreground mb-2">已完成</p>
        <p className="text-[13px] text-foreground/80">
          小时候父母常说：<span className="font-medium text-primary">「{childhood}」</span>
        </p>
        <p className="text-[13px] text-foreground/80 mt-1">
          现在常对孩子说：<span className="font-medium text-primary">「{now}」</span>
        </p>
        {themeTag && (
          <p className="text-[12px] text-muted-foreground mt-1.5">
            共同保护：<span className="text-[12px] bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-medium">{themeTag}</span>
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-card border-2 border-primary/20 rounded-xl p-5 space-y-3">
      <div className="space-y-1">
        <label className="text-[13px] font-medium text-foreground">你小时候父母最常对你说的一句话</label>
        <input
          type="text"
          value={childhood}
          onChange={(e) => setChildhood(e.target.value)}
          placeholder="越原话越好，比如「别人能做到你也能」"
          className="w-full bg-secondary/40 rounded-lg px-3 py-2 text-[13px] outline-none placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary/30"
        />
      </div>

      <div className="space-y-1">
        <label className="text-[13px] font-medium text-foreground">你现在最常对孩子强调的一句话</label>
        <input
          type="text"
          value={now}
          onChange={(e) => setNow(e.target.value)}
          placeholder="比如「做人要诚实」「学习是你自己的事」"
          className="w-full bg-secondary/40 rounded-lg px-3 py-2 text-[13px] outline-none placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary/30"
        />
      </div>

      <div className="space-y-1.5">
        <p className="text-[12px] text-muted-foreground">你觉得这两句共同在保护什么？（可选）</p>
        <div className="flex flex-wrap gap-2">
          {THEME_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setThemeTag(themeTag === tag ? undefined : tag)}
              className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all ${
                themeTag === tag
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
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

export default QuoteFillCard;
