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

const CORE_COUNT = 3;
const DEFER_COUNT = 2;
const TOTAL_NEEDED = CORE_COUNT + DEFER_COUNT;

const ValueGalleryCard = ({ onConfirm, disabled = false }: Props) => {
  const [step, setStep] = useState<"core" | "deferred" | "done">("core");
  const [core, setCore] = useState<Set<string>>(new Set());
  const [deferred, setDeferred] = useState<Set<string>>(new Set());
  const [confirmed, setConfirmed] = useState(false);

  const toggleCore = (label: string) => {
    setCore((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else if (next.size < CORE_COUNT) {
        next.add(label);
      } else {
        // Replace: remove oldest, add new
        const arr = Array.from(next);
        arr.shift();
        return new Set([...arr, label]);
      }
      return next;
    });
  };

  const toggleDeferred = (label: string) => {
    if (core.has(label)) return; // can't defer a core pick
    setDeferred((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else if (next.size < DEFER_COUNT) {
        next.add(label);
      } else {
        const arr = Array.from(next);
        arr.shift();
        return new Set([...arr, label]);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    setConfirmed(true);
    onConfirm({ core: Array.from(core), deferred: Array.from(deferred) });
  };

  if (confirmed || disabled) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 opacity-80">
        <p className="text-[12px] text-muted-foreground mb-2">价值观选择 · 已完成</p>
        <div className="space-y-1.5">
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[10px] text-muted-foreground mr-1">核心聚焦：</span>
            {Array.from(core).map((v) => (
              <span key={v} className="text-[12px] bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">{v}</span>
            ))}
          </div>
          {deferred.size > 0 && (
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[10px] text-muted-foreground mr-1">战略暂缓：</span>
              {Array.from(deferred).map((v) => (
                <span key={v} className="text-[12px] bg-secondary text-muted-foreground px-2.5 py-1 rounded-full">{v}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  const isCorePicking = step === "core";
  const isDeferredPicking = step === "deferred";

  return (
    <div className="bg-card border-2 border-primary/20 rounded-xl p-5 space-y-4">
      {/* Title */}
      <div>
        <p className="text-[14px] font-semibold text-foreground">
          请凭直觉选 {CORE_COUNT} 个【核心聚焦】+ {DEFER_COUNT} 个【战略暂缓】
        </p>
        <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">
          核心聚焦 = 未来 12 个月优先投入；战略暂缓 = 重要但先放一放。
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3 text-[12px]">
        <span className={`px-3 py-1 rounded-full font-medium transition-colors ${
          isCorePicking ? "bg-primary text-primary-foreground" : core.size === CORE_COUNT ? "bg-completed/10 text-completed" : "bg-secondary text-muted-foreground"
        }`}>
          ① 核心聚焦 {core.size}/{CORE_COUNT}
        </span>
        <span className={`px-3 py-1 rounded-full font-medium transition-colors ${
          isDeferredPicking ? "bg-primary text-primary-foreground" : deferred.size === DEFER_COUNT ? "bg-completed/10 text-completed" : "bg-secondary text-muted-foreground"
        }`}>
          ② 战略暂缓 {deferred.size}/{DEFER_COUNT}
        </span>
      </div>

      {/* Instruction for current step */}
      <p className="text-[12px] text-primary font-medium">
        {isCorePicking
          ? `→ 先选 ${CORE_COUNT} 个你们最看重的价值观`
          : `→ 再选 ${DEFER_COUNT} 个"重要但先放一放"的价值观`}
      </p>

      {/* 4-column grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {COLUMNS.map((col) => (
          <div key={col.title} className={`rounded-xl overflow-hidden ${col.bgClass}`}>
            <div className={`px-3 py-2 text-[12px] font-semibold ${col.headerClass}`}>
              {col.title}
            </div>
            <div className="p-2 space-y-1.5">
              {col.items.map((item) => {
                const isCore = core.has(item.label);
                const isDeferred = deferred.has(item.label);
                const isSelected = isCore || isDeferred;
                // In deferred step, core picks are locked
                const isLocked = isDeferredPicking && isCore;

                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      if (isLocked) return;
                      if (isCorePicking) {
                        toggleCore(item.label);
                      } else {
                        if (isDeferred) {
                          toggleDeferred(item.label);
                        } else if (!isCore) {
                          toggleDeferred(item.label);
                        }
                      }
                    }}
                    className={`w-full flex items-start gap-2 px-2.5 py-2 rounded-lg text-left transition-all ${
                      isLocked
                        ? "bg-white/90 opacity-60 cursor-not-allowed"
                        : isSelected
                        ? "bg-white/90 shadow-sm ring-1 ring-primary/30"
                        : "bg-white/50 hover:bg-white/70"
                    }`}
                  >
                    <div className={`mt-0.5 w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border transition-all ${
                      isCore
                        ? col.checkClass + " border-transparent"
                        : isDeferred
                        ? "border-gray-400 bg-gray-400 border-transparent"
                        : "border-gray-300 bg-white"
                    }`}>
                      {isCore && <Check size={10} className="text-white" strokeWidth={3} />}
                      {isDeferred && <span className="text-[8px] text-white font-bold">缓</span>}
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
      <div className="bg-secondary/40 rounded-lg px-4 py-3 space-y-2">
        {core.size > 0 && (
          <div>
            <p className="text-[11px] text-muted-foreground mb-1">核心聚焦（{core.size}/{CORE_COUNT}）</p>
            <div className="flex flex-wrap gap-1.5">
              {Array.from(core).map((v) => (
                <span
                  key={v}
                  onClick={() => { if (isCorePicking) toggleCore(v); }}
                  className={`text-[11px] bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium ${
                    isCorePicking ? "cursor-pointer hover:bg-primary/20" : ""
                  } transition-colors`}
                >
                  {v} {isCorePicking && "×"}
                </span>
              ))}
            </div>
          </div>
        )}
        {deferred.size > 0 && (
          <div>
            <p className="text-[11px] text-muted-foreground mb-1">战略暂缓（{deferred.size}/{DEFER_COUNT}）</p>
            <div className="flex flex-wrap gap-1.5">
              {Array.from(deferred).map((v) => (
                <span
                  key={v}
                  onClick={() => toggleDeferred(v)}
                  className="text-[11px] bg-secondary text-muted-foreground px-2.5 py-1 rounded-full cursor-pointer hover:bg-secondary/80 transition-colors"
                >
                  {v} ×
                </span>
              ))}
            </div>
          </div>
        )}
        {core.size === 0 && deferred.size === 0 && (
          <p className="text-[11px] text-muted-foreground/50">点击上方卡片开始选择</p>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-2 pt-1">
        {isCorePicking && core.size === CORE_COUNT && (
          <button
            onClick={() => setStep("deferred")}
            className="px-5 py-2 rounded-lg text-[13px] font-medium bg-primary text-primary-foreground hover:opacity-90 transition-all"
          >
            下一步：选战略暂缓 →
          </button>
        )}
        {isDeferredPicking && (
          <>
            <button
              onClick={() => setStep("core")}
              className="px-4 py-2 rounded-lg text-[13px] text-muted-foreground border border-border hover:bg-secondary/50 transition-colors"
            >
              ← 返回修改
            </button>
            <button
              onClick={handleConfirm}
              disabled={deferred.size < DEFER_COUNT}
              className="px-5 py-2 rounded-lg text-[13px] font-medium bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              确认价值观 →
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ValueGalleryCard;
