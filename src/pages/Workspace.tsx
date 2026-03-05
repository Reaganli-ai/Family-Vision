import { useState } from "react";
import ChatArea from "@/components/workspace/ChatArea";
import ProgressPanel from "@/components/workspace/ProgressPanel";
import TopBanner from "@/components/workspace/TopBanner";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

export type StepId = "step1" | "step2" | "step3" | "step4";
export type PhaseId = "collect" | "deepen" | "confirm";

export interface StepInfo {
  id: StepId;
  label: string;
  direction: string;
  subtitle: string;
}

export const STEPS: StepInfo[] = [
  { id: "step1", label: "我们的家底", direction: "S", subtitle: "我们有什么资源？" },
  { id: "step2", label: "我们的眼光", direction: "N", subtitle: "世界往哪走？" },
  { id: "step3", label: "我们的根基", direction: "W", subtitle: "家族的底层逻辑" },
  { id: "step4", label: "我们的共识", direction: "E", subtitle: "教育的底线和方向" },
];

export const PHASE_LABELS: Record<PhaseId, string> = {
  collect: "信息收集",
  deepen: "智能追问",
  confirm: "确认快照",
};

export interface Message {
  role: "ai" | "user";
  content: string;
  timestamp: Date;
}

const STEP_GUIDES: Record<StepId, string> = {
  step1: "先来了解你们的家底~",
  step2: "聊聊你们看到的未来~",
  step3: "挖一挖家族的精神基因~",
  step4: "最后一步，锚定教育方向~",
};

const STEP_INSIGHTS: Record<StepId, { quotes: string[]; ref: string }> = {
  step1: {
    quotes: [
      "资本不是越多越好，而是知道优先投入哪一个。",
      "很多家庭的文化资本，藏在饭桌上的日常对话里。",
    ],
    ref: "课程参考：第一讲 P3-P5",
  },
  step2: {
    quotes: [
      "不是预测未来，而是决定你用什么姿态面对未来。",
      "核心素养不是技能清单，是你希望孩子成为什么样的人。",
    ],
    ref: "课程参考：第二讲 P6-P9",
  },
  step3: {
    quotes: [
      "每个家族都有自己的精神 DNA，只是很少被说出来。",
      "口头禅是最诚实的价值观表达。",
    ],
    ref: "课程参考：第三讲 P10-P14",
  },
  step4: {
    quotes: [
      "共识不是妥协，是找到彼此都认同的底层逻辑。",
      "教育方向不需要完美，需要清晰。",
    ],
    ref: "课程参考：第四讲 P15-P18",
  },
};

const INITIAL_MESSAGES: Message[] = [
  {
    role: "ai",
    content: "欢迎来到家庭愿景工坊。\n\n我是你的家庭愿景导师，接下来我会引导你完成四个板块的思考，最终生成一份属于你们家庭的《战略定位罗盘》。\n\n整个过程大约 20-30 分钟，随时可以保存进度。\n\n**首先，请为你的家庭取一个代号**（比如：妈妈姓氏首字母+爸爸姓氏首字母，如 OC）。",
    timestamp: new Date(),
  },
];

const Workspace = () => {
  const [currentStep, setCurrentStep] = useState<StepId>("step1");
  const [currentPhase, setCurrentPhase] = useState<PhaseId>("collect");
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [completedSteps, setCompletedSteps] = useState<StepId[]>([]);
  const [completedPhases, setCompletedPhases] = useState<Record<StepId, PhaseId[]>>({
    step1: [],
    step2: [],
    step3: [],
    step4: [],
  });
  const [conversationSummary, setConversationSummary] = useState<string>("");
  const [currentQuestionIndex] = useState(1);
  const [totalQuestions] = useState(5);
  const [isTransitioning] = useState(false);

  const currentStepInfo = STEPS.find((s) => s.id === currentStep)!;
  const totalPhases = 12;
  const completedPhaseCount = Object.values(completedPhases).reduce((sum, ps) => sum + ps.length, 0);
  const hasUserReplied = messages.some((m) => m.role === "user");

  const handleSendMessage = (content: string) => {
    const userMsg: Message = { role: "user", content, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);

    setTimeout(() => {
      const aiMsg: Message = {
        role: "ai",
        content: getAIResponse(content, currentStep),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    }, 800);
  };

  const handleStepClick = (stepId: StepId) => {
    if (completedSteps.includes(stepId) || stepId === currentStep) {
      setCurrentStep(stepId);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      {/* Level 1: Fixed top banner — full width */}
      <TopBanner />

      {/* Level 2: Content area with margins */}
      <div className="flex-1 flex overflow-hidden px-6 py-4">
        <ResizablePanelGroup direction="horizontal" className="gap-0">
          {/* Left: Chat */}
          <ResizablePanel defaultSize={70} minSize={50}>
            <div className="flex flex-col min-w-0 min-h-0 h-full rounded-xl bg-background">
              <ChatArea
                messages={messages}
                currentStep={currentStep}
                currentPhase={currentPhase}
                currentQuestionIndex={currentQuestionIndex}
                totalQuestions={totalQuestions}
                stepLabel={currentStepInfo.label}
                stepSubtitle={currentStepInfo.subtitle}
                isTransitioning={isTransitioning}
                onSendMessage={handleSendMessage}
                completedSteps={completedSteps}
                onStepClick={handleStepClick}
                stepGuide={STEP_GUIDES[currentStep]}
                completedPhaseCount={completedPhaseCount}
                totalPhases={totalPhases}
                hasUserReplied={hasUserReplied}
              />
            </div>
          </ResizablePanel>

          {/* Draggable divider */}
          <ResizableHandle className="w-px mx-3 my-8 bg-border/50 rounded-full transition-all duration-200 hover:bg-primary/40 hover:w-[3px] hover:mx-[11px] active:bg-primary/60 active:w-[3px] data-[resize-handle-active]:bg-primary/60 data-[resize-handle-active]:w-[3px]" />

          {/* Right: Progress panel */}
          <ResizablePanel defaultSize={30} minSize={20} maxSize={45}>
            <div className="h-full overflow-y-auto bg-background">
              <ProgressPanel
                currentStep={currentStep}
                currentPhase={currentPhase}
                completedSteps={completedSteps}
                completedPhases={completedPhases}
                steps={STEPS}
                conversationSummary={conversationSummary}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

function getAIResponse(userInput: string, step: StepId): string {
  if (step === "step1") {
    return `很好，记下了你的家庭代号。\n\n现在我们进入 **Step 1：我们的家底**\n\n核心问题是：**我们有什么资源？优先升级什么？**\n\n请对以下三大资本分别选择等级，并填写特征关键词：\n\n**经济资本**（我们的"燃料"与"安全垫"）\n- L1 基础保障型\n- L2 规划充裕型\n- L3 战略自由型\n\n特征关键词是什么？（如：稳健、有规划、敢投资）`;
  }
  return `收到你的回答，让我们继续下一个问题。`;
}

export default Workspace;
