import { useState, useEffect } from "react";

interface UpgradeSuggestions {
  keep?: string;
  reduce?: string;
  from?: string;
  to?: string;
}

interface Props {
  coreCodeName: string;
  flipsideCost: string;
  upgradeSuggestions?: UpgradeSuggestions;
  onConfirm: (data: { keep: string; reduce: string; from: string; to: string }) => void;
  disabled?: boolean;
}

const UpgradePathCard = ({ coreCodeName, flipsideCost, upgradeSuggestions, onConfirm, disabled = false }: Props) => {
  const [keep, setKeep] = useState(upgradeSuggestions?.keep || "");
  const [reduce, setReduce] = useState(upgradeSuggestions?.reduce || "");
  const [from, setFrom] = useState(upgradeSuggestions?.from || "");
  const [to, setTo] = useState(upgradeSuggestions?.to || "");
  const [confirmed, setConfirmed] = useState(false);

  const hasSuggestions = !!(upgradeSuggestions?.keep || upgradeSuggestions?.reduce);

  // Update if suggestions arrive after mount
  useEffect(() => {
    if (upgradeSuggestions && !confirmed) {
      if (upgradeSuggestions.keep && !keep) setKeep(upgradeSuggestions.keep);
      if (upgradeSuggestions.reduce && !reduce) setReduce(upgradeSuggestions.reduce);
      if (upgradeSuggestions.from && !from) setFrom(upgradeSuggestions.from);
      if (upgradeSuggestions.to && !to) setTo(upgradeSuggestions.to);
    }
  }, [upgradeSuggestions]);

  const canConfirm = keep.trim() && reduce.trim() && from.trim() && to.trim();

  const preview = `我们家坚持「${coreCodeName}」，保留「${keep || "___"}」，但会从「${from || "___"}」升级为「${to || "___"}」，以减少「${reduce || "___"}」。`;

  const handleConfirm = () => {
    setConfirmed(true);
    onConfirm({
      keep: keep.trim(),
      reduce: reduce.trim(),
      from: from.trim(),
      to: to.trim(),
    });
  };

  if (confirmed || disabled) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 opacity-80">
        <p className="text-[12px] text-muted-foreground mb-1">精神不变，形式升级 · 已完成</p>
        <p className="text-[13px] text-foreground/80 leading-relaxed">
          我们家坚持「<span className="font-medium text-primary">{coreCodeName}</span>」，保留「<span className="font-medium text-primary">{keep}</span>」，但会从「<span className="font-medium text-primary">{from}</span>」升级为「<span className="font-medium text-primary">{to}</span>」，以减少「<span className="font-medium text-primary">{reduce}</span>」。
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border-2 border-primary/20 rounded-xl p-5 space-y-4">
      <div>
        <p className="text-[14px] font-medium text-foreground">精神不变，形式升级</p>
        {hasSuggestions && (
          <p className="text-[11px] text-muted-foreground mt-1">
            基于你前面的回答预填了内容，可以直接修改
          </p>
        )}
      </div>

      <div className="space-y-3">
        {/* Keep */}
        <div className="space-y-1">
          <label className="text-[13px] font-medium text-foreground">想保留的好处</label>
          <p className="text-[11px] text-muted-foreground">你前面提到的好处中，最想保留哪一点？</p>
          <input
            type="text"
            value={keep}
            onChange={(e) => setKeep(e.target.value)}
            placeholder="点击修改…"
            className="w-full bg-secondary/40 rounded-lg px-3 py-2 text-[13px] outline-none placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary/30"
          />
        </div>

        {/* Reduce */}
        <div className="space-y-1">
          <label className="text-[13px] font-medium text-foreground">想减少的代价</label>
          {flipsideCost && !reduce && (
            <p className="text-[11px] text-muted-foreground">之前提到的代价：{flipsideCost}</p>
          )}
          <input
            type="text"
            value={reduce}
            onChange={(e) => setReduce(e.target.value)}
            placeholder="点击修改…"
            className="w-full bg-secondary/40 rounded-lg px-3 py-2 text-[13px] outline-none placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary/30"
          />
        </div>

        {/* From → To */}
        <div className="bg-secondary/20 rounded-lg p-3 space-y-3 border border-border/50">
          <p className="text-[12px] text-muted-foreground">转变路径：怎样保留好的、改掉不好的？</p>
          <div className="space-y-1">
            <label className="text-[13px] font-medium text-foreground">从「旧方式」</label>
            <input
              type="text"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              placeholder="目前的做法或心态…"
              className="w-full bg-background rounded-lg px-3 py-2 text-[13px] outline-none placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary/30"
            />
          </div>
          <div className="flex justify-center">
            <span className="text-muted-foreground text-lg">↓</span>
          </div>
          <div className="space-y-1">
            <label className="text-[13px] font-medium text-foreground">到「新方式」</label>
            <input
              type="text"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="希望变成的做法或心态…"
              className="w-full bg-background rounded-lg px-3 py-2 text-[13px] outline-none placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary/30"
            />
          </div>
        </div>
      </div>

      {/* Live preview */}
      {canConfirm && (
        <div className="bg-secondary/30 rounded-lg p-3 border border-border">
          <p className="text-[11px] text-muted-foreground mb-1">预览</p>
          <p className="text-[13px] text-foreground/80 leading-relaxed">{preview}</p>
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

export default UpgradePathCard;
