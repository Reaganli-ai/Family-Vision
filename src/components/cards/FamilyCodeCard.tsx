import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, Pencil, Check, X } from "lucide-react";

interface Props {
  onConfirm: (code: string) => void;
  disabled?: boolean;
  /** Pre-fill value when re-editing */
  confirmedValue?: string;
}

const EXAMPLES = ["LC", "MJ", "李陈家", "SunnyFamily", "WZ"];

const FamilyCodeCard = ({ onConfirm, disabled, confirmedValue }: Props) => {
  const [value, setValue] = useState(confirmedValue || "");
  const [showAlt, setShowAlt] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Sync confirmedValue when it changes externally
  useEffect(() => {
    if (confirmedValue && !editing) setValue(confirmedValue);
  }, [confirmedValue, editing]);

  const validate = (v: string): string => {
    const trimmed = v.trim();
    if (!trimmed) return "请输入家庭代号";
    if (trimmed.length > 12) return "代号建议控制在 12 个字符以内";
    if (/\s/.test(trimmed)) return "代号中不能包含空格";
    return "";
  };

  const handleConfirm = () => {
    const err = validate(value);
    if (err) {
      setError(err);
      return;
    }
    onConfirm(value.trim());
  };

  const handleChange = (v: string) => {
    setValue(v);
    if (error) setError(validate(v));
  };

  // ── Inline edit mode (when card is disabled/confirmed) ──
  const startEdit = () => {
    setEditing(true);
    setTimeout(() => editInputRef.current?.focus(), 50);
  };

  const saveEdit = () => {
    const err = validate(value);
    if (err) {
      setError(err);
      return;
    }
    setEditing(false);
    setError("");
    onConfirm(value.trim());
  };

  const cancelEdit = () => {
    setValue(confirmedValue || "");
    setEditing(false);
    setError("");
  };

  if (disabled) {
    return (
      <div className="bg-card rounded-xl border border-border p-5 opacity-80">
        <p className="text-[13px] font-semibold text-foreground mb-1">为你的家庭取一个代号</p>
        {editing ? (
          <div className="flex items-center gap-2 mt-2">
            <input
              ref={editInputRef}
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveEdit();
                if (e.key === "Escape") cancelEdit();
              }}
              maxLength={12}
              className={`flex-1 border rounded-lg px-3 py-2 text-[14px] outline-none transition-colors ${
                error
                  ? "border-red-400 focus:ring-1 focus:ring-red-300"
                  : "border-border focus:ring-1 focus:ring-primary/30 focus:border-primary/40"
              }`}
            />
            <button
              onClick={saveEdit}
              className="p-1.5 rounded-lg text-completed hover:bg-completed/10 transition-colors"
              title="保存"
            >
              <Check size={16} />
            </button>
            <button
              onClick={cancelEdit}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
              title="取消"
            >
              <X size={16} />
            </button>
            {error && <p className="text-[11px] text-red-500">{error}</p>}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <p className="text-[13px] text-completed font-medium">
              {confirmedValue || value || "已确认"}
            </p>
            <button
              onClick={startEdit}
              className="p-1 rounded text-muted-foreground/50 hover:text-foreground transition-colors"
              title="修改代号"
            >
              <Pencil size={12} />
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-4 max-w-md">
      {/* Title */}
      <div>
        <p className="text-[14px] font-semibold text-foreground">为你的家庭取一个代号</p>
        <p className="text-[12.5px] text-muted-foreground leading-relaxed mt-1.5">
          默认规则：<b>妈妈姓氏首字母 + 爸爸名字首字母</b>。
          例如妈妈李梅（L）+ 爸爸陈亮（C）= <b>LC</b>。建议 2-4 位字符，方便后续罗盘展示。
        </p>
      </div>

      {/* Input */}
      <div>
        <input
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleConfirm()}
          placeholder="LC / MJ / 李陈家 / SunnyFamily"
          maxLength={12}
          className={`w-full border rounded-lg px-3 py-2.5 text-[14px] outline-none transition-colors ${
            error
              ? "border-red-400 focus:ring-1 focus:ring-red-300"
              : "border-border focus:ring-1 focus:ring-primary/30 focus:border-primary/40"
          }`}
        />
        {error && (
          <p className="text-[11.5px] text-red-500 mt-1">{error}</p>
        )}
        {!error && (
          <p className="text-[11px] text-muted-foreground/60 mt-1">
            {EXAMPLES.map((ex, i) => (
              <span key={ex}>
                {i > 0 && "  "}
                <button
                  onClick={() => handleChange(ex)}
                  className="hover:text-primary transition-colors"
                >
                  {ex}
                </button>
              </span>
            ))}
          </p>
        )}
      </div>

      {/* Alt rules (collapsible) */}
      <div>
        <button
          onClick={() => setShowAlt(!showAlt)}
          className="flex items-center gap-1 text-[11.5px] text-muted-foreground hover:text-foreground transition-colors"
        >
          {showAlt ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          我想用别的规则
        </button>
        {showAlt && (
          <div className="mt-2 text-[11.5px] text-muted-foreground leading-relaxed bg-secondary/30 rounded-lg px-3 py-2.5 space-y-1">
            <p>- 英文不方便？直接用中文简称，如「李陈家」「梅亮家」</p>
            <p>- 家庭结构不同？可用「主要照护者姓氏首字母 + 孩子名字首字母」</p>
            <p>- 也可以用家庭内部常用昵称，建议 2-6 个字符</p>
          </div>
        )}
      </div>

      {/* CTA */}
      <button
        onClick={handleConfirm}
        className="w-full bg-foreground text-background text-[13px] font-medium rounded-lg py-2.5 hover:opacity-90 transition-opacity"
      >
        确认代号 →
      </button>
    </div>
  );
};

export default FamilyCodeCard;
