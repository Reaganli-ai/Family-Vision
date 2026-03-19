import { useState } from "react";

interface Props {
  onConfirm: (data: { story: string }) => void;
  disabled?: boolean;
}

const StoryInputCard = ({ onConfirm, disabled = false }: Props) => {
  const [story, setStory] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = () => {
    if (!story.trim()) return;
    setConfirmed(true);
    onConfirm({ story });
  };

  if (confirmed || disabled) {
    const excerpt = story.length > 60 ? story.slice(0, 60) + "..." : story;
    return (
      <div className="bg-card border border-border rounded-xl p-4 opacity-80">
        <p className="text-[12px] text-muted-foreground mb-1">故事回忆 · 已完成</p>
        <p className="text-[12px] text-foreground">{excerpt}</p>
      </div>
    );
  }

  return (
    <div className="bg-card border-2 border-primary/20 rounded-xl p-5 space-y-3">
      <div>
        <p className="text-[14px] font-medium text-foreground">
          把你印象最深的那个瞬间，用 1–3 句话写下来
        </p>
        <p className="text-[12px] text-muted-foreground mt-1">
          发生了什么？你们当时怎么做的？
        </p>
      </div>

      <textarea
        value={story}
        onChange={(e) => setStory(e.target.value)}
        rows={3}
        maxLength={300}
        autoFocus
        placeholder="比如：有一次爷爷遇到困难，他选择了……这件事让全家人都记住了……"
        className="w-full bg-secondary/40 rounded-lg px-3 py-2 text-[13px] outline-none placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary/30 border border-border resize-none"
      />
      <p className="text-[11px] text-muted-foreground text-right">{story.length}/300</p>

      <div className="flex justify-end pt-1">
        <button
          onClick={handleConfirm}
          disabled={!story.trim()}
          className="px-5 py-2 rounded-lg text-[13px] font-medium transition-all bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          确认 →
        </button>
      </div>
    </div>
  );
};

export default StoryInputCard;
