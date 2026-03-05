import { useState } from "react";

interface Props {
  question: string;
  options: string[];
  onConfirm: (selected: string) => void;
  disabled?: boolean;
}

const SingleSelectCard = ({ question, options, onConfirm, disabled = false }: Props) => {
  const [selected, setSelected] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = () => {
    setConfirmed(true);
    onConfirm(selected);
  };

  if (confirmed || disabled) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 opacity-80">
        <p className="text-[12px] text-muted-foreground mb-1">{question} · 已完成</p>
        <p className="text-[13px] font-medium text-primary">{selected || disabled}</p>
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
            onClick={() => setSelected(opt)}
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
      <div className="flex justify-end pt-1">
        <button
          onClick={handleConfirm}
          disabled={!selected}
          className="px-5 py-2 rounded-lg text-[13px] font-medium transition-all bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          确认 →
        </button>
      </div>
    </div>
  );
};

export default SingleSelectCard;
