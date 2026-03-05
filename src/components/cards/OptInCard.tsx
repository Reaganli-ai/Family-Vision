/**
 * Simple opt-in gate card for optional branches.
 * State machine: CONFIRM → [this] → DEEP_DIVE or PRIORITY_SELECT
 */

interface Props {
  title: string;
  description: string;
  confirmText: string;
  skipText: string;
  onConfirm: (optedIn: boolean) => void;
  disabled?: boolean;
}

const OptInCard = ({ title, description, confirmText, skipText, onConfirm, disabled }: Props) => {
  if (disabled) {
    return (
      <div className="bg-card rounded-xl border border-border p-5 opacity-70">
        <p className="text-[12px] text-muted-foreground">{title} · 已选择</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-3 max-w-lg">
      <p className="text-[14px] font-semibold text-foreground">{title}</p>
      <p className="text-[12.5px] text-muted-foreground leading-relaxed">{description}</p>
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onConfirm(true)}
          className="flex-1 text-[13px] font-medium bg-foreground text-background rounded-lg py-2.5 hover:opacity-90 transition-opacity"
        >
          {confirmText}
        </button>
        <button
          onClick={() => onConfirm(false)}
          className="flex-1 text-[13px] text-muted-foreground border border-border rounded-lg py-2.5 hover:bg-secondary/50 transition-colors"
        >
          {skipText}
        </button>
      </div>
    </div>
  );
};

export default OptInCard;
