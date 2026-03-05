import { useState } from "react";
import { RotateCcw, Check } from "lucide-react";

interface Props {
  title: string;
  content: string;
  onConfirm: (editedContent: string) => void;
  onRegenerate?: () => void;
  disabled?: boolean;
}

const SnapshotCard = ({ title, content, onConfirm, onRegenerate, disabled = false }: Props) => {
  const [text, setText] = useState(content);
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = () => {
    setConfirmed(true);
    onConfirm(text);
  };

  if (confirmed || disabled) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 opacity-80">
        <p className="text-[12px] text-muted-foreground mb-2">{title} · 已确认</p>
        <p className="text-[13px] text-foreground/80 leading-relaxed whitespace-pre-wrap">{text}</p>
      </div>
    );
  }

  return (
    <div className="bg-card border-2 border-primary/20 rounded-xl p-5 space-y-3">
      <p className="text-[14px] font-medium text-foreground flex items-center gap-2">
        📸 {title}
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        className="w-full bg-secondary/30 rounded-lg px-4 py-3 text-[13px] leading-relaxed outline-none resize-none focus:ring-1 focus:ring-primary/30"
      />
      <div className="flex items-center justify-between">
        {onRegenerate && (
          <button
            onClick={onRegenerate}
            className="flex items-center gap-1.5 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw size={13} />
            重新生成
          </button>
        )}
        <button
          onClick={handleConfirm}
          className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-[13px] font-medium bg-primary text-primary-foreground hover:opacity-90 transition-all ml-auto"
        >
          <Check size={14} />
          确认保存
        </button>
      </div>
    </div>
  );
};

export default SnapshotCard;
