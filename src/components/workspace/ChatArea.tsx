import { useState, useRef, useEffect } from "react";
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
import TrendRankCard from "@/components/cards/TrendRankCard";
import AbilitySelectCard from "@/components/cards/AbilitySelectCard";
import StoryInputCard from "@/components/cards/StoryInputCard";
import TradeoffCard from "@/components/cards/TradeoffCard";
import HeroSelectCard from "@/components/cards/HeroSelectCard";
import QuoteFillCard from "@/components/cards/QuoteFillCard";
import CoreCodeConfirmCard from "@/components/cards/CoreCodeConfirmCard";
import FlipsideFillCard from "@/components/cards/FlipsideFillCard";
import UpgradePathCard from "@/components/cards/UpgradePathCard";


const PRE_FLOW_REPLIES = [
  { key: "intro", text: "能先帮我介绍一下这个流程吗？" },
  { key: "start", text: "我们直接从家庭代号开始吧" },
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
  familyCodeConfirmed?: boolean;
  familyCode?: string;
  introShown?: boolean;
  onShowHistory?: () => void;
  onLogout?: () => void;
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
  familyCodeConfirmed = false,
  familyCode = "",
  introShown = false,
  onShowHistory,
  onLogout,
}: Props) => {
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
    // Family-code card uses explicit state, not positional logic
    const confirmed = msg.cardType === "family-code"
      ? familyCodeConfirmed
      : index < messages.length - 1;
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
            reasonPlaceholder={msg.cardProps?.reasonPlaceholder as string | undefined}
            onConfirm={(data) => handleConfirm(data)}
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
            onConfirm={(data) => handleConfirm(data)}
            disabled={confirmed}
          />
        );
      case "family-code":
        return (
          <FamilyCodeCard
            onConfirm={(code) => handleConfirm(code)}
            disabled={confirmed}
            confirmedValue={familyCode}
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
      case "trend-rank":
        return (
          <TrendRankCard
            onConfirm={(ranked) => handleConfirm(ranked)}
            disabled={confirmed}
          />
        );
      case "ability-select":
        return (
          <AbilitySelectCard
            aiHint={(msg.cardProps?.aiHint as string) || undefined}
            onConfirm={(ability) => handleConfirm(ability)}
            disabled={confirmed}
          />
        );
      case "story-input":
        return (
          <StoryInputCard
            onConfirm={(data) => handleConfirm(data)}
            disabled={confirmed}
          />
        );
      case "tradeoff-choice":
        return (
          <TradeoffCard
            axes={(msg.cardProps?.axes as { axisId: string; labelA: string; labelB: string }[]) || []}
            onConfirm={(choices) => handleConfirm(choices)}
            disabled={confirmed}
          />
        );
      case "hero-select":
        return (
          <HeroSelectCard
            traits={(msg.cardProps?.traits as { label: string; description: string }[]) || undefined}
            onConfirm={(traits) => handleConfirm(traits)}
            disabled={confirmed}
          />
        );
      case "quote-fill":
        return (
          <QuoteFillCard
            themeHints={(msg.cardProps?.themeHints as string[]) || undefined}
            onConfirm={(data) => handleConfirm(data)}
            disabled={confirmed}
          />
        );
      case "core-code-confirm":
        return (
          <CoreCodeConfirmCard
            candidates={(msg.cardProps?.candidates as { name: string; definition: string; evidence: Record<string, string> }[]) || []}
            onConfirm={(data) => handleConfirm(data)}
            disabled={confirmed}
          />
        );
      case "flipside-fill":
        return (
          <FlipsideFillCard
            coreCodeName={(msg.cardProps?.coreCodeName as string) || ""}
            suggestions={msg.cardProps?.suggestions as { tags?: string[]; example?: string; benefits?: string[]; costs?: string[] } | undefined}
            onConfirm={(data) => handleConfirm(data)}
            disabled={confirmed}
          />
        );
      case "upgrade-path":
        return (
          <UpgradePathCard
            coreCodeName={(msg.cardProps?.coreCodeName as string) || ""}
            flipsideCost={(msg.cardProps?.flipsideCost as string) || ""}
            upgradeSuggestions={msg.cardProps?.upgradeSuggestions as { keep?: string; reduce?: string; from?: string; to?: string } | undefined}
            onConfirm={(data) => handleConfirm(data)}
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
          <button
            onClick={onShowHistory}
            className="flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <Clock size={14} />
            历史
          </button>
          <button
            onClick={onLogout}
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

          {/* Quick reply chips — state-driven */}
          {!familyCodeConfirmed && !isAiTyping && (
            <div className="flex flex-wrap gap-2 ml-12 animate-fade-in" style={{ animationDelay: '0.3s' }}>
              {!introShown ? (
                /* Phase 1: fresh — show intro + start options */
                <>
                  {PRE_FLOW_REPLIES.map(({ key, text }) => (
                    <button
                      key={key}
                      onClick={() => onSendMessage(key === "intro" ? "##INTRO##" : "##START##")}
                      className="text-[13px] border border-border rounded-full px-4 py-2 text-foreground hover:bg-secondary transition-colors"
                    >
                      {text}
                    </button>
                  ))}
                </>
              ) : (
                /* Phase 2: intro shown, code not yet confirmed — show post-intro actions */
                <>
                  <button
                    onClick={() => onSendMessage("##GOTO_CODE##")}
                    className="text-[13px] bg-foreground text-background rounded-full px-5 py-2 font-medium hover:opacity-90 transition-opacity"
                  >
                    好，我知道流程了，我们开始吧
                  </button>
                  <button
                    onClick={() => onSendMessage("##GOTO_CODE##")}
                    className="text-[13px] border border-border rounded-full px-4 py-2 text-foreground hover:bg-secondary transition-colors"
                  >
                    我想先取一个家庭代号
                  </button>
                </>
              )}
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
