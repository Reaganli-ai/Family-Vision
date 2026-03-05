import { useState } from "react";

interface Props {
  onConfirm: (data: { agreed: boolean; reason?: string }) => void;
  disagreePlaceholder?: string;
  disabled?: boolean;
}

const AgreeDisagreeCard = ({
  onConfirm,
  disagreePlaceholder = "哪里不准确？比如：我觉得我们家其实更偏向……",
  disabled = false,
}: Props) => {
  const [choice, setChoice] = useState<"agree" | "disagree" | null>(null);
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const handleAgree = () => {
    setConfirmed(true);
    onConfirm({ agreed: true });
  };

  const handleDisagreeConfirm = () => {
    if (!reason.trim()) return;
    setConfirmed(true);
    onConfirm({ agreed: false, reason: reason.trim() });
  };

  if (confirmed || disabled) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 opacity-80">
        <p className="text-[12px] text-muted-foreground mb-1">
          {choice === "agree" ? "同意这个诊断" : "不同意"} · 已完成
        </p>
        {reason && (
          <p className="text-[13px] text-foreground/80">原因：{reason}</p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-card border-2 border-primary/20 rounded-xl p-5 space-y-3">
      <p className="text-[13px] font-medium text-foreground">你同意这个分析吗？</p>
      <div className="flex gap-2">
        <button
          onClick={handleAgree}
          className={`flex-1 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
            choice === "agree"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground hover:bg-secondary/80"
          }`}
        >
          同意，继续
        </button>
        <button
          onClick={() => setChoice("disagree")}
          className={`flex-1 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
            choice === "disagree"
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground hover:bg-secondary/80"
          }`}
        >
          不太准确
        </button>
      </div>

      {choice === "disagree" && (
        <div className="space-y-2">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={100}
            rows={2}
            placeholder={disagreePlaceholder}
            className="w-full bg-secondary/30 rounded-lg px-3 py-2 text-[13px] outline-none resize-none placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary/30"
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground/50">{reason.length}/100</span>
            <button
              onClick={handleDisagreeConfirm}
              disabled={!reason.trim()}
              className="px-4 py-1.5 rounded-lg text-[12px] font-medium bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              提交 →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgreeDisagreeCard;
