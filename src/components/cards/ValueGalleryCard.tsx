import { useState } from "react";
import { Check, X } from "lucide-react";

interface ValueItem {
  label: string;
  description: string;
}

interface ValueColumn {
  title: string;
  bgClass: string;
  headerClass: string;
  checkClass: string;
  items: ValueItem[];
}

const COLUMNS: ValueColumn[] = [
  {
    title: "A. 内在稳定",
    bgClass: "bg-emerald-50",
    headerClass: "bg-emerald-100 text-emerald-800",
    checkClass: "border-emerald-400 bg-emerald-500",
    items: [
      { label: "真实一致", description: "言行合一，内外表里如一" },
      { label: "情绪安全", description: "能感知和调节自己的情绪" },
      { label: "自尊自信", description: "认可自己的价值和能力" },
      { label: "韧性复原", description: "跌倒后能重新站起来" },
    ],
  },
  {
    title: "B. 成长与连接",
    bgClass: "bg-amber-50",
    headerClass: "bg-amber-100 text-amber-800",
    checkClass: "border-amber-400 bg-amber-500",
    items: [
      { label: "自主驱动", description: "主动设定目标并行动" },
      { label: "好奇探索", description: "对世界保持开放的求知欲" },
      { label: "深度同理", description: "能真正理解他人的感受" },
      { label: "协作共赢", description: "与他人合作共创更大价值" },
    ],
  },
  {
    title: "C. 社会参与",
    bgClass: "bg-sky-50",
    headerClass: "bg-sky-100 text-sky-800",
    checkClass: "border-sky-400 bg-sky-500",
    items: [
      { label: "责任担当", description: "对自己和他人负责" },
      { label: "批判思维", description: "独立思考，不盲从" },
      { label: "公平正义", description: "关注公平，敢于发声" },
      { label: "社会贡献", description: "愿意为更大的群体付出" },
    ],
  },
  {
    title: "D. 精神意义",
    bgClass: "bg-orange-50",
    headerClass: "bg-orange-100 text-orange-800",
    checkClass: "border-orange-400 bg-orange-500",
    items: [
      { label: "意义追寻", description: "追问人生的意义与方向" },
      { label: "审美感知", description: "感受和创造美的能力" },
      { label: "财务智慧", description: "理解金钱，合理规划" },
      { label: "实用技能", description: "拥有独立生活的能力" },
    ],
  },
];

interface Props {
  onConfirm: (data: { core: string[]; deferred: string[] }) => void;
  disabled?: boolean;
}

const ValueGalleryCard = ({ onConfirm, disabled = false }: Props) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmed, setConfirmed] = useState(false);

  const allItems = COLUMNS.flatMap((c) => c.items.map((i) => i.label));

  const toggle = (label: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  };

  const clearAll = () => setSelected(new Set());

  const handleConfirm = () => {
    const core = Array.from(selected);
    const deferred = allItems.filter((item) => !selected.has(item));
    setConfirmed(true);
    onConfirm({ core, deferred });
  };

  if (confirmed || disabled) {
    const core = Array.from(selected);
    return (
      <div className="bg-card border border-border rounded-xl p-4 opacity-80">
        <p className="text-[12px] text-muted-foreground mb-2">价值观画廊 · 已完成</p>
        <div className="flex flex-wrap gap-1.5">
          {core.map((v) => (
            <span key={v} className="text-[12px] bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">{v}</span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border-2 border-primary/20 rounded-xl p-5 space-y-4">
      <div>
        <p className="text-[14px] font-medium text-foreground">
          凭直觉选出你们家最看重的价值观
        </p>
        <p className="text-[12px] text-muted-foreground mt-1">
          不用想太多，选 5-7 个最能代表你们家庭信念的词。没选到的不代表不重要，只是「战略暂缓」。
        </p>
      </div>

      {/* 4-column grid on desktop, 2 columns on mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {COLUMNS.map((col) => (
          <div key={col.title} className={`rounded-xl overflow-hidden ${col.bgClass}`}>
            <div className={`px-3 py-2 text-[12px] font-semibold ${col.headerClass}`}>
              {col.title}
            </div>
            <div className="p-2 space-y-1.5">
              {col.items.map((item) => {
                const isSelected = selected.has(item.label);
                return (
                  <button
                    key={item.label}
                    onClick={() => toggle(item.label)}
                    className={`w-full flex items-start gap-2 px-2.5 py-2 rounded-lg text-left transition-all ${
                      isSelected
                        ? "bg-white/90 shadow-sm ring-1 ring-primary/30"
                        : "bg-white/50 hover:bg-white/70"
                    }`}
                  >
                    <div className={`mt-0.5 w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border transition-all ${
                      isSelected ? col.checkClass + " border-transparent" : "border-gray-300 bg-white"
                    }`}>
                      {isSelected && <Check size={10} className="text-white" strokeWidth={3} />}
                    </div>
                    <div className="min-w-0">
                      <p className={`text-[12px] font-medium ${isSelected ? "text-foreground" : "text-foreground/80"}`}>
                        {item.label}
                      </p>
                      <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Selected summary */}
      {selected.size > 0 && (
        <div className="bg-secondary/40 rounded-lg px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[12px] text-muted-foreground">
              已选 <span className="font-semibold text-foreground">{selected.size}</span> 项
              {selected.size < 5 && " · 建议选 5-7 个"}
              {selected.size > 7 && " · 建议精简到 5-7 个"}
            </p>
            <button
              onClick={clearAll}
              className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={12} />
              清空
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Array.from(selected).map((v) => (
              <span
                key={v}
                onClick={() => toggle(v)}
                className="text-[11px] bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium cursor-pointer hover:bg-primary/20 transition-colors"
              >
                {v} &times;
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end pt-1">
        <button
          onClick={handleConfirm}
          disabled={selected.size === 0}
          className="px-5 py-2 rounded-lg text-[13px] font-medium transition-all bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          确认价值观 →
        </button>
      </div>
    </div>
  );
};

export default ValueGalleryCard;
