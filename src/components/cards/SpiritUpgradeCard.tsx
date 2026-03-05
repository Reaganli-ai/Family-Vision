import { useState } from "react";
import { Pencil } from "lucide-react";

interface Props {
  onConfirm: (data: { spirit: string; from: string; to: string }) => void;
  disabled?: boolean;
}

const EXAMPLES = [
  { from: "撒谎就打", to: "主动说实话有奖励", style: "温和型" },
  { from: "吃苦耐劳", to: "在热爱的事上全力以赴", style: "成长型" },
  { from: "听长辈的话", to: "敢表达不同意见，但尊重讨论规则", style: "开放型" },
];

const SpiritUpgradeCard = ({ onConfirm, disabled = false }: Props) => {
  const [spirit, setSpirit] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [step, setStep] = useState<"input" | "preview">("input");
  const [confirmed, setConfirmed] = useState(false);

  const canPreview = spirit.trim() && from.trim() && to.trim();

  const handleConfirm = () => {
    setConfirmed(true);
    onConfirm({ spirit: spirit.trim(), from: from.trim(), to: to.trim() });
  };

  if (confirmed || disabled) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 opacity-80">
        <p className="text-[12px] text-muted-foreground mb-2">精神继承与升级 · 已完成</p>
        <p className="text-[13px] text-foreground/80">
          核心精神：<span className="font-medium text-primary">{spirit}</span>
        </p>
        <p className="text-[13px] text-foreground/80 mt-1">
          从「{from}」→ 到「{to}」
        </p>
      </div>
    );
  }

  // Preview / confirmation step
  if (step === "preview") {
    return (
      <div className="bg-card border-2 border-primary/20 rounded-xl p-5 space-y-4">
        <p className="text-[14px] font-medium text-foreground">确认你们的精神升级</p>

        <div className="bg-secondary/30 rounded-lg px-4 py-4 space-y-3">
          <div>
            <p className="text-[11px] text-muted-foreground">我们家的核心精神</p>
            <p className="text-[15px] font-semibold text-foreground mt-0.5">{spirit}</p>
          </div>
          <div className="flex items-center gap-2 text-[13px]">
            <span className="bg-secondary rounded px-2 py-1 text-muted-foreground">从「{from}」</span>
            <span className="text-primary font-medium">→</span>
            <span className="bg-primary/10 rounded px-2 py-1 text-primary font-medium">到「{to}」</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => setStep("input")}
            className="flex items-center gap-1 text-[12px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <Pencil size={12} />
            我想改一下
          </button>
          <button
            onClick={handleConfirm}
            className="px-5 py-2 rounded-lg text-[13px] font-medium bg-primary text-primary-foreground hover:opacity-90 transition-all"
          >
            确认，就这么定 →
          </button>
        </div>
      </div>
    );
  }

  // Input step
  return (
    <div className="bg-card border-2 border-primary/20 rounded-xl p-5 space-y-4">
      <div>
        <p className="text-[14px] font-medium text-foreground">
          把这个精神「翻译」成未来的家庭规则
        </p>
        <p className="text-[12px] text-muted-foreground mt-1">
          核心精神不变，但践行方式可以升级。用「从…到…」的格式写一句话。
        </p>
      </div>

      {/* Examples */}
      <div className="bg-secondary/20 rounded-lg px-4 py-3">
        <p className="text-[11px] text-muted-foreground mb-2">别人是这么写的（仅供参考）：</p>
        <div className="space-y-1.5">
          {EXAMPLES.map((ex) => (
            <div key={ex.style} className="flex items-start gap-2 text-[12px]">
              <span className="text-primary/60 mt-0.5 flex-shrink-0">·</span>
              <span className="text-foreground/70">
                从「{ex.from}」→ 到「{ex.to}」
                <span className="text-muted-foreground/50 ml-1.5">{ex.style}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Input fields */}
      <div className="space-y-3">
        <div>
          <label className="text-[13px] font-medium text-foreground">我们家的核心精神是</label>
          <input
            type="text"
            value={spirit}
            onChange={(e) => setSpirit(e.target.value)}
            placeholder="如：诚信、韧性、吃苦耐劳"
            className="w-full bg-secondary/40 rounded-lg px-3 py-2 mt-1 text-[13px] outline-none placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary/30"
          />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-[12px] text-muted-foreground">以前的做法</label>
            <div className="flex items-center mt-1">
              <span className="text-[12px] text-muted-foreground mr-1.5 flex-shrink-0">从「</span>
              <input
                type="text"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                placeholder="旧的方式"
                className="flex-1 bg-secondary/40 rounded-lg px-3 py-2 text-[13px] outline-none placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary/30"
              />
              <span className="text-[12px] text-muted-foreground ml-1.5 flex-shrink-0">」</span>
            </div>
          </div>
          <div className="flex-1">
            <label className="text-[12px] text-primary font-medium">升级后的做法</label>
            <div className="flex items-center mt-1">
              <span className="text-[12px] text-primary mr-1.5 flex-shrink-0">到「</span>
              <input
                type="text"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="新的方式"
                className="flex-1 bg-primary/5 rounded-lg px-3 py-2 text-[13px] outline-none placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary/30"
              />
              <span className="text-[12px] text-primary ml-1.5 flex-shrink-0">」</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-1">
        <button
          onClick={() => setStep("preview")}
          disabled={!canPreview}
          className="px-5 py-2 rounded-lg text-[13px] font-medium transition-all bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          预览确认 →
        </button>
      </div>
    </div>
  );
};

export default SpiritUpgradeCard;
