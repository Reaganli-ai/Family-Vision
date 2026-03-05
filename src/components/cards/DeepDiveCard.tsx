import { useState } from "react";

/**
 * Optional deep-dive card. Only shown if user opted in.
 * Structured single-select + optional comment — no free-form AI.
 *
 * State machine: CONFIRM(agreed) → OPT_IN → [this] → PRIORITY_SELECT
 */

interface DeepDiveQuestion {
  question: string;
  options: string[];
  commentPlaceholder?: string;
}

interface Props {
  questions: DeepDiveQuestion[];
  onConfirm: (answers: { option: string; comment: string }[]) => void;
  disabled?: boolean;
}

const DeepDiveCard = ({ questions, onConfirm, disabled }: Props) => {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<{ option: string; comment: string }[]>(
    questions.map(() => ({ option: "", comment: "" }))
  );

  const q = questions[currentQ];
  const answer = answers[currentQ];
  const isLast = currentQ === questions.length - 1;

  if (disabled) {
    return (
      <div className="bg-card rounded-xl border border-border p-5 opacity-70">
        <p className="text-[12px] text-muted-foreground mb-1">深入思考 · 已完成</p>
        {answers.map((a, i) => (
          <p key={i} className="text-[13px] text-foreground">
            {questions[i].question}：{a.option}
            {a.comment && <span className="text-muted-foreground"> · {a.comment}</span>}
          </p>
        ))}
      </div>
    );
  }

  const updateAnswer = (field: "option" | "comment", value: string) => {
    setAnswers((prev) =>
      prev.map((a, i) => (i === currentQ ? { ...a, [field]: value } : a))
    );
  };

  const handleNext = () => {
    if (isLast) {
      onConfirm(answers);
    } else {
      setCurrentQ((prev) => prev + 1);
    }
  };

  return (
    <div className="bg-card rounded-xl border-2 border-primary/20 p-5 space-y-4 max-w-lg">
      <div>
        <p className="text-[11px] text-muted-foreground mb-1">
          深入思考 · {currentQ + 1}/{questions.length}
        </p>
        <p className="text-[14px] font-semibold text-foreground">{q.question}</p>
      </div>

      <div className="space-y-2">
        {q.options.map((opt) => (
          <button
            key={opt}
            onClick={() => updateAnswer("option", opt)}
            className={`w-full text-left px-4 py-2.5 rounded-lg text-[13px] transition-all border ${
              answer.option === opt
                ? "border-primary bg-primary/5 text-foreground font-medium"
                : "border-border bg-background text-muted-foreground hover:border-primary/30"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>

      {q.commentPlaceholder && (
        <div>
          <p className="text-[11.5px] text-muted-foreground mb-1">补充说明（可选）</p>
          <textarea
            value={answer.comment}
            onChange={(e) => updateAnswer("comment", e.target.value)}
            placeholder={q.commentPlaceholder}
            rows={2}
            maxLength={200}
            className="w-full border border-border rounded-lg px-3 py-2 text-[13px] outline-none resize-none focus:ring-1 focus:ring-primary/30 placeholder:text-muted-foreground/40"
          />
        </div>
      )}

      <button
        onClick={handleNext}
        disabled={!answer.option}
        className="w-full text-[13px] font-medium bg-foreground text-background rounded-lg py-2.5 hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isLast ? "完成 →" : "下一题 →"}
      </button>
    </div>
  );
};

export default DeepDiveCard;
