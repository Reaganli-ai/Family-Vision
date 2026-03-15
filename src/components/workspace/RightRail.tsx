import { useState, useMemo } from "react";
import {
  Check,
  Download,
  ChevronDown,
  ChevronUp,
  Circle,
  AlertCircle,
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
}

const PHASES: PhaseId[] = ["collect", "deepen", "confirm"];

const MODULE_COLORS: Record<string, string> = {
  S: "bg-emerald-50 text-emerald-700 border-emerald-200",
  N: "bg-blue-50 text-blue-700 border-blue-200",
  W: "bg-amber-50 text-amber-700 border-amber-200",
  E: "bg-purple-50 text-purple-700 border-purple-200",
};

const MODULE_LABELS: Record<string, string> = {
  S: "家底",
  N: "眼光",
  W: "根基",
  E: "共识",
};

// ═══════════════════════════════════════════════════════════
//  Data extraction
// ═══════════════════════════════════════════════════════════

interface Decision { moduleId: string; tag: string; value: string; }
interface Pending { moduleId: string; label: string; }

function extractDecisions(cd: CompassDataSchema, completedModules: string[]): Decision[] {
  const decisions: Decision[] = [];
  const add = (mod: string, tag: string, val: unknown) => {
    if (!completedModules.includes(mod) && mod !== "_") return;
    if (val && typeof val === "string" && val.length > 0) {
      decisions.push({ moduleId: mod, tag, value: val });
    }
  };

  // S
  const matrix = cd.S?.capitalMatrix?.value;
  if (Array.isArray(matrix) && matrix.length > 0) {
    const summary = matrix.map((r: { label: string; level: string }) => `${r.label.slice(0, 2)}${r.level}`).join(" ");
    decisions.push({ moduleId: "S", tag: "资本", value: summary });
  }
  add("S", "优先升级", cd.S?.priorityUpgrade?.value);

  // N
  const trends = cd.N?.trendsRanked?.value;
  if (Array.isArray(trends) && trends.length > 0) {
    add("N", "主假设", trends[0]);
  }
  add("N", "能力押注", cd.N?.coreAbility?.value);

  // W
  const coreCode = cd.W?.coreCode?.value;
  if (coreCode && typeof coreCode === "object" && "name" in coreCode) {
    add("W", "家风内核", (coreCode as { name: string }).name);
  }
  const upgFrom = cd.W?.upgradeFrom?.value;
  const upgTo = cd.W?.upgradeTo?.value;
  if (upgFrom && upgTo) {
    decisions.push({ moduleId: "W", tag: "升级", value: `${upgFrom} → ${upgTo}` });
  }

  // E
  const values = cd.E?.coreValues?.value;
  if (Array.isArray(values) && values.length > 0) {
    add("E", "价值观", values.slice(0, 3).join("、"));
  }
  const dir = cd.E?.direction?.value;
  if (typeof dir === "string") {
    add("E", "方向", dir.split("·")[0]?.trim() || dir);
  }

  return decisions;
}

function extractPending(cd: CompassDataSchema, currentModuleId: string): Pending[] {
  const pending: Pending[] = [];

  // Only show pending for current and past modules
  const moduleOrder = ["S", "N", "W", "E"];
  const currentIdx = moduleOrder.indexOf(currentModuleId);

  for (let i = 0; i <= currentIdx; i++) {
    const mod = moduleOrder[i];
    if (mod === "S") {
      if (!cd.S?.capitalMatrix?.value) pending.push({ moduleId: "S", label: "资本矩阵" });
      if (!cd.S?.priorityUpgrade?.value) pending.push({ moduleId: "S", label: "优先升级选择" });
    }
    if (mod === "N") {
      if (!cd.N?.trendsRanked?.value) pending.push({ moduleId: "N", label: "趋势排序" });
      if (!cd.N?.coreAbility?.value) pending.push({ moduleId: "N", label: "能力押注" });
    }
    if (mod === "W") {
      if (!cd.W?.story?.value) pending.push({ moduleId: "W", label: "故事回忆" });
      if (!cd.W?.coreCode?.value) pending.push({ moduleId: "W", label: "家风命名" });
    }
    if (mod === "E") {
      if (!cd.E?.coreValues?.value) pending.push({ moduleId: "E", label: "价值观选择" });
      if (!cd.E?.direction?.value) pending.push({ moduleId: "E", label: "战略方向" });
    }
  }

  return pending;
}

// ═══════════════════════════════════════════════════════════
//  A) ProgressSection
// ═══════════════════════════════════════════════════════════

function ProgressSection({
  currentStep,
  completedSteps,
  completedPhases,
  steps,
}: {
  currentStep: StepId;
  currentPhase: PhaseId;
  completedSteps: StepId[];
  completedPhases: Record<StepId, PhaseId[]>;
  steps: StepInfo[];
}) {
  const getStepIcon = (stepId: StepId) => {
    const isCompleted = completedSteps.includes(stepId);
    const isCurrent = currentStep === stepId;
    if (isCompleted) return <Check size={14} className="text-completed" />;
    if (isCurrent) return <span className="w-3 h-3 rounded-full bg-primary inline-block flex-shrink-0" />;
    return <span className="w-3 h-3 rounded-full border-2 border-disabled inline-block flex-shrink-0" />;
  };

  return (
    <div className="bg-card rounded-xl border border-border p-3">
      <h3 className="text-[14px] font-semibold text-foreground px-2 pt-1 pb-2">对话进度</h3>
      <div className="space-y-1">
        {steps.map((step) => {
          const completed = completedPhases[step.id] || [];
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = currentStep === step.id;

          return (
            <div
              key={step.id}
              className={`flex items-center gap-2.5 px-2 py-2 rounded-lg text-[13px] transition-colors ${
                isCurrent
                  ? "text-foreground font-medium bg-secondary/40"
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
              {(isCurrent || isCompleted) && (
                <div className="w-12 h-1.5 bg-border/50 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${(completed.length / PHASES.length) * 100}%`,
                      backgroundColor: isCompleted ? 'hsl(var(--completed))' : 'hsl(var(--primary))',
                    }}
                  />
                </div>
              )}
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
  decisions,
  pending,
  started,
}: {
  decisions: Decision[];
  pending: Pending[];
  started: boolean;
}) {
  if (!started) {
    return (
      <div className="bg-card rounded-xl border border-border p-3">
        <h3 className="text-[13px] font-semibold text-foreground px-1 pt-0.5 pb-1.5">关键决策</h3>
        <p className="text-[11px] text-muted-foreground/50 px-1 py-2">完成家庭代号后开始记录</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-3">
      <h3 className="text-[13px] font-semibold text-foreground px-1 pt-0.5 pb-1.5">关键决策</h3>

      {decisions.length === 0 && pending.length === 0 ? (
        <p className="text-[11px] text-muted-foreground/50 px-1 py-2">你的决策将实时出现在这里</p>
      ) : (
        <div className="space-y-1 px-1">
          {/* Completed decisions */}
          {decisions.map((d, i) => (
            <div key={i} className={`flex items-start gap-2 rounded-lg px-2 py-1.5 border ${MODULE_COLORS[d.moduleId] || "bg-secondary/30 text-foreground border-border"}`}>
              <span className="text-[10px] font-bold shrink-0 mt-0.5">{MODULE_LABELS[d.moduleId] || d.moduleId}</span>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] opacity-70">{d.tag}：</span>
                <span className="text-[11px] font-medium">{d.value}</span>
              </div>
            </div>
          ))}

          {/* Pending items */}
          {pending.length > 0 && (
            <div className="pt-1.5 border-t border-border mt-1.5">
              <div className="flex items-center gap-1 mb-1">
                <AlertCircle size={10} className="text-muted-foreground/50" />
                <span className="text-[10px] text-muted-foreground/50">待完成</span>
              </div>
              {pending.map((p, i) => (
                <div key={i} className="flex items-center gap-2 px-2 py-1 text-[11px] text-muted-foreground/60">
                  <Circle size={8} className="shrink-0" />
                  <span>{MODULE_LABELS[p.moduleId]}：{p.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  RightRail
// ═══════════════════════════════════════════════════════════

const STEP_TO_MODULE: Record<StepId, string> = {
  step1: "S", step2: "N", step3: "W", step4: "E",
};

const RightRail = (props: Props) => {
  const completedModuleIds = props.completedSteps.map((s) => STEP_TO_MODULE[s]);
  const currentModuleId = STEP_TO_MODULE[props.currentStep] || "S";

  const decisions = useMemo(
    () => extractDecisions(props.compassData, [...completedModuleIds, currentModuleId]),
    [props.compassData, completedModuleIds.join(","), currentModuleId]
  );

  const pending = useMemo(
    () => extractPending(props.compassData, currentModuleId),
    [props.compassData, currentModuleId]
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
          decisions={decisions}
          pending={pending}
          started={props.started}
        />
      </div>
    </div>
  );
};

export default RightRail;
