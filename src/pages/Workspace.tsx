import { useState, useCallback, useRef } from "react";
import ChatArea from "@/components/workspace/ChatArea";
import RightRail from "@/components/workspace/RightRail";
import TopBanner from "@/components/workspace/TopBanner";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { sendChatMessage, type ChatMessage } from "@/lib/api";
import { FLOW, type CardNode } from "@/lib/flow";
import { generateNotes, type Note, type OpenLoop } from "@/lib/notes";

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
  cardType?: string;
  cardProps?: Record<string, unknown>;
  cardData?: unknown;
  snapshotContent?: string;
}

const STEP_MAP: Record<number, StepId> = { 0: "step1", 1: "step2", 2: "step3", 3: "step4" };

const Workspace = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");

  // Flow state
  const [currentModule, setCurrentModule] = useState(0); // index into FLOW
  const [currentNode, setCurrentNode] = useState(0);     // index into FLOW[module].nodes
  const [moduleData, setModuleData] = useState<Record<string, unknown>>({});
  const [completedModules, setCompletedModules] = useState<number[]>([]);
  const [snapshots, setSnapshots] = useState<Record<string, string>>({});
  const [started, setStarted] = useState(false);
  const [familyCode, setFamilyCode] = useState("");

  // Live Notes state
  const [notes, setNotes] = useState<Note[]>([]);
  const [openLoops, setOpenLoops] = useState<OpenLoop[]>([]);

  // Refs to avoid stale closures in async callbacks
  const currentModuleRef = useRef(currentModule);
  const currentNodeRef = useRef(currentNode);
  const moduleDataRef = useRef(moduleData);
  const snapshotsRef = useRef(snapshots);
  const messagesRef = useRef(messages);
  const startedRef = useRef(started);
  const familyCodeRef = useRef(familyCode);
  currentModuleRef.current = currentModule;
  currentNodeRef.current = currentNode;
  moduleDataRef.current = moduleData;
  snapshotsRef.current = snapshots;
  messagesRef.current = messages;
  startedRef.current = started;
  familyCodeRef.current = familyCode;

  // Accumulated data from all modules for cross-module analysis
  const allDataRef = useRef<Record<string, Record<string, unknown>>>({});
  // Capital matrix rows — passed from capital-matrix card to capital-summary card
  const capitalRowsRef = useRef<{ label: string; level: string; keyword: string }[]>([]);

  // Notes helpers
  const addNotes = useCallback((moduleId: string, cardType: string, data: unknown) => {
    const newNotes = generateNotes(moduleId, cardType, data);
    setNotes((prev) => [...prev, ...newNotes]);
    // Auto-create open loop for pending notes
    const pendingNotes = newNotes.filter((n) => n.status === "pending");
    if (pendingNotes.length > 0) {
      setOpenLoops((prev) => [
        ...prev,
        {
          id: `loop_${Date.now()}`,
          moduleId,
          description: pendingNotes[0].bullet,
          nodeIndex: currentNodeRef.current,
          resolved: false,
        },
      ]);
    }
  }, []);

  const handleUpdateNote = useCallback((id: string, updates: Partial<Note>) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...updates } : n))
    );
  }, []);

  const handleDeleteNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const handleResolveLoop = useCallback((id: string) => {
    setOpenLoops((prev) =>
      prev.map((l) => (l.id === id ? { ...l, resolved: true } : l))
    );
  }, []);

  const handleNavigateToLoop = useCallback((_loop: OpenLoop) => {
    // Future: scroll to / highlight the relevant question in chat
  }, []);

  const currentStep = STEP_MAP[currentModule] || "step1";
  const flow = FLOW[currentModule];
  const node = flow?.nodes[currentNode];

  // Determine phase from node index
  const getPhase = (): PhaseId => {
    if (!flow) return "collect";
    const totalNodes = flow.nodes.length;
    const progress = currentNode / totalNodes;
    if (progress < 0.6) return "collect";
    if (progress < 0.85) return "deepen";
    return "confirm";
  };

  const currentPhase = getPhase();
  const completedSteps = completedModules.map((i) => STEP_MAP[i]);
  const completedPhases: Record<StepId, PhaseId[]> = {
    step1: completedModules.includes(0) ? ["collect", "deepen", "confirm"] : [],
    step2: completedModules.includes(1) ? ["collect", "deepen", "confirm"] : [],
    step3: completedModules.includes(2) ? ["collect", "deepen", "confirm"] : [],
    step4: completedModules.includes(3) ? ["collect", "deepen", "confirm"] : [],
  };
  // Add current in-progress phases
  if (!completedModules.includes(currentModule)) {
    const phases: PhaseId[] = [];
    if (currentPhase === "deepen" || currentPhase === "confirm") phases.push("collect");
    if (currentPhase === "confirm") phases.push("deepen");
    completedPhases[currentStep] = phases;
  }

  const currentStepInfo = STEPS.find((s) => s.id === currentStep)!;
  const hasUserReplied = messages.some((m) => m.role === "user");

  const getFlowContext = useCallback((modIdx?: number, nodeIdx?: number) => {
    const mod = modIdx ?? currentModuleRef.current;
    const node = nodeIdx ?? currentNodeRef.current;
    const moduleId = FLOW[mod]?.id || "S";
    // Build node ID like S-01, S-03, etc.
    const aiNodeIndices = FLOW[mod]?.nodes
      .map((n, i) => (n.type === "ai" ? i : -1))
      .filter((i) => i >= 0) || [];
    const aiIndex = aiNodeIndices.indexOf(node);
    const nodeId = `${moduleId}-${String((aiIndex + 1) * 2 - 1).padStart(2, "0")}`;

    return {
      module: moduleId,
      nodeId,
      nodeIndex: node,
      familyCode: familyCodeRef.current,
      currentModuleData: moduleDataRef.current,
      allModuleData: allDataRef.current,
      snapshots: snapshotsRef.current,
    };
  }, []);

  const requestAIMessage = useCallback(async (extraUserMsg?: string) => {
    setIsAiTyping(true);
    setStreamingContent("");

    // Read current values from refs to avoid stale closures
    const mod = currentModuleRef.current;
    const node = currentNodeRef.current;

    const chatMessages: ChatMessage[] = messagesRef.current
      .filter((m) => !m.cardType) // only send text messages to AI
      .map((m) => ({ role: m.role, content: m.content }));

    if (extraUserMsg) {
      chatMessages.push({ role: "user", content: extraUserMsg });
    }

    const flowContext = getFlowContext(mod, node);

    try {
      const response = await fetch(
        `${import.meta.env.DEV ? "http://localhost:3001" : ""}/api/chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: chatMessages, flowContext }),
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let fullContent = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;
          const data = trimmed.slice(6);
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              fullContent += parsed.text;
              const visibleText = fullContent
                .replace(/<!--SNAPSHOT:.*?-->/s, "")
                .replace(/<!--SNAPSHOT:.*/s, "");
              setStreamingContent(visibleText);
            }
          } catch { /* skip */ }
        }
      }

      // Parse snapshot if present
      let snapshotContent: string | undefined;
      const snapshotMatch = fullContent.match(/<!--SNAPSHOT:(.*?)-->/s);
      if (snapshotMatch) {
        snapshotContent = snapshotMatch[1].trim();
      }
      const cleanContent = fullContent
        .replace(/<!--SNAPSHOT:.*?-->/s, "")
        .replace(/<!--SNAPSHOT:.*/s, "")
        .trim();

      const aiMsg: Message = {
        role: "ai",
        content: cleanContent,
        timestamp: new Date(),
        snapshotContent,
      };
      setMessages((prev) => [...prev, aiMsg]);
      setStreamingContent("");
      setIsAiTyping(false);

      // After AI message, advance to next node using the CURRENT refs (not stale closure)
      advanceNode(snapshotContent);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: `抱歉，出了点问题。请稍后重试。`, timestamp: new Date() },
      ]);
      setStreamingContent("");
      setIsAiTyping(false);
    }
  }, [getFlowContext]);

  const advanceNode = (snapshotContent?: string) => {
    const mod = currentModuleRef.current;
    const curNode = currentNodeRef.current;
    const nextNode = curNode + 1;
    const flow = FLOW[mod];
    if (!flow || nextNode >= flow.nodes.length) return;

    const next = flow.nodes[nextNode];
    if (next.type === "card") {
      // For snapshot cards: use AI snapshot, or build fallback from user messages
      let resolvedSnapshotContent = snapshotContent;
      if (next.cardType === "snapshot" && !resolvedSnapshotContent) {
        const userMsgs = messagesRef.current
          .filter((m) => m.role === "user" && m.content && !m.content.startsWith("确认快照"))
          .slice(-5)
          .map((m) => m.content);
        resolvedSnapshotContent = userMsgs.length > 0
          ? `基于你的回答整理：\n${userMsgs.join("\n")}`
          : "快照内容生成中，请确认后继续。";
      }

      const cardMsg: Message = {
        role: "ai",
        content: "",
        timestamp: new Date(),
        cardType: next.cardType,
        cardProps: {
          ...next.cardProps,
          ...(next.cardType === "snapshot" && resolvedSnapshotContent
            ? { content: resolvedSnapshotContent }
            : {}),
        },
      };
      setMessages((prev) => [...prev, cardMsg]);
      setCurrentNode(nextNode);
    } else {
      setCurrentNode(nextNode);
    }
  };

  const handleCardConfirm = useCallback((cardType: string, data: unknown) => {
    // Family code card — special pre-flow handling
    if (cardType === "family-code") {
      const code = data as string;
      setFamilyCode(code);
      familyCodeRef.current = code;
      setStarted(true);
      startedRef.current = true;
      addNotes("_", "family-code", code);
      setMessages((prev) => [
        ...prev,
        { role: "user", content: `家庭代号：${code}`, timestamp: new Date() },
      ]);
      // Request first AI message (S-01)
      setTimeout(() => requestAIMessage(code), 300);
      return;
    }

    const mod = currentModuleRef.current;
    const curNode = currentNodeRef.current;

    // Store card data
    const dataKey = `${FLOW[mod]?.id}_${curNode}_${cardType}`;
    setModuleData((prev) => ({ ...prev, [dataKey]: data }));

    // Generate live notes
    const moduleId = FLOW[mod]?.id || "_";
    addNotes(moduleId, cardType, data);

    // Add user message summarizing the card data
    let summary = "";
    if (cardType === "capital-matrix") {
      const rows = data as { label: string; level: string; keyword: string }[];
      summary = rows.map((r) => `${r.label}：${r.level}${r.keyword ? ` (${r.keyword})` : ""}`).join("；");

      // After capital-matrix → render capital-summary card with the rows injected
      setMessages((prev) => [
        ...prev,
        { role: "user", content: summary, timestamp: new Date(), cardData: data },
      ]);
      const nextNode = curNode + 1;
      currentNodeRef.current = nextNode;
      setCurrentNode(nextNode);
      // Store rows for the summary card to use
      capitalRowsRef.current = rows;
      const cardMsg: Message = {
        role: "ai",
        content: "",
        timestamp: new Date(),
        cardType: "capital-summary",
        cardProps: { rows },
      };
      setMessages((prev) => [...prev, cardMsg]);
      return;
    } else if (cardType === "capital-summary") {
      const result = data as { agreed: boolean; reason?: string; detail?: string };
      if (result.agreed) {
        summary = "符合，继续";
      } else {
        summary = `不太对：${result.reason || ""}${result.detail ? `（${result.detail}）` : ""}`;
      }
    } else if (cardType === "opt-in") {
      const result = data as { optedIn: boolean };
      if (result.optedIn) {
        summary = "我愿意进一步思考";
      } else {
        summary = "跳过深挖，直接继续";
        // Skip the deep-dive node (next node) — jump 2 nodes ahead
        setMessages((prev) => [
          ...prev,
          { role: "user", content: summary, timestamp: new Date() },
        ]);
        const skipNode = curNode + 2; // skip deep-dive, land on priority-select
        currentNodeRef.current = skipNode;
        setCurrentNode(skipNode);
        const targetNode = FLOW[mod]?.nodes[skipNode];
        if (targetNode?.type === "card") {
          const cardMsg: Message = {
            role: "ai",
            content: "",
            timestamp: new Date(),
            cardType: (targetNode as CardNode).cardType,
            cardProps: { ...(targetNode as CardNode).cardProps },
          };
          setMessages((prev) => [...prev, cardMsg]);
        }
        return;
      }
    } else if (cardType === "deep-dive") {
      const answers = data as { option: string; comment: string }[];
      summary = answers.map((a) => `${a.option}${a.comment ? `（${a.comment}）` : ""}`).join("；");
    } else if (cardType === "single-select" || cardType === "priority-select") {
      summary = `我选择优先升级：${data}`;
    } else if (cardType === "agree-disagree" || cardType === "spirit-upgrade") {
      summary = data as string;
    } else if (cardType === "tag-select") {
      summary = `我选择：${(data as string[]).join("、")}`;
    } else if (cardType === "keyword-fill") {
      const vals = data as Record<string, string>;
      summary = Object.entries(vals).map(([k, v]) => `${k}：${v}`).join("；");
    } else if (cardType === "short-text") {
      summary = data as string;
    } else if (cardType === "snapshot") {
      summary = "确认快照，继续下一步。";
      // Save snapshot
      const moduleId = FLOW[mod]?.id || "";
      setSnapshots((prev) => ({ ...prev, [moduleId]: data as string }));
      // Module complete
      allDataRef.current[moduleId] = { ...moduleDataRef.current };
      setCompletedModules((prev) => [...prev, mod]);

      // Move to next module
      if (mod < FLOW.length - 1) {
        const nextMod = mod + 1;
        currentModuleRef.current = nextMod;
        currentNodeRef.current = 0;
        setCurrentModule(nextMod);
        setCurrentNode(0);
        setModuleData({});
        setMessages((prev) => [
          ...prev,
          { role: "user", content: summary, timestamp: new Date() },
        ]);
        setTimeout(() => requestAIMessage(summary), 300);
        return;
      }
      return;
    } else if (cardType === "value-gallery") {
      const d = data as { core: string[]; deferred: string[] };
      summary = `核心价值观：${d.core.join("、")}；战略暂缓：${d.deferred.join("、")}`;
    }

    // Add as user message and request next AI response
    setMessages((prev) => [
      ...prev,
      { role: "user", content: summary, timestamp: new Date(), cardData: data },
    ]);

    // Move to next node
    const nextNode = curNode + 1;
    currentNodeRef.current = nextNode;
    setCurrentNode(nextNode);

    const nextFlowNode = FLOW[mod]?.nodes[nextNode];
    if (nextFlowNode?.type === "ai") {
      // Next is AI — request response
      setTimeout(() => requestAIMessage(summary), 300);
    } else if (nextFlowNode?.type === "card") {
      // Next is another card — render it immediately
      const cardMsg: Message = {
        role: "ai",
        content: "",
        timestamp: new Date(),
        cardType: (nextFlowNode as CardNode).cardType,
        cardProps: { ...(nextFlowNode as CardNode).cardProps },
      };
      setMessages((prev) => [...prev, cardMsg]);
    }
  }, [requestAIMessage]);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!startedRef.current) {
      // Flow not started yet — family code card must be confirmed first
      return;
    }

    // Regular user text reply
    setMessages((prev) => [
      ...prev,
      { role: "user", content, timestamp: new Date() },
    ]);

    // Generate note for free-text answer
    const moduleIdForNote = FLOW[currentModuleRef.current]?.id || "_";
    addNotes(moduleIdForNote, "user-text", content);

    // Advance past the user node
    const mod = currentModuleRef.current;
    const curNode = currentNodeRef.current;
    const nextNode = curNode + 1;
    currentNodeRef.current = nextNode;
    setCurrentNode(nextNode);

    const nextFlowNode = FLOW[mod]?.nodes[nextNode];
    if (nextFlowNode?.type === "ai") {
      await requestAIMessage(content);
    } else if (nextFlowNode?.type === "card") {
      // Next is a card — render it
      const cardMsg: Message = {
        role: "ai",
        content: "",
        timestamp: new Date(),
        cardType: (nextFlowNode as CardNode).cardType,
        cardProps: { ...(nextFlowNode as CardNode).cardProps },
      };
      setMessages((prev) => [...prev, cardMsg]);
    }
  }, [requestAIMessage]);

  const handleStepClick = (stepId: StepId) => {
    // Only allow clicking completed or current steps
    const stepIndex = STEPS.findIndex((s) => s.id === stepId);
    if (completedModules.includes(stepIndex) || stepIndex === currentModule) {
      // For now just visual, no navigation
    }
  };

  // Initialize with welcome message + family code card
  if (messages.length === 0) {
    const welcomeMsg: Message = {
      role: "ai",
      content: "欢迎来到家庭愿景工坊。\n\n接下来我会引导你完成四个模块的思考，最终生成一份《家庭战略定位罗盘》。整个过程大约 20-30 分钟。",
      timestamp: new Date(),
    };
    const codeCard: Message = {
      role: "ai",
      content: "",
      timestamp: new Date(),
      cardType: "family-code" as Message["cardType"],
    };
    setMessages([welcomeMsg, codeCard]);
  }

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      <TopBanner />
      <div className="flex-1 flex overflow-hidden px-6 py-4">
        <ResizablePanelGroup direction="horizontal" className="gap-0">
          <ResizablePanel defaultSize={70} minSize={50}>
            <div className="flex flex-col min-w-0 min-h-0 h-full rounded-xl bg-background">
              <ChatArea
                messages={messages}
                currentStep={currentStep}
                currentPhase={currentPhase}
                currentQuestionIndex={currentNode + 1}
                totalQuestions={flow?.nodes.length || 8}
                stepLabel={currentStepInfo.label}
                stepSubtitle={currentStepInfo.subtitle}
                isTransitioning={false}
                onSendMessage={handleSendMessage}
                completedSteps={completedSteps}
                onStepClick={handleStepClick}
                stepGuide={started ? "输入你的回答..." : "请先在上方确认家庭代号"}
                completedPhaseCount={completedModules.length * 3 + (currentPhase === "collect" ? 0 : currentPhase === "deepen" ? 1 : 2)}
                totalPhases={12}
                hasUserReplied={hasUserReplied}
                isAiTyping={isAiTyping}
                streamingContent={streamingContent}
                onCardConfirm={handleCardConfirm}
              />
            </div>
          </ResizablePanel>
          <ResizableHandle className="w-px mx-3 my-8 bg-border/50 rounded-full transition-all duration-200 hover:bg-primary/40 hover:w-[3px] hover:mx-[11px] active:bg-primary/60 active:w-[3px] data-[resize-handle-active]:bg-primary/60 data-[resize-handle-active]:w-[3px]" />
          <ResizablePanel defaultSize={30} minSize={20} maxSize={45}>
            <div className="h-full overflow-y-auto bg-background">
              <RightRail
                currentStep={currentStep}
                currentPhase={currentPhase}
                completedSteps={completedSteps}
                completedPhases={completedPhases}
                steps={STEPS}
                onExport={() => window.open("/compass", "_blank")}
                notes={notes}
                openLoops={openLoops}
                onUpdateNote={handleUpdateNote}
                onDeleteNote={handleDeleteNote}
                onResolveLoop={handleResolveLoop}
                started={started}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
};

export default Workspace;
