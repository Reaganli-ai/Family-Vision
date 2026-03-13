import { useState } from "react";

interface Props {
  coreCodeName: string;
  flipsideCost: string;
  onConfirm: (data: { keep: string; reduce: string; from: string; to: string }) => void;
  disabled?: boolean;
}

const UpgradePathCard = ({ coreCodeName, flipsideCost, onConfirm, disabled = false }: Props) => {
  const [keep, setKeep] = useState("");
  const [reduce, setReduce] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [confirmed, setConfirmed] = useState(false);

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
    <div className="bg-card border-2 border-primary/20 rounded-xl p-5 space-y-3">
      <p className="text-[14px] font-medium text-foreground">精神不变，形式升级</p>

      <div className="space-y-3">
        <div className="space-y-1">
          <label className="text-[13px] font-medium text-foreground">你想保留这个家风带来的哪部分好处？</label>
          <input
            type="text"
            value={keep}
            onChange={(e) => setKeep(e.target.value)}
            placeholder="一句话"
            className="w-full bg-secondary/40 rounded-lg px-3 py-2 text-[13px] outline-none placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary/30"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[13px] font-medium text-foreground">你最想减少哪一个代价/副作用？</label>
          {flipsideCost && (
            <p className="text-[11px] text-muted-foreground">之前提到的代价：{flipsideCost}</p>
          )}
          <input
            type="text"
            value={reduce}
            onChange={(e) => setReduce(e.target.value)}
            placeholder="一句话"
            className="w-full bg-secondary/40 rounded-lg px-3 py-2 text-[13px] outline-none placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary/30"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[13px] font-medium text-foreground">从「旧方式」</label>
          <input
            type="text"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            placeholder="比如：不允许孩子说不"
            className="w-full bg-secondary/40 rounded-lg px-3 py-2 text-[13px] outline-none placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary/30"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[13px] font-medium text-foreground">→ 到「新方式」</label>
          <input
            type="text"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="比如：允许说不，但要给出理由"
            className="w-full bg-secondary/40 rounded-lg px-3 py-2 text-[13px] outline-none placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary/30"
          />
        </div>
      </div>

      {/* Live preview */}
      <div className="bg-secondary/30 rounded-lg p-3 border border-border">
        <p className="text-[11px] text-muted-foreground mb-1">预览</p>
        <p className="text-[13px] text-foreground/80 leading-relaxed">{preview}</p>
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

export default UpgradePathCard;
