import { useState, useRef, useEffect } from "react";
import {
  Check,
  Download,
  FileText,
  Pencil,
  Trash2,
  Star,
  X,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { StepId, StepInfo, PhaseId } from "@/pages/Workspace";
import { PHASE_LABELS } from "@/pages/Workspace";
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
  // C) Live Notes
  notes: Note[];
  openLoops: OpenLoop[];
  onUpdateNote: (id: string, updates: Partial<Note>) => void;
  onDeleteNote: (id: string) => void;
  onResolveLoop: (id: string) => void;
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
  currentPhase,
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
  const [expandedSteps, setExpandedSteps] = useState<Record<StepId, boolean>>({
    step1: false,
    step2: false,
    step3: false,
    step4: false,
  });

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
  const completionPercent = Math.round((completedSteps.length / 4) * 100);
  const allComplete = completedSteps.length === 4;

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
                  你的罗盘目前完成了 {completionPercent}%，还有 {4 - completedSteps.length} 个步骤未完成。要不要继续完善？
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

function NoteItem({
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
    <div
      className={`group relative rounded-lg px-2.5 py-1.5 transition-colors ${
        note.isHighlight
          ? "bg-amber-50 border border-amber-200/60"
          : "bg-secondary/30 border border-transparent"
      } ${note.status === "pending" ? "border-l-2 border-l-amber-400" : ""}`}
    >
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className="text-[9px] text-muted-foreground/50 bg-secondary/50 rounded px-1 py-px">
          {note.sourceLabel}
        </span>
        {note.status === "pending" && (
          <span className="text-[9px] text-amber-600 font-medium">待确认</span>
        )}
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
        <p className={`text-[12px] leading-relaxed ${note.isHighlight ? "text-amber-800 font-semibold" : "text-foreground"}`}>
          {note.bullet}
        </p>
      )}

      {!editing && (
        <div className="absolute top-1 right-1 hidden group-hover:flex items-center gap-0.5">
          <button
            onClick={() => onUpdate({ isHighlight: !note.isHighlight })}
            className={`p-0.5 rounded transition-colors ${note.isHighlight ? "text-amber-500 hover:text-amber-600" : "text-muted-foreground/40 hover:text-amber-500"}`}
            title={note.isHighlight ? "取消重点" : "标记重点"}
          >
            <Star size={10} fill={note.isHighlight ? "currentColor" : "none"} />
          </button>
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

function NotesSection({
  notes,
  openLoops,
  onUpdateNote,
  onDeleteNote,
  onResolveLoop,
  started,
}: {
  notes: Note[];
  openLoops: OpenLoop[];
  onUpdateNote: (id: string, updates: Partial<Note>) => void;
  onDeleteNote: (id: string) => void;
  onResolveLoop: (id: string) => void;
  started: boolean;
}) {
  const activeLoops = openLoops.filter((l) => !l.resolved);

  // Group notes by module
  const groupedNotes = notes.reduce<Record<string, Note[]>>((acc, note) => {
    const key = note.moduleId || "_";
    if (!acc[key]) acc[key] = [];
    acc[key].push(note);
    return acc;
  }, {});

  return (
    <div className="bg-card rounded-xl border border-border p-3">
      <h3 className="text-[13px] font-semibold text-foreground px-1 pt-0.5 pb-1.5 flex items-center gap-1.5">
        <FileText size={13} />
        实时记录
        {notes.length > 0 && (
          <span className="text-[10px] font-normal text-muted-foreground ml-auto">
            {notes.length} 条
          </span>
        )}
      </h3>

      {/* Open Loops inline */}
      {activeLoops.length > 0 && (
        <div className="mb-2 px-1">
          <div className="rounded-lg bg-amber-50/60 border border-amber-200/40 px-2.5 py-2">
            <p className="text-[10px] font-semibold text-amber-700 flex items-center gap-1 mb-1">
              <AlertCircle size={10} />
              待确认 · {activeLoops.length} 项
            </p>
            {activeLoops.map((loop) => (
              <div key={loop.id} className="flex items-center gap-1.5 text-[11px] text-foreground/70 group py-0.5">
                <span className="w-1 h-1 rounded-full bg-amber-400 flex-shrink-0" />
                <span className="flex-1 truncate">{loop.description}</span>
                <button
                  onClick={() => onResolveLoop(loop.id)}
                  className="p-0.5 text-muted-foreground/30 hover:text-completed opacity-0 group-hover:opacity-100 transition-opacity"
                  title="标记已解决"
                >
                  <Check size={10} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes list */}
      <div className="px-1">
        {!started ? (
          <p className="text-[11px] text-muted-foreground/50 py-2">
            完成家庭代号后开始记录
          </p>
        ) : notes.length === 0 ? (
          <p className="text-[11px] text-muted-foreground/50 py-2">
            你的回答将实时出现在这里
          </p>
        ) : (
          <div className="space-y-2">
            {Object.entries(groupedNotes).map(([moduleId, moduleNotes]) => (
              <div key={moduleId}>
                {moduleId !== "_" && (
                  <p className="text-[10px] font-semibold text-muted-foreground tracking-wide mb-1">
                    {MODULE_LABELS[moduleId] || moduleId}
                  </p>
                )}
                <div className="space-y-1">
                  {moduleNotes.map((note) => (
                    <NoteItem
                      key={note.id}
                      note={note}
                      onUpdate={(updates) => onUpdateNote(note.id, updates)}
                      onDelete={() => onDeleteNote(note.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
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

      {/* C) 实时记录 — always visible, bottom */}
      <div className="px-4 pb-4 flex-1 min-h-0">
        <NotesSection
          notes={props.notes}
          openLoops={props.openLoops}
          onUpdateNote={props.onUpdateNote}
          onDeleteNote={props.onDeleteNote}
          onResolveLoop={props.onResolveLoop}
          started={props.started}
        />
      </div>
    </div>
  );
};

export default RightRail;
