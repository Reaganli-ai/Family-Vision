import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Send, User, Clock, LogOut, ThumbsUp, ThumbsDown, Copy } from "lucide-react";
import { StepId, PhaseId, type Message } from "@/pages/Workspace";
import aiAvatar from "@/assets/ai-avatar.png";
import CapitalMatrixCard from "@/components/cards/CapitalMatrixCard";
import SingleSelectCard from "@/components/cards/SingleSelectCard";
import TagSelectCard from "@/components/cards/TagSelectCard";
import KeywordFillCard from "@/components/cards/KeywordFillCard";
import SnapshotCard from "@/components/cards/SnapshotCard";
import ValueGalleryCard from "@/components/cards/ValueGalleryCard";
import PrioritySelectCard from "@/components/cards/PrioritySelectCard";
import AgreeDisagreeCard from "@/components/cards/AgreeDisagreeCard";
import SpiritUpgradeCard from "@/components/cards/SpiritUpgradeCard";
import FamilyCodeCard from "@/components/cards/FamilyCodeCard";
import CapitalSummaryCard from "@/components/cards/CapitalSummaryCard";
import OptInCard from "@/components/cards/OptInCard";
import DeepDiveCard from "@/components/cards/DeepDiveCard";

const QUICK_REPLIES = [
  "我们先从家庭代号开始吧",
  "可以先介绍一下流程吗？",
  "我想直接进入正题",
];

interface Props {
  messages: Message[];
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
  isAiTyping?: boolean;
  streamingContent?: string;
  onCardConfirm?: (cardType: string, data: unknown) => void;
}

const ChatArea = ({
  messages,
  currentStep,
  currentPhase,
  stepLabel,
  stepSubtitle,
  isTransitioning,
  onSendMessage,
  stepGuide,
  hasUserReplied,
  isAiTyping = false,
  streamingContent = "",
  onCardConfirm,
}: Props) => {
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const handleSubmit = () => {
    if (!input.trim() || isAiTyping) return;
    onSendMessage(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const renderCard = (msg: Message, index: number) => {
    const confirmed = index < messages.length - 1; // cards before the last message are confirmed
    const handleConfirm = (data: unknown) => {
      onCardConfirm?.(msg.cardType!, data);
    };

    switch (msg.cardType) {
      case "capital-matrix":
        return <CapitalMatrixCard onConfirm={handleConfirm} disabled={confirmed} />;
      case "single-select":
        return (
          <SingleSelectCard
            question={(msg.cardProps?.question as string) || ""}
            options={(msg.cardProps?.options as string[]) || []}
            onConfirm={(selected) => handleConfirm(selected)}
            disabled={confirmed}
          />
        );
      case "tag-select":
        return (
          <TagSelectCard
            question={(msg.cardProps?.question as string) || ""}
            subtitle={(msg.cardProps?.subtitle as string) || undefined}
            tags={(msg.cardProps?.tags as string[]) || []}
            maxSelect={(msg.cardProps?.maxSelect as number) || 1}
            selectHint={(msg.cardProps?.selectHint as string) || undefined}
            customPlaceholder={(msg.cardProps?.customPlaceholder as string) || undefined}
            confirmText={(msg.cardProps?.confirmText as string) || undefined}
            onConfirm={(selected) => handleConfirm(selected)}
            disabled={confirmed}
          />
        );
      case "keyword-fill":
        return (
          <KeywordFillCard
            fields={(msg.cardProps?.fields as { label: string; placeholder?: string }[]) || []}
            onConfirm={(values) => handleConfirm(values)}
            disabled={confirmed}
          />
        );
      case "snapshot":
        return (
          <SnapshotCard
            title={(msg.cardProps?.title as string) || "快照"}
            content={(msg.cardProps?.content as string) || ""}
            onConfirm={(text) => handleConfirm(text)}
            disabled={confirmed}
          />
        );
      case "short-text":
        return (
          <KeywordFillCard
            fields={[{
              label: (msg.cardProps?.question as string) || "请描述",
              placeholder: (msg.cardProps?.placeholder as string) || "请填写...",
            }]}
            onConfirm={(values) => {
              const firstValue = Object.values(values)[0];
              handleConfirm(firstValue);
            }}
            disabled={confirmed}
          />
        );
      case "value-gallery":
        return (
          <ValueGalleryCard
            onConfirm={(data) => handleConfirm(data)}
            disabled={confirmed}
          />
        );
      case "priority-select":
        return (
          <PrioritySelectCard
            question={(msg.cardProps?.question as string) || ""}
            hint={(msg.cardProps?.hint as string) || "只选 1 个"}
            options={(msg.cardProps?.options as { label: string; subtitle: string }[]) || []}
            unsureExplain={(msg.cardProps?.unsureExplain as { title: string; meaning: string; actions: string[] }[]) || []}
            commentPlaceholder={(msg.cardProps?.commentPlaceholder as string) || undefined}
            onConfirm={(data) => handleConfirm(data.selected + (data.comment ? `（补充：${data.comment}）` : ""))}
            disabled={confirmed}
          />
        );
      case "spirit-upgrade":
        return (
          <SpiritUpgradeCard
            onConfirm={(data) => handleConfirm(`核心精神：${data.spirit}；从「${data.from}」→ 到「${data.to}」`)}
            disabled={confirmed}
          />
        );
      case "agree-disagree":
        return (
          <AgreeDisagreeCard
            disagreePlaceholder={(msg.cardProps?.disagreePlaceholder as string) || undefined}
            onConfirm={(data) => {
              if (data.agreed) {
                handleConfirm("同意");
              } else {
                handleConfirm(`不同意：${data.reason}`);
              }
            }}
            disabled={confirmed}
          />
        );
      case "family-code":
        return (
          <FamilyCodeCard
            onConfirm={(code) => handleConfirm(code)}
            disabled={confirmed}
          />
        );
      case "capital-summary":
        return (
          <CapitalSummaryCard
            rows={(msg.cardProps?.rows as { label: string; level: string; keyword: string }[]) || []}
            onConfirm={(agreed, reason, detail) => {
              if (agreed) {
                handleConfirm({ agreed: true });
              } else {
                handleConfirm({ agreed: false, reason, detail });
              }
            }}
            disabled={confirmed}
          />
        );
      case "opt-in":
        return (
          <OptInCard
            title={(msg.cardProps?.title as string) || ""}
            description={(msg.cardProps?.description as string) || ""}
            confirmText={(msg.cardProps?.confirmText as string) || "继续"}
            skipText={(msg.cardProps?.skipText as string) || "跳过"}
            onConfirm={(optedIn) => handleConfirm({ optedIn })}
            disabled={confirmed}
          />
        );
      case "deep-dive":
        return (
          <DeepDiveCard
            questions={(msg.cardProps?.questions as { question: string; options: string[]; commentPlaceholder?: string }[]) || []}
            onConfirm={(answers) => handleConfirm(answers)}
            disabled={confirmed}
          />
        );
      default:
        return null;
    }
  };

  const renderMessageContent = (content: string) => {
    return content.split(/(\*\*[^*]+\*\*)/).map((part, j) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>;
      }
      return <span key={j}>{part}</span>;
    });
  };

  const stepNum = currentStep.replace("step", "");
  const label = ["一", "二", "三", "四"][Number(stepNum) - 1] || stepNum;

  return (
    <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-background">
      {/* Top row: guidance bar + actions */}
      <div className="flex items-center gap-3 px-6 py-2">
        <div className="flex-1 min-w-0 flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/40 text-[11.5px] text-muted-foreground">
          <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block flex-shrink-0 animate-pulse" />
          <span className="truncate">
            {isTransitioning
              ? `进入模块${label}：${stepLabel} · ${stepSubtitle}`
              : `模块${label} · ${stepLabel} · ${stepSubtitle}`}
          </span>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          <button className="flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground transition-colors">
            <Clock size={14} />
            历史对话
          </button>
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut size={14} />
            退出
          </button>
        </div>
      </div>

      {/* Scrollable messages */}
      <div className="flex-1 overflow-y-auto min-h-0 px-6 py-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {messages.map((msg, i) => (
            <div key={i} className="animate-fade-in" style={{ animationDelay: `${Math.min(i * 0.05, 0.3)}s` }}>
              {/* Card message */}
              {msg.cardType ? (
                <div className="ml-12">
                  {renderCard(msg, i)}
                </div>
              ) : msg.role === "ai" ? (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-1">
                    <img src={aiAvatar} alt="AI" className="w-9 h-9 rounded-full object-cover bg-muted" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="bg-ai-bubble rounded-2xl px-5 py-4">
                      <div className="whitespace-pre-wrap text-[14px] leading-[1.8] text-ai-bubble-foreground">
                        {renderMessageContent(msg.content)}
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

          {/* Streaming AI response */}
          {isAiTyping && streamingContent && (
            <div className="animate-fade-in">
              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-1">
                  <img src={aiAvatar} alt="AI" className="w-9 h-9 rounded-full object-cover bg-muted" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="bg-ai-bubble rounded-2xl px-5 py-4">
                    <div className="whitespace-pre-wrap text-[14px] leading-[1.8] text-ai-bubble-foreground">
                      {renderMessageContent(streamingContent)}
                      <span className="inline-block w-1.5 h-4 bg-primary/60 animate-pulse ml-0.5 align-text-bottom" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Typing indicator */}
          {isAiTyping && !streamingContent && (
            <div className="animate-fade-in">
              <div className="flex gap-3">
                <div className="flex-shrink-0 mt-1">
                  <img src={aiAvatar} alt="AI" className="w-9 h-9 rounded-full object-cover bg-muted" />
                </div>
                <div className="bg-ai-bubble rounded-2xl px-5 py-4">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick reply chips */}
          {!hasUserReplied && !isAiTyping && (
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

      {/* Input area */}
      <div className="px-6 pb-4 pt-2 border-t border-border bg-background">
        <div className="max-w-3xl mx-auto">
          <div className={`bg-background rounded-xl border p-4 transition-colors ${isAiTyping ? "border-border/50 opacity-60" : "border-border"}`}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isAiTyping ? "AI 正在思考中..." : (stepGuide || "输入你的回答...")}
              rows={2}
              disabled={isAiTyping}
              className="w-full bg-transparent text-[14px] leading-[1.7] outline-none resize-none placeholder:text-disabled disabled:cursor-not-allowed"
            />
            <div className="flex items-center justify-end mt-2">
              <button
                onClick={handleSubmit}
                disabled={!input.trim() || isAiTyping}
                className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center text-background transition-opacity hover:opacity-80 disabled:opacity-40 disabled:cursor-not-allowed"
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
