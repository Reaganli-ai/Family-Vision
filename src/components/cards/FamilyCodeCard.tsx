import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  onConfirm: (code: string) => void;
  disabled?: boolean;
}

const EXAMPLES = ["LC", "MJ", "李陈家", "SunnyFamily", "WZ"];

const FamilyCodeCard = ({ onConfirm, disabled }: Props) => {
  const [value, setValue] = useState("");
  const [showAlt, setShowAlt] = useState(false);
  const [error, setError] = useState("");

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

  if (disabled) {
    return (
      <div className="bg-card rounded-xl border border-border p-5 opacity-70">
        <p className="text-[13px] font-semibold text-foreground mb-1">为你的家庭取一个代号</p>
        <p className="text-[13px] text-completed font-medium">{value || "已确认"}</p>
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
