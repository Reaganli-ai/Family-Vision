import { useState, useMemo } from "react";
import { Check } from "lucide-react";

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

// Flat lookup for descriptions
const LABEL_DESC = new Map(COLUMNS.flatMap((c) => c.items.map((i) => [i.label, i.description])));

interface ConfirmData {
  selfCore: string[];
  selfDeferred: string[];
  partnerCore?: string[];
  partnerDeferred?: string[];
  core: string[];
  deferred: string[];
  partnerSkipped: boolean;
}

interface Props {
  onConfirm: (data: ConfirmData) => void;
  disabled?: boolean;
}

const CORE_COUNT = 3;
const DEFER_COUNT = 2;

type Step = "self-core" | "self-deferred" | "partner-core" | "partner-deferred" | "consensus";

const ValueGalleryCard = ({ onConfirm, disabled = false }: Props) => {
  const [step, setStep] = useState<Step>("self-core");
  const [selfCore, setSelfCore] = useState<Set<string>>(new Set());
  const [selfDeferred, setSelfDeferred] = useState<Set<string>>(new Set());
  const [partnerCore, setPartnerCore] = useState<Set<string>>(new Set());
  const [partnerDeferred, setPartnerDeferred] = useState<Set<string>>(new Set());
  const [finalCore, setFinalCore] = useState<Set<string>>(new Set());
  const [finalDeferred, setFinalDeferred] = useState<Set<string>>(new Set());
  const [confirmed, setConfirmed] = useState(false);

  // ── Consensus helpers ──
  const consensusData = useMemo(() => {
    const sc = Array.from(selfCore);
    const pc = Array.from(partnerCore);
    const sd = Array.from(selfDeferred);
    const pd = Array.from(partnerDeferred);

    const coreIntersection = sc.filter((v) => pc.includes(v));
    const selfOnlyCore = sc.filter((v) => !pc.includes(v));
    const partnerOnlyCore = pc.filter((v) => !sc.includes(v));
    const deferredIntersection = sd.filter((v) => pd.includes(v));
    const selfOnlyDeferred = sd.filter((v) => !pd.includes(v));
    const partnerOnlyDeferred = pd.filter((v) => !sd.includes(v));

    // Pool for final core: selfCore ∪ partnerCore
    const corePool = [...new Set([...sc, ...pc])];
    // Pool for final deferred: selfDeferred ∪ partnerDeferred
    const deferredPool = [...new Set([...sd, ...pd])];

    return {
      coreIntersection,
      selfOnlyCore,
      partnerOnlyCore,
      deferredIntersection,
      selfOnlyDeferred,
      partnerOnlyDeferred,
      corePool,
      deferredPool,
    };
  }, [selfCore, partnerCore, selfDeferred, partnerDeferred]);

  // Initialize finalCore/finalDeferred when entering consensus
  const enterConsensus = () => {
    const { coreIntersection, deferredIntersection } = consensusData;
    setFinalCore(new Set(coreIntersection));
    setFinalDeferred(new Set(deferredIntersection));
    setStep("consensus");
  };

  // ── Toggle helpers ──
  const makeToggle = (
    setter: React.Dispatch<React.SetStateAction<Set<string>>>,
    max: number,
    locked?: Set<string>,
  ) => (label: string) => {
    if (locked?.has(label)) return;
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(label)) {
        next.delete(label);
      } else if (next.size < max) {
        next.add(label);
      } else {
        const arr = Array.from(next);
        arr.shift();
        return new Set([...arr, label]);
      }
      return next;
    });
  };

  const toggleSelfCore = makeToggle(setSelfCore, CORE_COUNT);
  const toggleSelfDeferred = makeToggle(setSelfDeferred, DEFER_COUNT, selfCore);
  const togglePartnerCore = makeToggle(setPartnerCore, CORE_COUNT);
  const togglePartnerDeferred = makeToggle(setPartnerDeferred, DEFER_COUNT, partnerCore);

  const toggleFinalCore = (label: string) => {
    if (!consensusData.corePool.includes(label)) return;
    setFinalCore((prev) => {
      const next = new Set(prev);
      if (next.has(label)) { next.delete(label); }
      else if (next.size < CORE_COUNT) { next.add(label); }
      return next;
    });
  };

  const toggleFinalDeferred = (label: string) => {
    if (!consensusData.deferredPool.includes(label)) return;
    if (finalCore.has(label)) return;
    setFinalDeferred((prev) => {
      const next = new Set(prev);
      if (next.has(label)) { next.delete(label); }
      else if (next.size < DEFER_COUNT) { next.add(label); }
      return next;
    });
  };

  // ── Confirm ──
  const handleConfirm = (skipped: boolean) => {
    setConfirmed(true);
    if (skipped) {
      onConfirm({
        selfCore: Array.from(selfCore),
        selfDeferred: Array.from(selfDeferred),
        core: Array.from(selfCore),
        deferred: Array.from(selfDeferred),
        partnerSkipped: true,
      });
    } else {
      onConfirm({
        selfCore: Array.from(selfCore),
        selfDeferred: Array.from(selfDeferred),
        partnerCore: Array.from(partnerCore),
        partnerDeferred: Array.from(partnerDeferred),
        core: Array.from(finalCore),
        deferred: Array.from(finalDeferred),
        partnerSkipped: false,
      });
    }
  };

  // ── Confirmed / disabled view ──
  if (confirmed || disabled) {
    return (
      <div className="bg-card border border-border rounded-xl p-4 opacity-80">
        <p className="text-[12px] text-muted-foreground mb-2">价值观选择 · 已完成</p>
        <div className="space-y-1.5">
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[10px] text-muted-foreground mr-1">核心聚焦：</span>
            {Array.from(confirmed ? finalCore.size > 0 ? finalCore : selfCore : selfCore).map((v) => (
              <span key={v} className="text-[12px] bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">{v}</span>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[10px] text-muted-foreground mr-1">战略暂缓：</span>
            {Array.from(confirmed ? finalDeferred.size > 0 ? finalDeferred : selfDeferred : selfDeferred).map((v) => (
              <span key={v} className="text-[12px] bg-secondary text-muted-foreground px-2.5 py-1 rounded-full">{v}</span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Which sets are active? ──
  const isSelfCore = step === "self-core";
  const isSelfDeferred = step === "self-deferred";
  const isPartnerCore = step === "partner-core";
  const isPartnerDeferred = step === "partner-deferred";
  const isConsensus = step === "consensus";
  const isSelfPhase = isSelfCore || isSelfDeferred;
  const isPartnerPhase = isPartnerCore || isPartnerDeferred;

  const activeCore = isSelfPhase ? selfCore : isPartnerPhase ? partnerCore : finalCore;
  const activeDeferred = isSelfPhase ? selfDeferred : isPartnerPhase ? partnerDeferred : finalDeferred;
  const isPickingCore = isSelfCore || isPartnerCore;
  const isPickingDeferred = isSelfDeferred || isPartnerDeferred;

  // ── Consensus panel ──
  if (isConsensus) {
    const { coreIntersection, selfOnlyCore, partnerOnlyCore, deferredIntersection, selfOnlyDeferred, partnerOnlyDeferred, corePool, deferredPool } = consensusData;

    return (
      <div className="bg-card border-2 border-primary/20 rounded-xl p-5 space-y-4">
        <div>
          <p className="text-[14px] font-semibold text-foreground">你们的共识与差异</p>
          <p className="text-[12px] text-muted-foreground mt-1">请基于双方选择，确认最终的 {CORE_COUNT} 个核心聚焦 + {DEFER_COUNT} 个战略暂缓</p>
        </div>

        {/* Consensus / Difference display */}
        <div className="space-y-3">
          {coreIntersection.length > 0 && (
            <div className="bg-emerald-50 rounded-lg p-3">
              <p className="text-[12px] font-medium text-emerald-800 mb-1.5">你们都选了（核心共识）</p>
              <div className="flex flex-wrap gap-1.5">
                {coreIntersection.map((v) => (
                  <span key={v} className="text-[12px] bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full font-medium">{v}</span>
                ))}
              </div>
            </div>
          )}

          {(selfOnlyCore.length > 0 || partnerOnlyCore.length > 0) && (
            <div className="bg-amber-50 rounded-lg p-3">
              <p className="text-[12px] font-medium text-amber-800 mb-1.5">核心差异</p>
              <div className="space-y-1">
                {selfOnlyCore.length > 0 && (
                  <p className="text-[12px] text-amber-700">你选了：{selfOnlyCore.join("、")}</p>
                )}
                {partnerOnlyCore.length > 0 && (
                  <p className="text-[12px] text-amber-700">伴侣选了：{partnerOnlyCore.join("、")}</p>
                )}
              </div>
            </div>
          )}

          {deferredIntersection.length > 0 && (
            <div className="bg-secondary/50 rounded-lg p-3">
              <p className="text-[12px] font-medium text-muted-foreground mb-1.5">你们都同意暂缓</p>
              <div className="flex flex-wrap gap-1.5">
                {deferredIntersection.map((v) => (
                  <span key={v} className="text-[12px] bg-secondary text-muted-foreground px-2.5 py-1 rounded-full">{v}</span>
                ))}
              </div>
            </div>
          )}

          {(selfOnlyDeferred.length > 0 || partnerOnlyDeferred.length > 0) && (
            <div className="bg-secondary/30 rounded-lg p-3">
              <p className="text-[12px] font-medium text-muted-foreground mb-1.5">暂缓差异</p>
              <div className="space-y-1">
                {selfOnlyDeferred.length > 0 && (
                  <p className="text-[12px] text-muted-foreground">你暂缓了：{selfOnlyDeferred.join("、")}</p>
                )}
                {partnerOnlyDeferred.length > 0 && (
                  <p className="text-[12px] text-muted-foreground">伴侣暂缓了：{partnerOnlyDeferred.join("、")}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Final core selection from pool */}
        <div className="space-y-2">
          <p className="text-[12px] text-primary font-medium">
            → 确认最终 {CORE_COUNT} 个核心聚焦（{finalCore.size}/{CORE_COUNT}）
          </p>
          <div className="flex flex-wrap gap-2">
            {corePool.map((v) => {
              const isFinal = finalCore.has(v);
              const inIntersection = coreIntersection.includes(v);
              return (
                <button
                  key={v}
                  onClick={() => toggleFinalCore(v)}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all border ${
                    isFinal
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-secondary/30 text-muted-foreground hover:bg-secondary/50"
                  }`}
                >
                  {v}
                  {inIntersection && <span className="text-[10px] ml-1 opacity-60">共识</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Final deferred selection from pool */}
        <div className="space-y-2">
          <p className="text-[12px] text-primary font-medium">
            → 确认最终 {DEFER_COUNT} 个战略暂缓（{finalDeferred.size}/{DEFER_COUNT}）
          </p>
          <div className="flex flex-wrap gap-2">
            {deferredPool.filter((v) => !finalCore.has(v)).map((v) => {
              const isFinal = finalDeferred.has(v);
              const inIntersection = deferredIntersection.includes(v);
              return (
                <button
                  key={v}
                  onClick={() => toggleFinalDeferred(v)}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all border ${
                    isFinal
                      ? "border-gray-400 bg-gray-100 text-gray-700"
                      : "border-border bg-secondary/30 text-muted-foreground hover:bg-secondary/50"
                  }`}
                >
                  {v}
                  {inIntersection && <span className="text-[10px] ml-1 opacity-60">共识</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-1">
          <button
            onClick={() => setStep("partner-core")}
            className="px-4 py-2 rounded-lg text-[13px] text-muted-foreground border border-border hover:bg-secondary/50 transition-colors"
          >
            ← 返回修改
          </button>
          <button
            onClick={() => handleConfirm(false)}
            disabled={finalCore.size < CORE_COUNT || finalDeferred.size < DEFER_COUNT}
            className="px-5 py-2 rounded-lg text-[13px] font-medium bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            确认价值观 →
          </button>
        </div>
      </div>
    );
  }

  // ── Gallery picking phase (self or partner) ──
  const title = isSelfPhase
    ? "请选出你最看重的价值观"
    : "现在请伴侣来选";
  const subtitle = isSelfPhase
    ? "核心聚焦 = 未来 12 个月优先投入；战略暂缓 = 重要但先放一放。"
    : "请把设备交给伴侣，独立完成选择。";

  return (
    <div className="bg-card border-2 border-primary/20 rounded-xl p-5 space-y-4">
      {/* Title */}
      <div>
        <p className="text-[14px] font-semibold text-foreground">{title}</p>
        <p className="text-[12px] text-muted-foreground mt-1 leading-relaxed">{subtitle}</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3 text-[12px]">
        <span className={`px-3 py-1 rounded-full font-medium transition-colors ${
          isPickingCore ? "bg-primary text-primary-foreground" : activeCore.size === CORE_COUNT ? "bg-completed/10 text-completed" : "bg-secondary text-muted-foreground"
        }`}>
          ① 核心聚焦 {activeCore.size}/{CORE_COUNT}
        </span>
        <span className={`px-3 py-1 rounded-full font-medium transition-colors ${
          isPickingDeferred ? "bg-primary text-primary-foreground" : activeDeferred.size === DEFER_COUNT ? "bg-completed/10 text-completed" : "bg-secondary text-muted-foreground"
        }`}>
          ② 战略暂缓 {activeDeferred.size}/{DEFER_COUNT}
        </span>
      </div>

      {/* Instruction */}
      <p className="text-[12px] text-primary font-medium">
        {isPickingCore
          ? `→ 选 ${CORE_COUNT} 个最看重的价值观`
          : `→ 选 ${DEFER_COUNT} 个"重要但先放一放"的价值观`}
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
                const isCore = activeCore.has(item.label);
                const isDef = activeDeferred.has(item.label);
                const isSelected = isCore || isDef;
                const isLocked = isPickingDeferred && isCore;

                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      if (isLocked) return;
                      if (isPickingCore) {
                        if (isSelfCore) toggleSelfCore(item.label);
                        else togglePartnerCore(item.label);
                      } else {
                        if (isSelfDeferred) toggleSelfDeferred(item.label);
                        else togglePartnerDeferred(item.label);
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
                        : isDef
                        ? "border-gray-400 bg-gray-400 border-transparent"
                        : "border-gray-300 bg-white"
                    }`}>
                      {isCore && <Check size={10} className="text-white" strokeWidth={3} />}
                      {isDef && <span className="text-[8px] text-white font-bold">缓</span>}
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
        {activeCore.size > 0 && (
          <div>
            <p className="text-[11px] text-muted-foreground mb-1">核心聚焦（{activeCore.size}/{CORE_COUNT}）</p>
            <div className="flex flex-wrap gap-1.5">
              {Array.from(activeCore).map((v) => (
                <span
                  key={v}
                  onClick={() => {
                    if (isPickingCore) {
                      if (isSelfCore) toggleSelfCore(v);
                      else togglePartnerCore(v);
                    }
                  }}
                  className={`text-[11px] bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium ${
                    isPickingCore ? "cursor-pointer hover:bg-primary/20" : ""
                  } transition-colors`}
                >
                  {v} {isPickingCore && "×"}
                </span>
              ))}
            </div>
          </div>
        )}
        {activeDeferred.size > 0 && (
          <div>
            <p className="text-[11px] text-muted-foreground mb-1">战略暂缓（{activeDeferred.size}/{DEFER_COUNT}）</p>
            <div className="flex flex-wrap gap-1.5">
              {Array.from(activeDeferred).map((v) => (
                <span
                  key={v}
                  onClick={() => {
                    if (isSelfDeferred) toggleSelfDeferred(v);
                    else if (isPartnerDeferred) togglePartnerDeferred(v);
                  }}
                  className="text-[11px] bg-secondary text-muted-foreground px-2.5 py-1 rounded-full cursor-pointer hover:bg-secondary/80 transition-colors"
                >
                  {v} ×
                </span>
              ))}
            </div>
          </div>
        )}
        {activeCore.size === 0 && activeDeferred.size === 0 && (
          <p className="text-[11px] text-muted-foreground/50">点击上方卡片开始选择</p>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-2 pt-1">
        {/* self-core → self-deferred */}
        {isSelfCore && activeCore.size === CORE_COUNT && (
          <button
            onClick={() => setStep("self-deferred")}
            className="px-5 py-2 rounded-lg text-[13px] font-medium bg-primary text-primary-foreground hover:opacity-90 transition-all"
          >
            下一步：选战略暂缓 →
          </button>
        )}

        {/* self-deferred → partner or skip */}
        {isSelfDeferred && (
          <>
            <button
              onClick={() => setStep("self-core")}
              className="px-4 py-2 rounded-lg text-[13px] text-muted-foreground border border-border hover:bg-secondary/50 transition-colors"
            >
              ← 返回修改
            </button>
            {activeDeferred.size === DEFER_COUNT && (
              <>
                <button
                  onClick={() => handleConfirm(true)}
                  className="px-4 py-2 rounded-lg text-[13px] text-muted-foreground border border-border hover:bg-secondary/50 transition-colors"
                >
                  只有我一人，确认
                </button>
                <button
                  onClick={() => setStep("partner-core")}
                  className="px-5 py-2 rounded-lg text-[13px] font-medium bg-primary text-primary-foreground hover:opacity-90 transition-all"
                >
                  伴侣也来选 →
                </button>
              </>
            )}
          </>
        )}

        {/* partner-core → partner-deferred */}
        {isPartnerCore && activeCore.size === CORE_COUNT && (
          <button
            onClick={() => setStep("partner-deferred")}
            className="px-5 py-2 rounded-lg text-[13px] font-medium bg-primary text-primary-foreground hover:opacity-90 transition-all"
          >
            下一步：选战略暂缓 →
          </button>
        )}

        {/* partner-deferred → consensus */}
        {isPartnerDeferred && (
          <>
            <button
              onClick={() => setStep("partner-core")}
              className="px-4 py-2 rounded-lg text-[13px] text-muted-foreground border border-border hover:bg-secondary/50 transition-colors"
            >
              ← 返回修改
            </button>
            {activeDeferred.size === DEFER_COUNT && (
              <button
                onClick={enterConsensus}
                className="px-5 py-2 rounded-lg text-[13px] font-medium bg-primary text-primary-foreground hover:opacity-90 transition-all"
              >
                查看共识 →
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ValueGalleryCard;
