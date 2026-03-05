import { useState, useRef, useEffect } from "react";
import {
  Pencil,
  Trash2,
  Star,
  Check,
  X,
  AlertCircle,
  Download,
  FileText,
} from "lucide-react";
import type { Note, OpenLoop } from "@/lib/notes";
import { SOURCE_LABELS } from "@/lib/notes";

// ─── Module labels ──────────────────────────────────────

const MODULE_LABELS: Record<string, string> = {
  S: "家底",
  N: "眼光",
  W: "根基",
  E: "共识",
};

// ─── Props ──────────────────────────────────────────────

interface Props {
  notes: Note[];
  openLoops: OpenLoop[];
  onUpdateNote: (id: string, updates: Partial<Note>) => void;
  onDeleteNote: (id: string) => void;
  onResolveLoop: (id: string) => void;
  onNavigateToLoop: (loop: OpenLoop) => void;
  allConfirmed: boolean;
  onExport: () => void;
  started: boolean;
}

// ─── NoteItem ───────────────────────────────────────────

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
      className={`group relative rounded-lg px-3 py-2 transition-colors ${
        note.isHighlight
          ? "bg-amber-50 border border-amber-200/60"
          : "bg-secondary/30 border border-transparent"
      } ${note.status === "pending" ? "border-l-2 border-l-amber-400" : ""}`}
    >
      {/* Source tag */}
      <div className="flex items-center gap-1.5 mb-1">
        <span className="text-[10px] text-muted-foreground/60 bg-secondary/50 rounded px-1.5 py-0.5">
          {note.sourceLabel}
        </span>
        {note.status === "pending" && (
          <span className="text-[10px] text-amber-600 font-medium">待确认</span>
        )}
      </div>

      {editing ? (
        <div className="space-y-1.5">
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
            className="w-full text-[12.5px] bg-background border border-border rounded px-2 py-1.5 outline-none resize-none focus:ring-1 focus:ring-primary/30"
          />
          <div className="flex gap-1">
            <button onClick={save} className="p-1 text-completed hover:opacity-80">
              <Check size={12} />
            </button>
            <button onClick={cancel} className="p-1 text-muted-foreground hover:opacity-80">
              <X size={12} />
            </button>
          </div>
        </div>
      ) : (
        <p
          className={`text-[12.5px] leading-relaxed ${
            note.isHighlight ? "text-amber-800 font-semibold" : "text-foreground"
          }`}
        >
          {note.bullet}
        </p>
      )}

      {/* Hover actions */}
      {!editing && (
        <div className="absolute top-1.5 right-1.5 hidden group-hover:flex items-center gap-0.5">
          <button
            onClick={() => onUpdate({ isHighlight: !note.isHighlight })}
            className={`p-1 rounded transition-colors ${
              note.isHighlight
                ? "text-amber-500 hover:text-amber-600"
                : "text-muted-foreground/40 hover:text-amber-500"
            }`}
            title={note.isHighlight ? "取消重点" : "标记重点"}
          >
            <Star size={11} fill={note.isHighlight ? "currentColor" : "none"} />
          </button>
          <button
            onClick={() => setEditing(true)}
            className="p-1 rounded text-muted-foreground/40 hover:text-foreground transition-colors"
            title="编辑"
          >
            <Pencil size={11} />
          </button>
          <button
            onClick={onDelete}
            className="p-1 rounded text-muted-foreground/40 hover:text-red-500 transition-colors"
            title="删除"
          >
            <Trash2 size={11} />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main component ─────────────────────────────────────

const LiveNotesPanel = ({
  notes,
  openLoops,
  onUpdateNote,
  onDeleteNote,
  onResolveLoop,
  onNavigateToLoop,
  allConfirmed,
  onExport,
  started,
}: Props) => {
  // Group notes by module
  const groupedNotes = notes.reduce<Record<string, Note[]>>((acc, note) => {
    const key = note.moduleId || "_";
    if (!acc[key]) acc[key] = [];
    acc[key].push(note);
    return acc;
  }, {});

  const activeLoops = openLoops.filter((l) => !l.resolved);
  const confirmedCount = notes.filter((n) => n.status === "confirmed").length;
  const pendingCount = notes.filter((n) => n.status === "pending").length;

  return (
    <div className="h-full flex flex-col overflow-y-auto bg-background">
      {/* Section 1: Live Notes */}
      <div className="p-4 flex-1">
        <div className="bg-card rounded-xl border border-border">
          {/* Header */}
          <div className="px-3 pt-3 pb-2 border-b border-border/50">
            <div className="flex items-center justify-between">
              <h3 className="text-[13px] font-semibold text-foreground flex items-center gap-1.5">
                <FileText size={13} />
                Live Notes
              </h3>
              {notes.length > 0 && (
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <span>{confirmedCount} 已确认</span>
                  {pendingCount > 0 && (
                    <span className="text-amber-600">{pendingCount} 待确认</span>
                  )}
                </div>
              )}
            </div>
            <p className="text-[10.5px] text-muted-foreground mt-0.5">
              实时记录你的每一个选择和判断
            </p>
          </div>

          {/* Notes body */}
          <div className="px-3 py-2">
            {!started ? (
              <p className="text-[12px] text-muted-foreground/50 text-center py-6">
                确认家庭代号后开始记录
              </p>
            ) : notes.length === 0 ? (
              <p className="text-[12px] text-muted-foreground/50 text-center py-6">
                你的回答将实时出现在这里
              </p>
            ) : (
              <div className="space-y-3">
                {Object.entries(groupedNotes).map(([moduleId, moduleNotes]) => (
                  <div key={moduleId}>
                    {moduleId !== "_" && (
                      <p className="text-[10.5px] font-semibold text-muted-foreground tracking-wide mb-1.5 px-1">
                        {MODULE_LABELS[moduleId] || moduleId}
                      </p>
                    )}
                    <div className="space-y-1.5">
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
      </div>

      {/* Section 2: Open Loops — only when there are active ones */}
      {activeLoops.length > 0 && (
        <div className="px-4 pb-3">
          <div className="bg-card rounded-xl border border-amber-200/60">
            <div className="px-3 pt-2.5 pb-2">
              <h3 className="text-[12px] font-semibold text-amber-700 flex items-center gap-1.5">
                <AlertCircle size={12} />
                待确认 · {activeLoops.length} 项
              </h3>
            </div>
            <div className="px-3 pb-2.5 space-y-1.5">
              {activeLoops.map((loop) => (
                <div
                  key={loop.id}
                  className="flex items-center gap-2 text-[12px] group"
                >
                  <span className="w-1 h-1 rounded-full bg-amber-400 flex-shrink-0" />
                  <span className="flex-1 text-foreground/80">{loop.description}</span>
                  <button
                    onClick={() => onNavigateToLoop(loop)}
                    className="text-[10px] text-primary opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap"
                  >
                    去修正
                  </button>
                  <button
                    onClick={() => onResolveLoop(loop.id)}
                    className="p-0.5 text-muted-foreground/30 hover:text-completed opacity-0 group-hover:opacity-100 transition-opacity"
                    title="标记已解决"
                  >
                    <Check size={11} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Section 3: Deliverables — bottom, subdued */}
      {started && notes.length >= 3 && (
        <div className="px-4 pb-4">
          <div className="bg-card rounded-xl border border-border px-3 py-2.5">
            <button
              onClick={onExport}
              disabled={!allConfirmed}
              className={`w-full flex items-center justify-center gap-1.5 text-[12px] font-medium rounded-lg px-3 py-2 transition-all whitespace-nowrap ${
                allConfirmed
                  ? "bg-completed text-white hover:opacity-90 cursor-pointer"
                  : "bg-muted text-muted-foreground/50 cursor-not-allowed"
              }`}
            >
              <Download size={12} />
              {allConfirmed ? "导出家庭罗盘" : `完成所有确认后可导出`}
            </button>
            {!allConfirmed && pendingCount > 0 && (
              <p className="text-[10px] text-amber-600 text-center mt-1.5">
                还有 {pendingCount} 项待确认
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveNotesPanel;
