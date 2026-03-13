import { useState } from "react";

const PRIORITY_TAGS = ["面子", "利益结果", "安全风险", "规则原则", "人情关系", "成绩成就", "情绪心理"];

interface Props {
  onConfirm: (data: { story: string; priorityTag?: string }) => void;
  disabled?: boolean;
}

const StoryInputCard = ({ onConfirm, disabled = false }: Props) => {
  const [story, setStory] = useState("");
  const [priorityTag, setPriorityTag] = useState<string | undefined>(undefined);
  const [confirmed, setConfirmed] = useState(false);

  const handleConfirm = () => {
    setConfirmed(true);
    onConfirm({ story, priorityTag });
  };

  if (confirmed || disabled) {
    const excerpt = story.length > 60 ? story.slice(0, 60) + "..." : story;
    return (
      <div className="bg-card border border-border rounded-xl p-4 opacity-80">
        <p className="text-[12px] text-muted-foreground mb-1">故事回忆 · 已完成</p>
        <p className="text-[12px] text-foreground">{excerpt}</p>
        {priorityTag && (
          <span className="inline-block mt-1.5 text-[12px] bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
            {priorityTag}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="bg-card border-2 border-primary/20 rounded-xl p-5 space-y-3">
      <div>
        <p className="text-[14px] font-medium text-foreground">
          回忆一个让你情绪很强烈的瞬间（骄傲/委屈/愤怒/心酸都行），你当时强烈地感觉到：「我们家的人，就会这么办。」
        </p>
        <p className="text-[12px] text-muted-foreground mt-1">
          发生了什么？你们当时怎么做的？（1–3 句话）
        </p>
      </div>

      <textarea
        value={story}
        onChange={(e) => setStory(e.target.value)}
        rows={3}
        maxLength={300}
        placeholder="比如：有一次爷爷遇到困难，他选择了……这件事让全家人都记住了……"
        className="w-full bg-secondary/40 rounded-lg px-3 py-2 text-[13px] outline-none placeholder:text-muted-foreground/40 focus:ring-1 focus:ring-primary/30 border border-border resize-none"
      />
      <p className="text-[11px] text-muted-foreground text-right">{story.length}/300</p>

      <div>
        <p className="text-[12px] text-muted-foreground mb-1.5">
          在这个故事里，你们当时最在意的是哪一个？（可选）
        </p>
        <div className="flex flex-wrap gap-2">
          {PRIORITY_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setPriorityTag((prev) => (prev === tag ? undefined : tag))}
              className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all ${
                priorityTag === tag
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

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
