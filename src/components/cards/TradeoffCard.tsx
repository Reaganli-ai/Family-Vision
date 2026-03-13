import { useState } from "react";

interface Axis {
  axisId: string;
  labelA: string;
  labelB: string;
}

interface Props {
  axes: Axis[];
  onConfirm: (choices: { axisId: string; labelA: string; labelB: string; choice: "A" | "B" }[]) => void;
  disabled?: boolean;
}

const TradeoffCard = ({ axes, onConfirm, disabled = false }: Props) => {
  const [choices, setChoices] = useState<Record<string, "A" | "B">>({});
  const [confirmed, setConfirmed] = useState(false);

  const setChoice = (axisId: string, choice: "A" | "B") => {
    setChoices((prev) => ({ ...prev, [axisId]: choice }));
  };

  const allChosen = axes.every((a) => choices[a.axisId]);

  const handleConfirm = () => {
    const result = axes.map((a) => ({
      axisId: a.axisId,
      labelA: a.labelA,
      labelB: a.labelB,
      choice: choices[a.axisId],
    }));
    setConfirmed(true);
    onConfirm(result);
  };

  if (confirmed || disabled) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 opacity-80">
        <p className="text-[12px] text-muted-foreground mb-1">取舍确认 · 已完成</p>
        <div className="space-y-1">
          {axes.map((a) => {
            const pick = choices[a.axisId];
            const label = pick === "A" ? a.labelA : a.labelB;
            return (
              <p key={a.axisId} className="text-[12px] text-foreground">
                {a.labelA} vs {a.labelB} → <span className="font-medium text-primary">{label}</span>
              </p>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border-2 border-primary/20 rounded-xl p-5 space-y-3">
      <p className="text-[14px] font-medium text-foreground">
        我帮你把故事翻译成了几个「取舍点」，确认一下你们的默认偏好：
      </p>

      <div className="space-y-3">
        {axes.map((a) => (
          <div key={a.axisId} className="flex items-center gap-2">
            <button
              onClick={() => setChoice(a.axisId, "A")}
              className={`flex-1 px-3.5 py-2 rounded-lg text-[12px] font-medium transition-all ${
                choices[a.axisId] === "A"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              {a.labelA}
            </button>
            <span className="text-[11px] text-muted-foreground shrink-0">vs</span>
            <button
              onClick={() => setChoice(a.axisId, "B")}
              className={`flex-1 px-3.5 py-2 rounded-lg text-[12px] font-medium transition-all ${
                choices[a.axisId] === "B"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              {a.labelB}
            </button>
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-1">
        <button
          onClick={handleConfirm}
          disabled={!allChosen}
          className="px-5 py-2 rounded-lg text-[13px] font-medium transition-all bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          确认 →
        </button>
      </div>
    </div>
  );
};

export default TradeoffCard;
