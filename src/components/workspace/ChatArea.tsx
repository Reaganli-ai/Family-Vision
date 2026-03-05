import { useState, useRef, useEffect } from "react";
import { Send, User, Clock, LogOut, ThumbsUp, ThumbsDown, Copy } from "lucide-react";
import { StepId, PhaseId } from "@/pages/Workspace";
import aiAvatar from "@/assets/ai-avatar.png";

const QUICK_REPLIES = [
  "我们先从家庭代号开始吧",
  "可以先介绍一下流程吗？",
  "我想直接进入正题",
];

interface Props {
  messages: { role: "ai" | "user"; content: string; timestamp: Date }[];
  currentStep: StepId;
  currentPhase: PhaseId;
  currentQuestionIndex: number;
  totalQuestions: number;
  stepLabel: string;
  stepSubtitle: string;
  isTransitioning: boolean;
  onSendMessage: (content: string) => void;
  completedSteps: StepId[];
  onStepClick: (stepId: StepId) => void;
  stepGuide: string;
  completedPhaseCount: number;
  totalPhases: number;
  hasUserReplied: boolean;
}

const ChatArea = ({
  messages,
  currentStep,
  currentPhase,
  currentQuestionIndex,
  totalQuestions,
  stepLabel,
  stepSubtitle,
  isTransitioning,
  onSendMessage,
  completedSteps,
  onStepClick,
  stepGuide,
  completedPhaseCount,
  totalPhases,
  hasUserReplied,
}: Props) => {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = () => {
    if (!input.trim()) return;
    onSendMessage(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-background">
      {/* Top row: guidance bar + actions */}
      <div className="flex items-center gap-3 px-6 py-2">
        {/* Guidance bar — left, flexible */}
        <div className="flex-1 min-w-0 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/40 text-[11.5px] text-muted-foreground">
          <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block flex-shrink-0 animate-pulse" />
          <span className="truncate">
            {(() => {
              const stepNum = currentStep.replace("step", "");
              const label = ["一", "二", "三", "四"][Number(stepNum) - 1] || stepNum;
              if (isTransitioning) return `进入模块${label}：${stepLabel} · ${stepSubtitle}`;
              if (currentPhase === "collect") return `模块${label} 信息收集中 · 第 ${currentQuestionIndex} 题 / 共 ${totalQuestions} 题`;
              if (currentPhase === "deepen") return `模块${label} 智能追问中 · 基于你的回答深入了解`;
              return `模块${label} 确认快照 · 请确认以下内容是否准确`;
            })()}
          </span>
        </div>
        {/* Actions — right, fixed */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <button className="flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground transition-colors">
            <Clock size={14} />
            历史对话
          </button>
          <button className="flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground transition-colors">
            <LogOut size={14} />
            退出
          </button>
        </div>
      </div>

      {/* Scrollable messages */}
      <div className="flex-1 overflow-y-auto min-h-0 px-6 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((msg, i) => (
            <div
              key={i}
              className="animate-fade-in"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              {msg.role === "ai" ? (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <img
                      src={aiAvatar}
                      alt="AI"
                      className="w-9 h-9 rounded-full object-cover bg-muted"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="bg-ai-bubble rounded-2xl px-5 py-4">
                      <div className="whitespace-pre-wrap text-[14px] leading-[1.8] text-ai-bubble-foreground">
                        {msg.content.split(/(\*\*[^*]+\*\*)/).map((part, j) => {
                          if (part.startsWith("**") && part.endsWith("**")) {
                            return <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>;
                          }
                          return <span key={j}>{part}</span>;
                        })}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-1.5 ml-2">
                      <button className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                        <ThumbsUp size={13} />
                      </button>
                      <button className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                        <ThumbsDown size={13} />
                      </button>
                      <button className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                        <Copy size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex justify-end gap-3">
                  <div className="bg-user-bubble rounded-2xl px-5 py-4 text-[14px] leading-[1.8] max-w-[85%] text-user-bubble-foreground">
                    {msg.content}
                  </div>
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-9 h-9 rounded-full bg-foreground flex items-center justify-center">
                      <User size={14} className="text-background" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          {/* Quick reply chips — show when only AI messages exist */}
          {!hasUserReplied && (
            <div className="flex flex-wrap gap-2 ml-12 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              {QUICK_REPLIES.map((text) => (
                <button
                  key={text}
                  onClick={() => onSendMessage(text)}
                  className="text-[13px] border border-border rounded-full px-4 py-2 text-foreground hover:bg-secondary transition-colors"
                >
                  {text}
                </button>
              ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input area — fixed at bottom */}
      <div className="px-6 pb-4 pt-2 border-t border-border bg-background">
        <div className="max-w-3xl mx-auto">
          <div className="bg-background rounded-xl border border-border p-4">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={stepGuide || "输入你的回答..."}
              rows={2}
              className="w-full bg-transparent text-[14px] leading-[1.7] outline-none resize-none placeholder:text-disabled"
            />
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-2">
                <button className="text-[12px] text-background bg-foreground rounded-full px-4 py-1.5 transition-opacity hover:opacity-80 font-medium">
                  直接生成快照
                </button>
                <button className="text-[12px] text-muted-foreground hover:text-foreground rounded-full px-3.5 py-1.5 transition-colors">
                  跳过此题
                </button>
              </div>
              <button
                onClick={handleSubmit}
                disabled={!input.trim()}
                className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center text-background transition-opacity hover:opacity-80"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
          <p className="text-[11px] text-disabled mt-2 text-center">
            AI 生成内容仅供参考，可能存在不准确之处 · © 彼灯教育科技
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;
