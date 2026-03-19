import { useMemo, useState } from "react";
import { MessageSquare, ClipboardCopy, Send } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { submitFeedback } from "@/lib/api";

type FeedbackMessage = {
  role: "ai" | "user";
  content: string;
  cardType?: string;
};

interface Props {
  conversationId: string | null;
  familyCode: string;
  currentStepId: string;
  currentStepLabel: string;
  currentPhase: string;
  currentNodeIndex: number;
  currentNodeType: string;
  currentCardType?: string;
  messages: FeedbackMessage[];
}

const ISSUE_AREAS = ["我们的家底", "我们的眼光", "我们的根基", "我们的共识", "导出", "其他"];
const ISSUE_TYPES = ["卡住不推进", "按钮无响应", "文案不清楚", "数据不一致", "页面报错", "其他"];
const REPRODUCIBILITY_OPTIONS = ["每次都出现", "偶尔出现", "只出现一次"];

function makeFeedbackTemplate(stepLabel: string, issueType: string) {
  return [
    "我在使用过程中遇到了一个问题：",
    "",
    `1) 我在哪个地方卡住：${stepLabel}`,
    `2) 是哪一个问题：${issueType || "请填写问题类型"}`,
    "",
    "我做了什么操作：",
    "实际发生了什么：",
    "我原本预期是什么：",
  ].join("\n");
}

function trimMessageText(text: string) {
  const compactText = text.replace(/\s+/g, " ").trim();
  return compactText.length > 120 ? `${compactText.slice(0, 120)}...` : compactText;
}

export default function FeedbackWidget(props: Props) {
  const [open, setOpen] = useState(false);
  const [area, setArea] = useState("");
  const [issueType, setIssueType] = useState("");
  const [description, setDescription] = useState("");
  const [reproducibility, setReproducibility] = useState("");
  const [contact, setContact] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const recentMessages = useMemo(() => {
    return props.messages
      .filter((message) => !message.cardType && message.content.trim().length > 0)
      .slice(-4)
      .map((message) => ({ role: message.role, content: trimMessageText(message.content) }));
  }, [props.messages]);

  const diagnosticText = useMemo(() => {
    const contextLines = [
      "【诊断信息】",
      `- 会话ID：${props.conversationId || "未创建"}`,
      `- 家庭代号：${props.familyCode || "未填写"}`,
      `- 当前模块：${props.currentStepLabel} (${props.currentStepId})`,
      `- 当前阶段：${props.currentPhase}`,
      `- 节点：${props.currentNodeType} / index=${props.currentNodeIndex}`,
      `- 卡片类型：${props.currentCardType || "无"}`,
      `- 页面：${window.location.href}`,
      `- 时间：${new Date().toLocaleString("zh-CN")}`,
      "",
      "【最近对话片段】",
      ...recentMessages.map((message, index) => `${index + 1}. [${message.role}] ${message.content}`),
    ];
    return contextLines.join("\n");
  }, [
    props.conversationId,
    props.familyCode,
    props.currentStepLabel,
    props.currentStepId,
    props.currentPhase,
    props.currentNodeType,
    props.currentNodeIndex,
    props.currentCardType,
    recentMessages,
  ]);

  const copyDiagnosticText = async () => {
    try {
      await navigator.clipboard.writeText(diagnosticText);
      toast({ title: "已复制诊断信息", description: "可以直接粘贴到聊天框或群里反馈。" });
    } catch {
      toast({ title: "复制失败", description: "请手动复制表单内容。", variant: "destructive" });
    }
  };

  const fillTemplate = () => {
    setDescription(makeFeedbackTemplate(props.currentStepLabel, issueType));
  };

  const submit = async () => {
    if (!description.trim()) {
      toast({
        title: "请先补充问题描述",
        description: "至少写清楚：你卡在哪里、遇到什么问题。",
        variant: "destructive",
      });
      return;
    }

    const effectiveArea = area || props.currentStepLabel;
    const effectiveIssueType = issueType || "其他";

    setSubmitting(true);
    try {
      await submitFeedback({
        area: effectiveArea,
        issueType: effectiveIssueType,
        description: description.trim(),
        reproducibility: reproducibility || undefined,
        contact: contact.trim() || undefined,
        context: {
          conversationId: props.conversationId,
          familyCode: props.familyCode,
          stepId: props.currentStepId,
          stepLabel: props.currentStepLabel,
          phase: props.currentPhase,
          nodeIndex: props.currentNodeIndex,
          nodeType: props.currentNodeType,
          cardType: props.currentCardType,
          url: window.location.href,
          timestamp: new Date().toISOString(),
        },
        recentMessages,
      });

      toast({
        title: "反馈已提交",
        description: "感谢反馈！你也可以点“一键复制诊断信息”发到聊天框。",
      });
      setOpen(false);
      setDescription("");
      setReproducibility("");
      setContact("");
    } catch (error) {
      toast({
        title: "提交失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="反馈"
        aria-label="打开反馈面板"
        className="fixed right-5 bottom-10 z-50 h-10 rounded-full bg-white/95 border border-border shadow-md px-3 flex items-center justify-center gap-1.5 text-[12px] font-medium text-foreground hover:bg-secondary/60 transition-colors"
      >
        <MessageSquare size={14} />
        <span>反馈</span>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[18px]">反馈</DialogTitle>
            <DialogDescription className="text-[14px] text-muted-foreground leading-relaxed">
              请尽量写清楚两件事：1）你在哪个地方卡住了 2）你遇到的是哪一个问题。我们会按这些信息优先排查。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="space-y-1.5">
                <span className="text-[12px] font-medium text-foreground">卡住位置</span>
                <select
                  value={area}
                  onChange={(event) => setArea(event.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-[13px] outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">默认：当前模块（{props.currentStepLabel}）</option>
                  {ISSUE_AREAS.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label className="space-y-1.5">
                <span className="text-[12px] font-medium text-foreground">问题类型</span>
                <select
                  value={issueType}
                  onChange={(event) => setIssueType(event.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-[13px] outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">请选择问题类型</option>
                  {ISSUE_TYPES.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-medium text-foreground">问题描述</span>
                <button
                  type="button"
                  onClick={fillTemplate}
                  className="text-[12px] text-primary hover:underline"
                >
                  插入反馈模板
                </button>
              </div>
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={8}
                placeholder="请写清楚：你点了什么、看到什么、你预期是什么。"
                className="text-[13px] leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="space-y-1.5">
                <span className="text-[12px] font-medium text-foreground">复现情况（可选）</span>
                <select
                  value={reproducibility}
                  onChange={(event) => setReproducibility(event.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-[13px] outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">请选择</option>
                  {REPRODUCIBILITY_OPTIONS.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </select>
              </label>

              <label className="space-y-1.5">
                <span className="text-[12px] font-medium text-foreground">联系方式（可选）</span>
                <Input
                  value={contact}
                  onChange={(event) => setContact(event.target.value)}
                  placeholder="邮箱/手机号/微信号"
                  className="text-[13px]"
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={copyDiagnosticText}
                className="px-3 py-2 rounded-md border border-border text-[12px] text-foreground hover:bg-secondary/50 transition-colors"
              >
                <span className="inline-flex items-center gap-1.5">
                  <ClipboardCopy size={13} />
                  一键复制诊断信息
                </span>
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={submitting}
                className="ml-auto px-4 py-2 rounded-md bg-primary text-primary-foreground text-[13px] font-medium hover:opacity-90 disabled:opacity-50"
              >
                <span className="inline-flex items-center gap-1.5">
                  <Send size={13} />
                  {submitting ? "提交中..." : "提交反馈"}
                </span>
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
