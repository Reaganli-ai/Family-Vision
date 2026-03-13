import { useState, useRef, useEffect } from "react";
import {
  Check,
  Download,
  FileText,
  Pencil,
  Trash2,
  Star,
  X,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { StepId, StepInfo, PhaseId } from "@/pages/Workspace";
import { PHASE_LABELS, STEPS } from "@/pages/Workspace";
import type { Note, OpenLoop } from "@/lib/notes";

// ═══════════════════════════════════════════════════════════
//  Props
// ═══════════════════════════════════════════════════════════

interface Props {
  // A) Progress
  currentStep: StepId;
  currentPhase: PhaseId;
  completedSteps: StepId[];
  completedPhases: Record<StepId, PhaseId[]>;
  steps: StepInfo[];
  // B) Export
  onExport: () => void;
  // C) Consulting Memo
  notes: Note[];
  onUpdateNote: (id: string, updates: Partial<Note>) => void;
  onDeleteNote: (id: string) => void;
  started: boolean;
}

const PHASES: PhaseId[] = ["collect", "deepen", "confirm"];

const MODULE_LABELS: Record<string, string> = {
  S: "家底",
  N: "眼光",
  W: "根基",
  E: "共识",
};

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
//  C) NotesSection + NoteItem
// ═══════════════════════════════════════════════════════════

function FactItem({
  note,
  onUpdate,
  onDelete,
}: {
  note: Note;
  onUpdate: (updates: Partial<Note>) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note.bullet);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const save = () => {
    if (draft.trim()) {
      onUpdate({ bullet: draft.trim(), updatedAt: new Date().toISOString() });
    }
    setEditing(false);
  };

  const cancel = () => {
    setDraft(note.bullet);
    setEditing(false);
  };

  return (
    <div className="group relative rounded-lg bg-secondary/30 border border-transparent px-2.5 py-1.5 transition-colors">
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className="text-[9px] text-muted-foreground/50 bg-secondary/50 rounded px-1 py-px">
          {note.sourceLabel}
        </span>
      </div>

      {editing ? (
        <div className="space-y-1">
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
            className="w-full text-[12px] bg-background border border-border rounded px-2 py-1 outline-none resize-none focus:ring-1 focus:ring-primary/30"
          />
          <div className="flex gap-1">
            <button onClick={save} className="p-0.5 text-completed hover:opacity-80"><Check size={11} /></button>
            <button onClick={cancel} className="p-0.5 text-muted-foreground hover:opacity-80"><X size={11} /></button>
          </div>
        </div>
      ) : (
        <p className="text-[12px] leading-relaxed text-foreground font-medium">
          {note.bullet}
        </p>
      )}

      {!editing && (
        <div className="absolute top-1 right-1 hidden group-hover:flex items-center gap-0.5">
          <button onClick={() => setEditing(true)} className="p-0.5 rounded text-muted-foreground/40 hover:text-foreground transition-colors" title="编辑">
            <Pencil size={10} />
          </button>
          <button onClick={onDelete} className="p-0.5 rounded text-muted-foreground/40 hover:text-red-500 transition-colors" title="删除">
            <Trash2 size={10} />
          </button>
        </div>
      )}
    </div>
  );
}

function InsightItem({ note }: { note: Note }) {
  return (
    <div className="rounded-lg bg-blue-50/50 border border-blue-200/30 px-2.5 py-1.5">
      <div className="flex items-center gap-1 mb-0.5">
        <Lightbulb size={9} className="text-blue-500" />
        <span className="text-[9px] font-medium text-blue-600">AI解读</span>
        <span className="text-[9px] text-muted-foreground/40 ml-auto">{note.sourceLabel}</span>
      </div>
      <p className="text-[11px] leading-relaxed text-foreground/70">
        {note.bullet}
      </p>
    </div>
  );
}

function MemoSection({
  notes,
  onUpdateNote,
  onDeleteNote,
  started,
}: {
  notes: Note[];
  onUpdateNote: (id: string, updates: Partial<Note>) => void;
  onDeleteNote: (id: string) => void;
  started: boolean;
}) {
  const [showInsights, setShowInsights] = useState(true);

  const facts = notes.filter((n) => n.noteType === "fact");
  const insights = notes.filter((n) => n.noteType === "insight");

  return (
    <div className="bg-card rounded-xl border border-border p-3">
      <h3 className="text-[13px] font-semibold text-foreground px-1 pt-0.5 pb-1.5 flex items-center gap-1.5">
        <FileText size={13} />
        咨询纪要
      </h3>

      <div className="px-1">
        {!started ? (
          <p className="text-[11px] text-muted-foreground/50 py-2">
            完成家庭代号后开始记录
          </p>
        ) : facts.length === 0 ? (
          <p className="text-[11px] text-muted-foreground/50 py-2">
            你的决策将实时出现在这里
          </p>
        ) : (
          <div className="space-y-1.5">
            {/* Fact memos */}
            {facts.map((note) => (
              <FactItem
                key={note.id}
                note={note}
                onUpdate={(updates) => onUpdateNote(note.id, updates)}
                onDelete={() => onDeleteNote(note.id)}
              />
            ))}

            {/* AI Insights (collapsible) */}
            {insights.length > 0 && (
              <div className="pt-1">
                <button
                  onClick={() => setShowInsights(!showInsights)}
                  className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors mb-1"
                >
                  {showInsights ? <EyeOff size={10} /> : <Eye size={10} />}
                  {showInsights ? "隐藏" : "显示"} AI 洞察（{insights.length}）
                </button>
                {showInsights && (
                  <div className="space-y-1">
                    {insights.map((note) => (
                      <InsightItem key={note.id} note={note} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
//  RightRail — combines all three sections
// ═══════════════════════════════════════════════════════════

const RightRail = (props: Props) => {
  return (
    <div className="h-full flex flex-col overflow-y-auto bg-background">
      {/* A) 对话进度 — always visible, top */}
      <div className="p-4 pb-2">
        <ProgressSection
          currentStep={props.currentStep}
          currentPhase={props.currentPhase}
          completedSteps={props.completedSteps}
          completedPhases={props.completedPhases}
          steps={props.steps}
        />
      </div>

      {/* B) 导出家庭罗盘 — always visible, middle, collapsible */}
      <div className="px-4 pb-2">
        <ExportSection
          completedSteps={props.completedSteps}
          onExport={props.onExport}
        />
      </div>

      {/* C) 咨询纪要 — always visible, bottom */}
      <div className="px-4 pb-4 flex-1 min-h-0">
        <MemoSection
          notes={props.notes}
          onUpdateNote={props.onUpdateNote}
          onDeleteNote={props.onDeleteNote}
          started={props.started}
        />
      </div>
    </div>
  );
};

export default RightRail;
