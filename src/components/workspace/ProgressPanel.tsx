import { useState } from "react";
import { Check, Download, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { StepId, StepInfo, PhaseId, PHASE_LABELS } from "@/pages/Workspace";

const PHASES: PhaseId[] = ["collect", "deepen", "confirm"];

interface Props {
  currentStep: StepId;
  currentPhase: PhaseId;
  completedSteps: StepId[];
  completedPhases: Record<StepId, PhaseId[]>;
  steps: StepInfo[];
  conversationSummary: string;
}

const ProgressPanel = ({
  currentStep,
  currentPhase,
  completedSteps,
  completedPhases,
  steps,
  conversationSummary,
}: Props) => {
  const [expandedSteps, setExpandedSteps] = useState<Record<StepId, boolean>>({
    step1: false,
    step2: false,
    step3: false,
    step4: false,
  });
  const [showExportConfirm, setShowExportConfirm] = useState(false);

  const completionPercent = Math.round((completedSteps.length / 4) * 100);
  const allComplete = completedSteps.length === 4;

  const getExpanded = (stepId: StepId) => {
    if (stepId === currentStep) return true;
    return expandedSteps[stepId] ?? false;
  };

  const toggleStep = (stepId: StepId) => {
    if (stepId === currentStep) return;
    setExpandedSteps((prev) => ({ ...prev, [stepId]: !prev[stepId] }));
  };

  const getStepIcon = (stepId: StepId) => {
    const isCompleted = completedSteps.includes(stepId);
    const isCurrent = currentStep === stepId;
    if (isCompleted) return <Check size={14} className="text-completed" />;
    if (isCurrent) return <span className="w-3 h-3 rounded-full bg-primary inline-block flex-shrink-0" />;
    return <span className="w-3 h-3 rounded-full border-2 border-disabled inline-block flex-shrink-0" />;
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto bg-background">
      {/* Section 1: 对话进度 */}
      <div className="p-4">
        <div className="bg-card rounded-xl border border-border p-3">
          <h3 className="text-[14px] font-semibold text-foreground px-2 pt-1 pb-2">对话进度</h3>
          <div className="space-y-1">
          {steps.map((step) => {
            const completed = completedPhases[step.id] || [];
            const isCompleted = completedSteps.includes(step.id);
            const isCurrent = currentStep === step.id;
            const isExpanded = getExpanded(step.id);

            return (
              <div key={step.id}>
                <button
                  onClick={() => toggleStep(step.id)}
                  className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-[13px] transition-colors ${
                    isCurrent
                      ? "text-foreground font-medium bg-secondary/40"
                      : isCompleted
                      ? "text-foreground/80 hover:bg-secondary/30"
                      : "text-disabled"
                  }`}
                >
                  {getStepIcon(step.id)}
                  <span className="flex-1 text-left">
                    Step {step.id.replace("step", "")} {step.label}
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] text-primary font-medium">当前</span>
                  )}
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] ${isCompleted ? "text-completed" : "text-muted-foreground"}`}>
                      {completed.length}/{PHASES.length}
                    </span>
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
                </button>

                {isExpanded && (
                  <div className="ml-7 pl-3 border-l border-border/60 space-y-0.5 py-1 mb-1">
                    {PHASES.map((phase) => {
                      const isDone = completed.includes(phase);
                      const isActive = isCurrent && currentPhase === phase && !isDone;
                      return (
                        <div
                          key={phase}
                          className={`flex items-center gap-2 py-1.5 text-[12px] ${
                            isActive
                              ? "text-primary font-medium"
                              : isDone
                              ? "text-completed"
                              : "text-disabled"
                          }`}
                        >
                          {isDone ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-completed inline-block" />
                          ) : isActive ? (
                            <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-disabled inline-block" />
                          )}
                          <span>{PHASE_LABELS[phase]}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          </div>
        </div>
      </div>

      {/* Section 2: 导出家庭罗盘 */}
      <div className="px-4 pb-3">
        <div className="bg-card rounded-xl border border-border px-3 py-2.5">
          <h3 className="text-[13px] font-semibold text-foreground px-1 pt-0.5 pb-1.5">导出家庭罗盘</h3>
          <div className="px-1">
            {/* Completion bar */}
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
              <span>已完成 {completionPercent}%</span>
              <span>{completedSteps.length}/4 步骤</span>
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
                  const date = new Date().toLocaleDateString("zh-CN");
                  const sections = (conversationSummary || "暂无总结内容")
                    .split("---")
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .map((section) => {
                      const lines = section.split("\n");
                      const title = lines[0] || "";
                      const body = lines.slice(1).join("\n").trim();
                      return `<div class="section"><h2>${title}</h2><p>${body}</p></div>`;
                    })
                    .join("");
                  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>家庭战略定位罗盘</title><style>@media print{@page{margin:20mm 15mm;}body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:-apple-system,"PingFang SC","Noto Sans SC",sans-serif;max-width:700px;margin:0 auto;padding:40px 24px;color:#2D2A26;}.header{text-align:center;margin-bottom:40px;border-bottom:2px solid #187A4B;padding-bottom:20px;}.header h1{font-size:24px;letter-spacing:2px;margin-bottom:6px;}.header .date{color:#999;font-size:13px;}.section{margin-bottom:28px;page-break-inside:avoid;}.section h2{font-size:15px;color:#187A4B;margin-bottom:10px;padding-left:12px;border-left:3px solid #187A4B;}.section p{font-size:14px;line-height:1.9;color:#444;white-space:pre-wrap;padding-left:15px;}.footer{margin-top:48px;text-align:center;color:#ccc;font-size:11px;border-top:1px solid #eee;padding-top:16px;}.no-print{text-align:center;margin-bottom:24px;}.no-print button{background:#187A4B;color:white;border:none;padding:10px 32px;border-radius:8px;font-size:14px;cursor:pointer;font-family:inherit;}.no-print button:hover{opacity:0.9;}@media print{.no-print{display:none;}}</style></head><body><div class="no-print"><button onclick="window.print()">保存为 PDF / 打印</button></div><div class="header"><h1>家庭战略定位罗盘</h1><p class="date">生成日期：${date}</p></div>${sections}<div class="footer">&copy; 彼灯教育科技 · 家庭愿景工坊</div></body></html>`;
                  const w = window.open("", "_blank");
                  if (w) {
                    w.document.write(html);
                    w.document.close();
                  }
                } else {
                  setShowExportConfirm(true);
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

            <Dialog open={showExportConfirm} onOpenChange={setShowExportConfirm}>
              <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                  <DialogTitle className="text-[15px]">还没完成哦</DialogTitle>
                  <DialogDescription className="text-[13px] leading-relaxed pt-1">
                    你的罗盘目前完成了 {completionPercent}%，还有 {4 - completedSteps.length} 个步骤未完成。要不要继续完善？
                  </DialogDescription>
                </DialogHeader>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setShowExportConfirm(false)}
                    className="flex-1 text-[13px] font-medium bg-primary text-primary-foreground rounded-lg px-3 py-2 transition-opacity hover:opacity-90"
                  >
                    继续完善
                  </button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Section 3: 对话总结 — only shown when summary exists */}
      {conversationSummary && (
        <div className="px-4 pb-4">
          <div className="bg-card rounded-xl border border-border p-3">
            <h3 className="text-[14px] font-semibold text-foreground px-2 pt-1 pb-2 flex items-center gap-2">
              <FileText size={14} />
              对话总结
            </h3>
            <p className="text-[13px] text-muted-foreground leading-relaxed px-2 whitespace-pre-wrap">
              {conversationSummary}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressPanel;
