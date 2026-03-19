import { useState } from "react";

interface Props {
  question: string;
  options: string[];
  onConfirm: (data: { selected: string; reason?: string }) => void;
  reasonPlaceholder?: string;
  disabled?: boolean;
}

const SingleSelectCard = ({
  question,
  options,
  onConfirm,
  reasonPlaceholder,
  disabled = false,
}: Props) => {
  const [selected, setSelected] = useState("");
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const needsReason = !!reasonPlaceholder;
  const canConfirm = selected && (!needsReason || reason.trim());

  const handleSelect = (opt: string) => {
    setSelected(opt);
    if (opt !== selected) setReason("");
  };

  const handleConfirm = () => {
    setConfirmed(true);
    onConfirm({
      selected,
      ...(needsReason && reason.trim() ? { reason: reason.trim() } : {}),
    });
  };

  if (confirmed || disabled) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 opacity-80">
        <p className="text-[12px] text-muted-foreground mb-1">{question} · 已完成</p>
        <p className="text-[13px] font-medium text-primary">{selected || disabled}</p>
        {reason && (
          <p className="text-[12px] text-foreground/70 mt-1">理由：{reason}</p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-card border-2 border-primary/20 rounded-xl p-5 space-y-3">
      <p className="text-[13px] font-medium text-foreground">{question}</p>
      <div className="flex flex-col gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => handleSelect(opt)}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
              selected === opt
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      {needsReason && selected && (
        <div className="space-y-1 border-t border-border pt-3">
          <label className="text-[12px] text-muted-foreground">一句话理由</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={120}
            rows={2}
            placeholder={reasonPlaceholder}
            className="w-full bg-secondary/30 rounded-lg px-3 py-2 text-[13px] outline-none resize-none placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary/30"
          />
          <span className="text-[10px] text-muted-foreground/50">{reason.length}/120</span>
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

export default SingleSelectCard;
