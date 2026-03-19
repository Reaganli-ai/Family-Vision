import { useState } from "react";

interface Candidate {
  name: string;
  definition: string;
  evidence: Record<string, string>;
}

interface Props {
  candidates: Candidate[];
  onConfirm: (data: { name: string; definition: string; userEdited?: boolean }) => void;
  disabled?: boolean;
}

const CoreCodeConfirmCard = ({ candidates, onConfirm, disabled = false }: Props) => {
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isCustom, setIsCustom] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [editedDef, setEditedDef] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const handleSelect = (idx: number) => {
    setIsCustom(false);
    setSelectedIdx(idx);
    setEditedName(candidates[idx].name);
    setEditedDef(candidates[idx].definition);
  };

  const handleCustom = () => {
    setSelectedIdx(null);
    setIsCustom(true);
    setEditedName("");
    setEditedDef("");
  };

  const hasSelection = isCustom || selectedIdx !== null;
  const canConfirm = hasSelection && editedName.trim() && editedDef.trim();

  const handleConfirm = () => {
    const userEdited = isCustom ||
      (selectedIdx !== null &&
        (editedName.trim() !== candidates[selectedIdx].name ||
         editedDef.trim() !== candidates[selectedIdx].definition));
    setConfirmed(true);
    onConfirm({
      name: editedName.trim(),
      definition: editedDef.trim(),
      userEdited: userEdited || undefined,
    });
  };

  if (confirmed || disabled) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 opacity-80">
        <p className="text-[12px] text-muted-foreground mb-1">家风内核 · 已完成</p>
        <p className="text-[14px] font-medium text-primary">{editedName}</p>
        <p className="text-[13px] text-foreground/80 mt-0.5">{editedDef}</p>
      </div>
    );
  }

  return (
    <div className="bg-card border-2 border-primary/20 rounded-xl p-5 space-y-3">
      <p className="text-[14px] font-medium text-foreground">
        基于你的故事和素材，我提炼了几个参考方向。你完全可以用自己的词：
      </p>

      <div className="space-y-2">
        {candidates.map((c, idx) => (
          <button
            key={idx}
            onClick={() => handleSelect(idx)}
            className={`w-full text-left rounded-lg p-3 transition-all border ${
              selectedIdx === idx && !isCustom
                ? "border-primary bg-primary/5"
                : "border-border bg-secondary/30 hover:bg-secondary/50"
            }`}
          >
            <p className="text-[13px]">
              <span className="font-semibold text-foreground">{c.name}</span>
              <span className="text-muted-foreground ml-1.5">— {c.definition}</span>
            </p>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {Object.entries(c.evidence).map(([key, val]) => (
                <span
                  key={key}
                  className="text-[11px] bg-secondary text-muted-foreground px-2 py-0.5 rounded-full"
                >
                  {key}：{val}
                </span>
              ))}
            </div>
          </button>
        ))}

        {/* Custom option */}
        <button
          onClick={handleCustom}
          className={`w-full text-left rounded-lg p-3 transition-all border ${
            isCustom
              ? "border-primary bg-primary/5"
              : "border-border bg-secondary/30 hover:bg-secondary/50"
          }`}
        >
          <p className="text-[13px] font-medium text-primary">+ 自定义</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">这些都不像？用自己的话写</p>
        </button>
      </div>

      {/* Inline editing area */}
      {hasSelection && (
        <div className="space-y-2 border-t border-border pt-3">
          <div className="space-y-1">
            <label className="text-[12px] text-muted-foreground">名称</label>
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              placeholder="给你们家的精神内核取个名字"
              className="w-full bg-secondary/40 rounded-lg px-3 py-2 text-[13px] outline-none placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary/30"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[12px] text-muted-foreground">定义</label>
            <input
              type="text"
              value={editedDef}
              onChange={(e) => setEditedDef(e.target.value)}
              placeholder="用一句话说明它是什么"
              className="w-full bg-secondary/40 rounded-lg px-3 py-2 text-[13px] outline-none placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary/30"
            />
          </div>
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

export default CoreCodeConfirmCard;
