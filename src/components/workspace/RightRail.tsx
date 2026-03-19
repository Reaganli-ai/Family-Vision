import { useState, useMemo } from "react";
import {
  Check,
  Download,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { StepId, StepInfo, PhaseId } from "@/pages/Workspace";
import { STEPS } from "@/pages/Workspace";
import type { CompassDataSchema } from "@/lib/compass-schema";

// ═══════════════════════════════════════════════════════════
//  Props
// ═══════════════════════════════════════════════════════════

interface Props {
  currentStep: StepId;
  currentPhase: PhaseId;
  completedSteps: StepId[];
  completedPhases: Record<StepId, PhaseId[]>;
  steps: StepInfo[];
  onExport: () => void;
  compassData: CompassDataSchema;
  started: boolean;
  saveState: "saved" | "saving" | "error";
  lastSavedAt: Date | null;
  saveError: string | null;
  onRestartModule: (moduleIndex: number) => void;
}

const PHASES: PhaseId[] = ["collect", "deepen", "confirm"];
const PHASE_TIMELINE_LABELS: Record<PhaseId, string> = {
  collect: "信息收集",
  deepen: "追问深化",
  confirm: "快照产出",
};

// ═══════════════════════════════════════════════════════════
//  Data extraction
// ═══════════════════════════════════════════════════════════

interface DigestSection {
  id: "S" | "N" | "W" | "E";
  title: string;
  lines: string[];
}

function parseLevelScore(levelText: string): number {
  const numericMatch = levelText.match(/\d+/);
  if (numericMatch) return Number(numericMatch[0]);
  if (levelText.includes("高")) return 3;
  if (levelText.includes("中")) return 2;
  if (levelText.includes("低")) return 1;
  return 0;
}

function buildDigestSections(
  cd: CompassDataSchema,
  visibleModuleIds: Array<"S" | "N" | "W" | "E">,
): DigestSection[] {
  const sections: DigestSection[] = [];
  const moduleSequence: Array<"S" | "N" | "W" | "E"> = ["S", "N", "W", "E"];
  const visibleSet = new Set(visibleModuleIds);

  const capitalMatrix = cd.S?.capitalMatrix?.value || [];
  const priorityUpgrade = cd.S?.priorityUpgrade?.value;
  const sLines: string[] = [];
  if (capitalMatrix.length > 0) {
    const sortedCapitals = [...capitalMatrix].sort(
      (leftCapital, rightCapital) => parseLevelScore(rightCapital.level) - parseLevelScore(leftCapital.level),
    );
    const strongestCapital = sortedCapitals[0];
    const weakerCapitalLabels = sortedCapitals
      .slice(1)
      .map((capitalItem) => capitalItem.label)
      .join("和");
    const homeStatusSentence = weakerCapitalLabels
      ? `我现在了解了一下你们家的情况，目前家里的${strongestCapital.label}相对更扎实，${weakerCapitalLabels}还在继续补。`
      : `我现在了解了一下你们家的情况，目前你们家的${strongestCapital.label}是最稳的一块。`;
    sLines.push(homeStatusSentence);
    if (priorityUpgrade) {
      sLines.push(`你们已经把优先顺序放在${priorityUpgrade}，这说明你们知道先从哪里下手。`);
    } else {
      sLines.push("你们对家底已经有共识了，下一步只差把最先补的那一块定下来。");
    }
    if (capitalMatrix.length > 1) {
      sLines.push(`你们现在不是没有资源，而是在做取舍：先把短板补齐，再把优势放大。`);
    }
  } else {
    sLines.push("我正在帮你们梳理家底现状，先把经济资本、文化资本、社会资本各自的水平补齐后，这里会给出更完整的速记。");
  }

  const trendsRanked = cd.N?.trendsRanked?.value || [];
  const coreAbility = cd.N?.coreAbility?.value;
  const nLines: string[] = [];
  if (trendsRanked.length > 0 || coreAbility) {
    const trendsSentence = trendsRanked.length > 0
      ? `在眼光这块，你们已经看到外部最关键的变化是${trendsRanked[0]}。`
      : "在眼光这块，你们已经开始讨论外部变化对孩子成长的影响。";
    nLines.push(trendsSentence);
    if (trendsRanked.length > 1) {
      nLines.push(`你们也意识到还存在${trendsRanked[1]}这样的变量，所以不是单点判断。`);
    }
    if (coreAbility) {
      nLines.push(`对应地，你们想重点培养的核心能力是${coreAbility}，方向已经开始聚焦。`);
    } else {
      nLines.push("你们已经有趋势判断了，下一步把要重点培养的核心能力收拢成一句话就很完整了。");
    }
  } else {
    nLines.push("这个板块会记录你们看到的外部变化，以及你们希望重点培养的能力，现在还在收集中。");
  }

  const coreCode = cd.W?.coreCode?.value;
  const heroTraits = cd.W?.heroTraits?.value || [];
  const upgradeFrom = cd.W?.upgradeFrom?.value;
  const upgradeTo = cd.W?.upgradeTo?.value;
  const wLines: string[] = [];
  if (coreCode?.name || coreCode?.definition || heroTraits.length > 0 || upgradeFrom || upgradeTo) {
    const codeSentence = coreCode?.name
      ? `在根基这块，我读到你们家最核心的精神主线是${coreCode.name}。`
      : "在根基这块，你们已经开始把家里的底层信念说清楚了。";
    wLines.push(codeSentence);
    if (coreCode?.definition) {
      wLines.push(`你们对这条根基的解释是：${coreCode.definition}。`);
    }
    if (heroTraits.length > 0) {
      wLines.push(`你们反复提到的家族气质是${heroTraits.slice(0, 2).join("和")}。`);
    }
    if (upgradeFrom && upgradeTo) {
      wLines.push(`你们也在尝试把过去的${upgradeFrom}，慢慢调整成更适合下一代的${upgradeTo}。`);
    }
  } else {
    wLines.push("这个板块会把你们家真正影响决策的底层信念沉淀出来，现在还在整理故事和线索。");
  }

  const coreValues = cd.E?.coreValues?.value || [];
  const direction = cd.E?.direction?.value;
  const anchors = cd.E?.anchors?.value;
  const eLines: string[] = [];
  if (coreValues.length > 0 || direction || anchors) {
    const valueSentence = coreValues.length > 0
      ? `在共识这块，你们已经收拢出几条核心价值，像${coreValues.slice(0, 2).join("和")}。`
      : "在共识这块，你们已经开始把分散观点往同一个方向收拢。";
    eLines.push(valueSentence);
    if (direction) {
      eLines.push(`目前你们更偏向的家庭方向是${direction}。`);
    } else {
      eLines.push("方向感已经有雏形了，再往前一步就是定下最终的共同方向。");
    }
    if (anchors) {
      eLines.push(`你们最希望孩子具备的是${anchors.gift_to_child}，最担心缺少的是${anchors.fear_child_lacks}。`);
    }
  } else {
    eLines.push("这个板块会沉淀你们最终一致认可的价值观和方向，现在还在形成过程中。");
  }

  const sectionById: Record<"S" | "N" | "W" | "E", DigestSection> = {
    S: { id: "S", title: "现在的家底状况", lines: sLines },
    N: { id: "N", title: "我们的眼光", lines: nLines },
    W: { id: "W", title: "我们的根基", lines: wLines },
    E: { id: "E", title: "我们的共识", lines: eLines },
  };

  for (const moduleId of moduleSequence) {
    if (visibleSet.has(moduleId)) {
      sections.push(sectionById[moduleId]);
    }
  }

  return sections;
}

// ═══════════════════════════════════════════════════════════
//  A) ProgressSection
// ═══════════════════════════════════════════════════════════

function ProgressSection({
  currentStep,
  currentPhase,
  completedSteps,
  completedPhases,
  steps,
  onRestartModule,
  started,
  saveState,
  lastSavedAt,
  saveError,
}: {
  currentStep: StepId;
  currentPhase: PhaseId;
  completedSteps: StepId[];
  completedPhases: Record<StepId, PhaseId[]>;
  steps: StepInfo[];
  onRestartModule: (moduleIndex: number) => void;
  started: boolean;
  saveState: "saved" | "saving" | "error";
  lastSavedAt: Date | null;
  saveError: string | null;
}) {
  const saveHintText =
    saveState === "saving"
      ? "保存中..."
      : saveState === "error"
      ? (saveError ? `保存异常：${saveError}` : "保存异常")
      : (lastSavedAt ? `已保存 ${lastSavedAt.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}` : "已保存");

  const getStepIcon = (stepId: StepId) => {
    const isCompleted = completedSteps.includes(stepId);
    const isCurrent = currentStep === stepId;
    if (isCompleted) return <Check size={14} className="text-completed" />;
    if (isCurrent) return <span className="w-3 h-3 rounded-full bg-primary inline-block flex-shrink-0" />;
    return <span className="w-3 h-3 rounded-full border-2 border-disabled inline-block flex-shrink-0" />;
  };

  return (
    <div className="bg-card rounded-xl border border-border p-3">
      <div className="flex items-center justify-between px-2 pt-1 pb-2">
        <h3 className="text-[14px] font-semibold text-foreground">对话进度</h3>
        <span className="text-[11px] text-muted-foreground/70">{saveHintText}</span>
      </div>
      <div className="space-y-1">
        {steps.map((step) => {
          const completed = completedPhases[step.id] || [];
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = currentStep === step.id;
          const currentPhaseIndex = PHASES.indexOf(currentPhase);
          const shouldExpandTimeline = isCurrent;
          const moduleIndex = steps.findIndex((s) => s.id === step.id);
          const canRestart = started && moduleIndex >= 0 && (isCurrent || isCompleted);

          return (
            <div key={step.id} className="rounded-lg px-2 py-2">
              <div
                className={`flex items-center gap-2.5 text-[13px] transition-colors ${
                  isCurrent
                    ? "text-foreground font-medium bg-secondary/40 rounded-lg px-2 py-1.5"
                    : isCompleted
                    ? "text-foreground/80"
                    : "text-disabled"
                }`}
              >
                {getStepIcon(step.id)}
                <span className="flex-1 text-left">{step.label}</span>
                {isCurrent && (
                  <span className="text-[10px] text-primary font-medium">当前</span>
                )}
                {canRestart && (
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      onRestartModule(moduleIndex);
                    }}
                    className="text-[10px] text-muted-foreground hover:text-foreground transition-colors px-1 py-0.5 rounded hover:bg-secondary"
                    title="重开本模块"
                  >
                    <span className="inline-flex items-center gap-0.5">
                      <RotateCcw size={10} />
                      重开
                    </span>
                  </button>
                )}
                {(isCurrent || isCompleted) && (
                  <div className="w-12 h-1.5 bg-border/50 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${(completed.length / PHASES.length) * 100}%`,
                        backgroundColor: isCompleted ? "hsl(var(--completed))" : "hsl(var(--primary))",
                      }}
                    />
                  </div>
                )}
              </div>

              <div
                className={`ml-5 overflow-hidden transition-all duration-200 ${
                  shouldExpandTimeline
                    ? "mt-1.5 max-h-24 opacity-100 pl-3 border-l border-border/70 space-y-1"
                    : "mt-0 max-h-0 opacity-0 pl-0 border-l-0 space-y-0"
                }`}
              >
                {PHASES.map((phaseId, phaseIndex) => {
                  const isPhaseCompleted =
                    isCompleted ||
                    completed.includes(phaseId) ||
                    (isCurrent && currentPhaseIndex > phaseIndex);
                  const isPhaseCurrent = isCurrent && currentPhase === phaseId;
                  const phaseTextClassName = isPhaseCompleted
                    ? "text-foreground/70"
                    : isPhaseCurrent
                    ? "text-primary"
                    : "text-muted-foreground/50";
                  const phaseDotClassName = isPhaseCompleted
                    ? "bg-completed"
                    : isPhaseCurrent
                    ? "bg-primary"
                    : "bg-border";

                  return (
                    <div key={phaseId} className="flex items-center gap-2">
                      <span className={`inline-block w-1.5 h-1.5 rounded-full ${phaseDotClassName}`} />
                      <span className={`text-[11px] ${phaseTextClassName}`}>
                        {PHASE_TIMELINE_LABELS[phaseId]}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  B) ExportSection
// ═══════════════════════════════════════════════════════════

function ExportSection({
  completedSteps,
  onExport,
}: {
  completedSteps: StepId[];
  onExport: () => void;
}) {
  const [showDialog, setShowDialog] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const totalSteps = STEPS.length;
  const completionPercent = Math.round((completedSteps.length / totalSteps) * 100);
  const allComplete = completedSteps.length === totalSteps;

  return (
    <div className="bg-card rounded-xl border border-border px-3 py-2.5">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-1 pt-0.5 pb-1"
      >
        <h3 className="text-[13px] font-semibold text-foreground">导出家庭罗盘</h3>
        {collapsed ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronUp size={14} className="text-muted-foreground" />}
      </button>

      {!collapsed && (
        <div className="px-1">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
            <span>已完成 {completionPercent}%</span>
            <span>{completedSteps.length}/{totalSteps} 步骤</span>
          </div>
          <div className="w-full h-1 bg-border/40 rounded-full overflow-hidden mb-2.5">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${completionPercent}%`,
                backgroundColor: allComplete ? 'hsl(var(--completed))' : 'hsl(var(--primary))',
              }}
            />
          </div>

          <button
            onClick={() => {
              if (allComplete) {
                onExport();
              } else {
                setShowDialog(true);
              }
            }}
            className={`w-full flex items-center justify-center gap-1.5 text-[12px] font-medium rounded-lg px-3 py-1.5 transition-all whitespace-nowrap ${
              allComplete
                ? "bg-completed text-white hover:opacity-90 cursor-pointer"
                : "bg-muted text-muted-foreground cursor-default"
            }`}
          >
            <Download size={12} />
            导出家庭罗盘
          </button>

          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogContent className="sm:max-w-sm">
              <DialogHeader>
                <DialogTitle className="text-[15px]">还没完成哦</DialogTitle>
                <DialogDescription className="text-[13px] leading-relaxed pt-1">
                  你的罗盘目前完成了 {completionPercent}%，还有 {totalSteps - completedSteps.length} 个步骤未完成。要不要继续完善？
                </DialogDescription>
              </DialogHeader>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setShowDialog(false)}
                  className="flex-1 text-[13px] font-medium bg-primary text-primary-foreground rounded-lg px-3 py-2 transition-opacity hover:opacity-90"
                >
                  继续完善
                </button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  C) Key Decisions
// ═══════════════════════════════════════════════════════════

function DecisionsSection({
  sections,
  currentModuleId,
  started,
}: {
  sections: DigestSection[];
  currentModuleId: "S" | "N" | "W" | "E";
  started: boolean;
}) {
  if (!started) {
    return (
      <div className="bg-card rounded-xl border border-border p-3">
        <h3 className="text-[13px] font-semibold text-foreground px-1 pt-0.5 pb-1.5">对话要点速记</h3>
        <p className="text-[11px] text-muted-foreground/50 px-1 py-2">完成家庭代号后开始记录</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-3">
      <h3 className="text-[13px] font-semibold text-foreground px-1 pt-0.5 pb-1.5">对话要点速记</h3>

      {sections.length === 0 ? (
        <p className="text-[11px] text-muted-foreground/50 px-1 py-2">对话推进后，这里会自动整理出你们的事实状态</p>
      ) : (
        <div className="space-y-2.5 px-1">
          {sections.map((section) => (
            <div
              key={section.id}
              className={`pt-1 first:pt-0 px-2.5 py-2 rounded-md ${
                section.id === currentModuleId ? "bg-secondary/20" : "bg-transparent"
              }`}
            >
              <p className={`text-[11px] font-semibold mb-1 ${
                section.id === currentModuleId ? "text-foreground/90" : "text-muted-foreground/85"
              }`}>
                {section.title}
                {section.id === currentModuleId && (
                  <span className="ml-1.5 text-[10px] font-medium text-primary">当前</span>
                )}
              </p>
              <div className="space-y-1">
                {section.lines.map((lineText, lineIndex) => (
                  <p key={`${section.id}-${lineIndex}`} className="text-[10px] leading-relaxed text-foreground/82">
                    {lineText}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  RightRail
// ═══════════════════════════════════════════════════════════

const RightRail = (props: Props) => {
  const stepToModuleMap: Record<StepId, "S" | "N" | "W" | "E"> = {
    step1: "S",
    step2: "N",
    step3: "W",
    step4: "E",
  };
  const currentModuleId = stepToModuleMap[props.currentStep];
  const completedModuleIds = props.completedSteps
    .map((stepId) => stepToModuleMap[stepId])
    .filter((moduleId): moduleId is "S" | "N" | "W" | "E" => Boolean(moduleId));
  const visibleModuleIds: Array<"S" | "N" | "W" | "E"> = ["S", "N", "W", "E"].filter((moduleId) =>
    completedModuleIds.includes(moduleId as "S" | "N" | "W" | "E") || moduleId === currentModuleId
  ) as Array<"S" | "N" | "W" | "E">;

  const digestSections = useMemo(
    () => buildDigestSections(props.compassData, visibleModuleIds),
    [props.compassData, visibleModuleIds.join(",")]
  );

  return (
    <div className="h-full flex flex-col overflow-y-auto bg-background">
      <div className="p-4 pb-2">
        <ProgressSection
          currentStep={props.currentStep}
          currentPhase={props.currentPhase}
          completedSteps={props.completedSteps}
          completedPhases={props.completedPhases}
          steps={props.steps}
          onRestartModule={props.onRestartModule}
          started={props.started}
          saveState={props.saveState}
          lastSavedAt={props.lastSavedAt}
          saveError={props.saveError}
        />
      </div>

      <div className="px-4 pb-2">
        <ExportSection
          completedSteps={props.completedSteps}
          onExport={props.onExport}
        />
      </div>

      <div className="px-4 pb-4 flex-1 min-h-0">
        <DecisionsSection
          sections={digestSections}
          currentModuleId={currentModuleId}
          started={props.started}
        />
      </div>
    </div>
  );
};

export default RightRail;
