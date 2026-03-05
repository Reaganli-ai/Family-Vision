import { useState } from "react";

interface FillField {
  label: string;
  placeholder?: string;
}

interface Props {
  fields: FillField[];
  onConfirm: (values: Record<string, string>) => void;
  disabled?: boolean;
}

const KeywordFillCard = ({ fields, onConfirm, disabled = false }: Props) => {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(fields.map((f) => [f.label, ""]))
  );
  const [confirmed, setConfirmed] = useState(false);

  const allFilled = fields.every((f) => values[f.label]?.trim());

  const handleConfirm = () => {
    setConfirmed(true);
    onConfirm(values);
  };

  if (confirmed || disabled) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 opacity-80">
        <p className="text-[12px] text-muted-foreground mb-2">已完成</p>
        {fields.map((f) => (
          <p key={f.label} className="text-[13px] text-foreground/80">
            {f.label}：<span className="font-medium text-primary">{values[f.label]}</span>
          </p>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-card border-2 border-primary/20 rounded-xl p-5 space-y-3">
      {fields.map((field) => (
        <div key={field.label} className="space-y-1">
          <label className="text-[13px] font-medium text-foreground">{field.label}</label>
          <input
            type="text"
            value={values[field.label]}
            onChange={(e) => setValues((prev) => ({ ...prev, [field.label]: e.target.value }))}
            placeholder={field.placeholder || "请填写..."}
            className="w-full bg-secondary/40 rounded-lg px-3 py-2 text-[13px] outline-none placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary/30"
          />
        </div>
      ))}
      <div className="flex justify-end pt-1">
        <button
          onClick={handleConfirm}
          disabled={!allFilled}
          className="px-5 py-2 rounded-lg text-[13px] font-medium transition-all bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          确认 →
        </button>
      </div>
    </div>
  );
};

export default KeywordFillCard;
