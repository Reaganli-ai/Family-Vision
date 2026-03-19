import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import ChatArea from "@/components/workspace/ChatArea";
import RightRail from "@/components/workspace/RightRail";
import FeedbackWidget from "@/components/workspace/FeedbackWidget";
import TopBanner from "@/components/workspace/TopBanner";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { sendChatMessage, type ChatMessage } from "@/lib/api";
import { Plus, X, Search } from "lucide-react";
import { FLOW, type CardNode } from "@/lib/flow";
import { useAuth } from "@/lib/auth";
import {
  listConversations,
  createConversation,
  updateConversation,
  loadMessages,
  saveMessage,
  deleteMessagesFromModule,
  saveCompassData,
  loadCompassData,
  type Conversation,
} from "@/lib/data-client";
import {
  type CompassDataSchema,
  updateCompassFromCard,
  generateSnapshotFromFields,
  field,
} from "@/lib/compass-schema";
import { getDomainHint, generateDiagnostic } from "@/lib/n-diagnostic";
import { renderAxisLabels, buildFinalStatement, buildWSnapshot, inferAxesFromText } from "@/lib/w-templates";

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
  id?: string;
  role: "ai" | "user";
  content: string;
  timestamp: Date;
  cardType?: string;
  cardProps?: Record<string, unknown>;
  cardData?: unknown;
  snapshotContent?: string;
  moduleIndex?: number;
}

type SaveState = "saved" | "saving" | "error";

const STEP_MAP: Record<number, StepId> = { 0: "step1", 1: "step2", 2: "step3", 3: "step4" };

const Workspace = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");

  // Persistence state
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingConversation, setLoadingConversation] = useState(true);
  const conversationIdRef = useRef<string | null>(null);
  const [drawerCompassMap, setDrawerCompassMap] = useState<Record<string, CompassDataSchema>>({});

  // Flow state
  const [currentModule, setCurrentModule] = useState(0); // index into FLOW
  const [currentNode, setCurrentNode] = useState(0);     // index into FLOW[module].nodes
  const [moduleData, setModuleData] = useState<Record<string, unknown>>({});
  const [completedModules, setCompletedModules] = useState<number[]>([]);
  const [snapshots, setSnapshots] = useState<Record<string, string>>({});
  const [started, setStarted] = useState(false);
  const [familyCode, setFamilyCode] = useState("");
  const [introShown, setIntroShown] = useState(false);
  const [allComplete, setAllComplete] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const pendingSaveCountRef = useRef(0);
  const pendingSaveErrorCountRef = useRef(0);

  // Structured compass data (source of truth for PDF)
  const compassDataRef = useRef<CompassDataSchema>({});
  // Counter to trigger re-renders when compassData changes (ref doesn't trigger)
  const [compassVersion, setCompassVersion] = useState(0);
  const bumpCompass = () => setCompassVersion((v) => v + 1);


  // W-01 multi-round dialogue: track user reply count for frontend safeguard
  const w01RoundRef = useRef(0);
  // W-03 AI outputs hero_traits alongside axes; cache for HeroSelectCard (node 4, after TradeoffCard)
  const heroTraitsRef = useRef<{ label: string; description: string }[] | null>(null);

  // Refs to avoid stale closures in async callbacks
  const currentModuleRef = useRef(currentModule);
  const currentNodeRef = useRef(currentNode);
  const moduleDataRef = useRef(moduleData);
  const snapshotsRef = useRef(snapshots);
  const messagesRef = useRef(messages);
  const startedRef = useRef(started);
  const familyCodeRef = useRef(familyCode);
  const completedModulesRef = useRef(completedModules);
  currentModuleRef.current = currentModule;
  currentNodeRef.current = currentNode;
  moduleDataRef.current = moduleData;
  snapshotsRef.current = snapshots;
  messagesRef.current = messages;
  startedRef.current = started;
  familyCodeRef.current = familyCode;
  completedModulesRef.current = completedModules;

  conversationIdRef.current = conversationId;

  const runPersistTask = useCallback(async (task: Promise<unknown>, errorLabel: string) => {
    pendingSaveCountRef.current += 1;
    setSaveState("saving");
    if (pendingSaveErrorCountRef.current === 0) {
      setSaveError(null);
    }
    try {
      await task;
    } catch (error) {
      pendingSaveErrorCountRef.current += 1;
      setSaveState("error");
      setSaveError(errorLabel);
      throw error;
    } finally {
      pendingSaveCountRef.current = Math.max(0, pendingSaveCountRef.current - 1);
      if (pendingSaveCountRef.current === 0) {
        if (pendingSaveErrorCountRef.current === 0) {
          setSaveState("saved");
          setLastSavedAt(new Date());
        } else {
          pendingSaveErrorCountRef.current = 0;
        }
      }
    }
  }, []);

  const moduleIdByIndex = (moduleIndex: number): string =>
    FLOW[Math.max(0, Math.min(moduleIndex, FLOW.length - 1))]?.id || "S";

  const getNodeIndexByCardType = (moduleIndex: number, cardType: string): number => {
    const nodes = FLOW[moduleIndex]?.nodes || [];
    const idx = nodes.findIndex((flowNode) => flowNode.type === "card" && (flowNode as CardNode).cardType === cardType);
    return idx >= 0 ? idx : 0;
  };

  const extractSnapshotsFromCompass = (compassData: CompassDataSchema): Record<string, string> => {
    const snapshotMap: Record<string, string> = {};
    for (const moduleId of ["S", "N", "W", "E"]) {
      const moduleData = (compassData as Record<string, unknown>)[moduleId] as Record<string, unknown> | undefined;
      const snapshotField = moduleData?.snapshot as { value?: unknown } | undefined;
      if (snapshotField?.value && typeof snapshotField.value === "string") {
        snapshotMap[moduleId] = snapshotField.value;
      }
    }
    return snapshotMap;
  };

  const computeCompletedModulesFromCompass = (compassData: CompassDataSchema): number[] => {
    const completed: number[] = [];
    for (let moduleIndex = 0; moduleIndex < FLOW.length; moduleIndex += 1) {
      const moduleId = moduleIdByIndex(moduleIndex);
      const moduleData = (compassData as Record<string, unknown>)[moduleId] as Record<string, unknown> | undefined;
      const snapshotField = moduleData?.snapshot as { value?: unknown } | undefined;
      if (snapshotField?.value) {
        completed.push(moduleIndex);
      }
    }
    return completed;
  };

  const clampCursor = (moduleIndex: number, nodeIndex: number): { moduleIndex: number; nodeIndex: number } => {
    const safeModuleIndex = Math.max(0, Math.min(moduleIndex, FLOW.length - 1));
    const nodeCount = FLOW[safeModuleIndex]?.nodes.length || 1;
    const safeNodeIndex = Math.max(0, Math.min(nodeIndex, nodeCount - 1));
    return { moduleIndex: safeModuleIndex, nodeIndex: safeNodeIndex };
  };

  const rebuildModuleDataFromMessages = (msgs: Message[]): Record<string, unknown> => {
    const rebuilt: Record<string, unknown> = {};
    for (const message of msgs) {
      if (!message.cardType || message.cardData === undefined) continue;
      const inferredModuleIndex = typeof message.moduleIndex === "number"
        ? message.moduleIndex
        : currentModuleRef.current;
      const moduleId = moduleIdByIndex(inferredModuleIndex);
      const nodeIdx = getNodeIndexByCardType(inferredModuleIndex, message.cardType);
      rebuilt[`${moduleId}_${nodeIdx}_${message.cardType}`] = message.cardData;
    }
    return rebuilt;
  };

  const ensureActiveCardMessage = (
    msgs: Message[],
    moduleIndex: number,
    nodeIndex: number
  ): Message[] => {
    const currentFlowNode = FLOW[moduleIndex]?.nodes[nodeIndex];
    if (!currentFlowNode || currentFlowNode.type !== "card") return msgs;

    const expectedCardType = (currentFlowNode as CardNode).cardType;
    const lastMessage = msgs[msgs.length - 1];
    if (lastMessage?.cardType === expectedCardType) return msgs;

    const restoredCardProps: Record<string, unknown> = { ...(currentFlowNode as CardNode).cardProps };
    if (expectedCardType === "core-code-confirm") {
      const fallbackCandidates = buildCoreCodeFallbackCandidates(compassDataRef.current);
      if (fallbackCandidates.length > 0) restoredCardProps.candidates = fallbackCandidates;
    }

    return [
      ...msgs,
      {
        role: "ai",
        content: "",
        timestamp: new Date(),
        cardType: expectedCardType,
        cardProps: restoredCardProps,
        moduleIndex,
      },
    ];
  };

  const buildCoreCodeFallbackCandidates = (compassData: CompassDataSchema): { name: string; definition: string; evidence: Record<string, string> }[] => {
    const storyText = (compassData.W?.story?.value as string) || "";
    const heroes = compassData.W?.heroTraits?.value as string[] | undefined;
    const quoteChild = (compassData.W?.quoteChildhood?.value as string) || "";
    const quoteNow = (compassData.W?.quoteNow?.value as string) || "";
    const themeTag = (compassData.W?.quoteThemeTag?.value as string) || "";
    const storyShort = storyText.length > 30 ? `${storyText.slice(0, 30)}…` : storyText;

    const fallbackCandidates: { name: string; definition: string; evidence: Record<string, string> }[] = [];

    if (Array.isArray(heroes) && heroes[0]) {
      const heroName = heroes[0];
      fallbackCandidates.push({
        name: heroName.length <= 4 ? heroName : heroName.slice(0, 4),
        definition: `以「${heroName}」为精神基因，代代传承`,
        evidence: { 英雄特质: heroes.slice(0, 2).join("、"), 故事: storyShort || "—" },
      });
    }

    if (themeTag) {
      fallbackCandidates.push({
        name: themeTag.length <= 4 ? themeTag : themeTag.slice(0, 2),
        definition: `用「${themeTag}」的力量面对生活的不确定`,
        evidence: { 口头禅: `${quoteChild} → ${quoteNow}`.trim() || "—", 故事: storyShort || "—" },
      });
    } else if (Array.isArray(heroes) && heroes[1]) {
      const heroName = heroes[1];
      fallbackCandidates.push({
        name: heroName.length <= 4 ? heroName : heroName.slice(0, 4),
        definition: `在「${heroName}」中找到家庭的立足之本`,
        evidence: { 英雄特质: heroes.slice(0, 3).join("、"), 故事: storyShort || "—" },
      });
    }

    return fallbackCandidates;
  };

  const repairResumeCardProps = (msgs: Message[]): Message[] => {
    return msgs.map((message) => {
      if (message.cardType !== "core-code-confirm") return message;
      const existingCandidates = (message.cardProps?.candidates as unknown[] | undefined) || [];
      if (existingCandidates.length > 0) return message;
      const fallbackCandidates = buildCoreCodeFallbackCandidates(compassDataRef.current);
      if (fallbackCandidates.length === 0) return message;
      return {
        ...message,
        cardProps: {
          ...(message.cardProps || {}),
          candidates: fallbackCandidates,
        },
      };
    });
  };

  // ─── Single init: load existing conversation OR create new one ───
  useEffect(() => {
    if (!user) {
      setLoadingConversation(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const convos = await listConversations();
        if (cancelled) return;
        setConversations(convos);

        if (convos.length > 0) {
          // Load the most recent active conversation
          const latest = convos[0];
          setAllComplete(false);
          heroTraitsRef.current = null;
          w01RoundRef.current = 0;
          setConversationId(latest.id);
          conversationIdRef.current = latest.id;
          setFamilyCode(latest.family_code);
          setStarted(latest.started);
          startedRef.current = latest.started;

          // Load compass data
          const cd = await loadCompassData(latest.id);
          if (cancelled) return;
          compassDataRef.current = (cd || {}) as CompassDataSchema;
          bumpCompass();

          const rawMsgs = await loadMessages(latest.id);
          if (cancelled) return;

          // Deduplicate: keep only the first welcome message and first family-code card
          const dedupedMessages = deduplicateMessages(rawMsgs);
          const completedBySnapshot = computeCompletedModulesFromCompass(compassDataRef.current);
          const fallbackCompleted = Array.from({ length: Math.max(0, latest.current_module) }, (_, i) => i);
          const restoredCompletedModules = Array.from(new Set([...fallbackCompleted, ...completedBySnapshot]))
            .filter((moduleIndex) => moduleIndex >= 0 && moduleIndex < FLOW.length);
          setCompletedModules(restoredCompletedModules);
          setAllComplete(restoredCompletedModules.includes(FLOW.length - 1));
          setSnapshots(extractSnapshotsFromCompass(compassDataRef.current));

          const safeCursor = clampCursor(latest.current_module, latest.current_node);
          const messageSeed = dedupedMessages.length > 0 ? dedupedMessages : createWelcomeMessages();
          const fixedMessages = ensureActiveCardMessage(messageSeed, safeCursor.moduleIndex, safeCursor.nodeIndex);
          const repairedMessages = repairResumeCardProps(fixedMessages);
          const rebuiltModuleData = rebuildModuleDataFromMessages(repairedMessages);

          setCurrentModule(safeCursor.moduleIndex);
          currentModuleRef.current = safeCursor.moduleIndex;
          setCurrentNode(safeCursor.nodeIndex);
          currentNodeRef.current = safeCursor.nodeIndex;
          setModuleData(rebuiltModuleData);
          moduleDataRef.current = rebuiltModuleData;

          lastSavedCountRef.current = repairedMessages.length;
          setMessages(repairedMessages);

        } else {
          // No conversations — create a new one
          const convo = await createConversation("", "新对话");
          if (cancelled) return;
          setAllComplete(false);
          heroTraitsRef.current = null;
          w01RoundRef.current = 0;
          setConversationId(convo.id);
          conversationIdRef.current = convo.id;
          setMessages(createWelcomeMessages());
        }
      } catch (err) {
        console.error("Failed to initialize:", err);
      } finally {
        if (!cancelled) setLoadingConversation(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user]);

  // Auto-persist new messages as they're added
  const lastSavedCountRef = useRef(0);
  useEffect(() => {
    const cid = conversationIdRef.current;
    if (!cid || loadingConversation) return;

    const newMsgs = messages.slice(lastSavedCountRef.current);
    if (newMsgs.length === 0) return;

    lastSavedCountRef.current = messages.length;

    // Save each new message (fire-and-forget)
    for (const msg of newMsgs) {
      const normalizedMessage: Message = {
        ...msg,
        moduleIndex: typeof msg.moduleIndex === "number" ? msg.moduleIndex : currentModuleRef.current,
      };
      runPersistTask(
        saveMessage(cid, normalizedMessage),
        "消息保存失败，请稍后重试"
      ).catch((err) => console.error("Failed to save message:", err));
    }
  }, [messages, loadingConversation, runPersistTask]);

  // Auto-sync flow state when key values change
  useEffect(() => {
    const cid = conversationIdRef.current;
    if (!cid || loadingConversation) return;

    runPersistTask(updateConversation(cid, {
      current_module: currentModule,
      current_node: currentNode,
      started,
      family_code: familyCode,
    }), "进度同步失败，请稍后重试").catch((err) => console.error("Failed to sync flow state:", err));
  }, [currentModule, currentNode, started, familyCode, loadingConversation, runPersistTask]);

  // ─── History: load a different conversation ───
  const handleLoadConversation = useCallback(async (convo: Conversation) => {
    setShowHistory(false);
    setAllComplete(false);
    heroTraitsRef.current = null;
    w01RoundRef.current = 0;
    setConversationId(convo.id);
    conversationIdRef.current = convo.id;
    setFamilyCode(convo.family_code);
    familyCodeRef.current = convo.family_code;
    setStarted(convo.started);
    startedRef.current = convo.started;
    setIntroShown(false);
    setModuleData({});
    moduleDataRef.current = {};

    compassDataRef.current = {};
    bumpCompass();

    try {
      const [rawMsgs, cd] = await Promise.all([
        loadMessages(convo.id),
        loadCompassData(convo.id),
      ]);
      compassDataRef.current = (cd || {}) as CompassDataSchema;
      bumpCompass();

      const completedBySnapshot = computeCompletedModulesFromCompass(compassDataRef.current);
      const fallbackCompleted = Array.from({ length: Math.max(0, convo.current_module) }, (_, i) => i);
      const restoredCompletedModules = Array.from(new Set([...fallbackCompleted, ...completedBySnapshot]))
        .filter((moduleIndex) => moduleIndex >= 0 && moduleIndex < FLOW.length);
      setCompletedModules(restoredCompletedModules);
      setAllComplete(restoredCompletedModules.includes(FLOW.length - 1));
      setSnapshots(extractSnapshotsFromCompass(compassDataRef.current));

      const dedupedMessages = deduplicateMessages(rawMsgs);
      const safeCursor = clampCursor(convo.current_module, convo.current_node);
      const messageSeed = dedupedMessages.length > 0 ? dedupedMessages : createWelcomeMessages();
      const fixedMessages = ensureActiveCardMessage(messageSeed, safeCursor.moduleIndex, safeCursor.nodeIndex);
      const repairedMessages = repairResumeCardProps(fixedMessages);
      const rebuiltModuleData = rebuildModuleDataFromMessages(repairedMessages);

      setCurrentModule(safeCursor.moduleIndex);
      currentModuleRef.current = safeCursor.moduleIndex;
      setCurrentNode(safeCursor.nodeIndex);
      currentNodeRef.current = safeCursor.nodeIndex;
      setModuleData(rebuiltModuleData);
      moduleDataRef.current = rebuiltModuleData;

      lastSavedCountRef.current = repairedMessages.length;
      setMessages(repairedMessages);

    } catch (err) {
      console.error("Failed to load messages:", err);
      setAllComplete(false);
      lastSavedCountRef.current = 0;
      setMessages(createWelcomeMessages());
    }
  }, []);

  // ─── Welcome messages helper ───
  const createWelcomeMessages = (): Message[] => [
    { role: "ai", content: "欢迎来到家庭愿景工坊。\n\n接下来我会引导你完成四个模块的思考，最终生成一份《家庭战略定位罗盘》。整个过程大约 20-30 分钟。", timestamp: new Date(), moduleIndex: 0 },
    { role: "ai", content: "", timestamp: new Date(), cardType: "family-code", moduleIndex: 0 },
  ];

  // ─── Deduplicate messages from DB (fix for legacy duplicated data) ───
  const deduplicateMessages = (msgs: Message[]): Message[] => {
    let seenWelcome = false;
    let seenFamilyCode = false;
    return msgs.filter((m) => {
      // Deduplicate welcome messages (AI message starting with "欢迎来到家庭愿景工坊")
      if (m.role === "ai" && !m.cardType && m.content.startsWith("欢迎来到家庭愿景工坊")) {
        if (seenWelcome) return false;
        seenWelcome = true;
        return true;
      }
      // Deduplicate family-code cards
      if (m.cardType === "family-code") {
        if (seenFamilyCode) return false;
        seenFamilyCode = true;
        return true;
      }
      return true;
    });
  };

  // ─── New conversation ───
  const handleNewConversation = useCallback(async (code?: string) => {
    if (!user) return;
    try {
      const convo = await createConversation(code || "", code ? `${code} 家庭愿景` : "新对话");
      setConversationId(convo.id);
      conversationIdRef.current = convo.id;
      setFamilyCode(code || "");
      setCurrentModule(0);
      setCurrentNode(0);
      setStarted(false);
      setIntroShown(false);
      setAllComplete(false);
      lastSavedCountRef.current = 0;
      setModuleData({});
      moduleDataRef.current = {};
      setCompletedModules([]);
      setSnapshots({});
      snapshotsRef.current = {};
      heroTraitsRef.current = null;
      w01RoundRef.current = 0;
  
      // openLoops removed — memo system handles state
      setMessages(createWelcomeMessages());
      // Refresh conversation list
      const convos = await listConversations();
      setConversations(convos);
    } catch (err) {
      console.error("Failed to create conversation:", err);
    }
  }, [user]);

  // ─── Logout ───
  const handleLogout = useCallback(async () => {
    await signOut();
    navigate("/login");
  }, [signOut, navigate]);

  // Accumulated data from all modules for cross-module analysis
  const allDataRef = useRef<Record<string, Record<string, unknown>>>({});
  // Capital matrix rows — passed from capital-matrix card to capital-summary card
  const capitalRowsRef = useRef<{ label: string; level: string; keyword: string }[]>([]);

  const currentStep = STEP_MAP[currentModule] || "step1";
  const flow = FLOW[currentModule];
  const node = flow?.nodes[currentNode];
  const currentNodeType = node?.type || "unknown";
  const currentCardType = node?.type === "card" ? (node as CardNode).cardType : undefined;

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
  // Add current in-progress phases (only if the current module is NOT already completed)
  if (!completedModules.includes(currentModule) && !allComplete) {
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
      compassData: compassDataRef.current,
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
                .replace(/<!--SNAPSHOT:.*/s, "")
                .replace(/<!--DATA:.*?-->/s, "")
                .replace(/<!--DATA:.*/s, "")
                .replace(/<!--READY-->/g, "");
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

      // Parse structured data if present (for W-03 axes, W-07 candidates, etc.)
      let structuredData: unknown;
      const dataMatch = fullContent.match(/<!--DATA:(.*?)-->/s);
      if (dataMatch) {
        try {
          structuredData = JSON.parse(dataMatch[1].trim());
        } catch { /* ignore malformed DATA */ }
      }

      const cleanContent = fullContent
        .replace(/<!--SNAPSHOT:.*?-->/s, "")
        .replace(/<!--SNAPSHOT:.*/s, "")
        .replace(/<!--DATA:.*?-->/s, "")
        .replace(/<!--DATA:.*/s, "")
        .replace(/<!--READY-->/g, "")
        .trim();

      const aiMsg: Message = {
        role: "ai",
        content: cleanContent,
        timestamp: new Date(),
        snapshotContent,
        moduleIndex: mod,
      };
      setMessages((prev) => [...prev, aiMsg]);
      setStreamingContent("");
      setIsAiTyping(false);

      // W-01 multi-round gate: if AI didn't signal READY, stay on W-01
      const isW01 = FLOW[mod]?.id === "W" && node === 0;
      const hasReady = fullContent.includes("<!--READY-->");
      const hasCardCueInText =
        /下方卡片|卡片中|回答两个问题|请在下面|写下来|请选择|继续填写/.test(cleanContent);
      const shouldAdvanceFromW01 = hasReady || hasCardCueInText;
      if (isW01 && !shouldAdvanceFromW01) {
        // Stay on W-01, don't advance — wait for user reply
        return;
      }
      if (isW01 && shouldAdvanceFromW01) {
        w01RoundRef.current = 0;
      }

      // After AI message, advance to next node using the CURRENT refs (not stale closure)
      advanceNode(snapshotContent, structuredData, cleanContent);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: `抱歉，出了点问题。请稍后重试。`, timestamp: new Date(), moduleIndex: mod },
      ]);
      setStreamingContent("");
      setIsAiTyping(false);
    }
  }, [getFlowContext]);

  const advanceNode = (snapshotContent?: string, structuredData?: unknown, aiText?: string) => {
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

      // For ability-select card: inject AI hint based on top trend
      let abilityHint: string | undefined;
      if (next.cardType === "ability-select") {
        const topTrend = compassDataRef.current.N?.trendsRanked?.value?.[0];
        if (topTrend) abilityHint = getDomainHint(topTrend);
      }

      // For tradeoff-choice card: render axes from AI DATA + template library
      let tradeoffAxes: { axisId: string; labelA: string; labelB: string }[] | undefined;
      if (next.cardType === "tradeoff-choice") {
        if (structuredData) {
          const sd = structuredData as { axes?: { axis_id: string; keyword?: string }[]; hero_traits?: { label: string; description: string }[] };
          if (sd.axes) {
            tradeoffAxes = sd.axes
              .map((a) => {
                const rendered = renderAxisLabels(a.axis_id, a.keyword);
                return rendered ? { axisId: a.axis_id, labelA: rendered.labelA, labelB: rendered.labelB } : null;
              })
              .filter(Boolean) as { axisId: string; labelA: string; labelB: string }[];
          }
          // Cache hero_traits for HeroSelectCard (rendered after TradeoffCard)
          if (sd.hero_traits?.length) {
            heroTraitsRef.current = sd.hero_traits;
          }
        }
        // Smart fallback: infer axes from AI response text keywords
        if (!tradeoffAxes?.length && aiText) {
          const inferredIds = inferAxesFromText(aiText);
          if (inferredIds.length >= 2) {
            tradeoffAxes = inferredIds
              .map((id) => {
                const rendered = renderAxisLabels(id);
                return rendered ? { axisId: id, labelA: rendered.labelA, labelB: rendered.labelB } : null;
              })
              .filter(Boolean) as { axisId: string; labelA: string; labelB: string }[];
          }
        }
        // Fixed fallback: if smart inference also failed, use 3 default axes
        if (!tradeoffAxes?.length) {
          const fallbackAxisIds = ["safety-vs-growth", "rules-vs-relations", "achievement-vs-balance"];
          tradeoffAxes = fallbackAxisIds
            .map((id) => {
              const rendered = renderAxisLabels(id);
              return rendered ? { axisId: id, labelA: rendered.labelA, labelB: rendered.labelB } : null;
            })
            .filter(Boolean) as { axisId: string; labelA: string; labelB: string }[];
        }
      }

      // For core-code-confirm card: pass AI candidates, with fallback
      let candidates: unknown[] | undefined;
      if (next.cardType === "core-code-confirm") {
        if (structuredData) {
          const sd = structuredData as { candidates?: unknown[] };
          candidates = sd.candidates;
        }
        // Fallback: if AI didn't return candidates, build from compass data
        if (!candidates?.length) {
          const cd = compassDataRef.current;
          const storyText = (cd.W?.story?.value as string) || "";
          const heroes = cd.W?.heroTraits?.value as string[] | undefined;
          const quoteChild = (cd.W?.quoteChildhood?.value as string) || "";
          const quoteNow = (cd.W?.quoteNow?.value as string) || "";
          const themeTag = (cd.W?.quoteThemeTag?.value as string) || "";
          const storyShort = storyText.length > 30 ? storyText.slice(0, 30) + "…" : storyText;

          const fallbackCandidates: { name: string; definition: string; evidence: Record<string, string> }[] = [];

          // Candidate 1: from hero traits (e.g. "守信重诺")
          if (Array.isArray(heroes) && heroes[0]) {
            fallbackCandidates.push({
              name: heroes[0].length <= 4 ? heroes[0] : heroes[0].slice(0, 4),
              definition: `以「${heroes[0]}」为精神基因，代代传承`,
              evidence: { 英雄特质: heroes.slice(0, 2).join("、"), 故事: storyShort || "—" },
            });
          }

          // Candidate 3: from quote theme or second hero trait
          if (themeTag) {
            fallbackCandidates.push({
              name: themeTag.length <= 4 ? themeTag : themeTag.slice(0, 2),
              definition: `用「${themeTag}」的力量面对生活的不确定`,
              evidence: { 口头禅: `${quoteChild} → ${quoteNow}`.trim() || "—", 故事: storyShort || "—" },
            });
          } else if (Array.isArray(heroes) && heroes[1]) {
            fallbackCandidates.push({
              name: heroes[1].length <= 4 ? heroes[1] : heroes[1].slice(0, 4),
              definition: `在「${heroes[1]}」中找到家庭的立足之本`,
              evidence: { 英雄特质: heroes.slice(0, 3).join("、"), 故事: storyShort || "—" },
            });
          }

          if (fallbackCandidates.length > 0) candidates = fallbackCandidates;
        }
      }

      // For quote-fill card: inject dynamic hints from prior W data
      // For hero-select card: inject AI-generated traits from W-03 DATA (cached in ref)
      let heroTraitsList: { label: string; description: string }[] | undefined;
      if (next.cardType === "hero-select" && heroTraitsRef.current?.length) {
        heroTraitsList = heroTraitsRef.current;
      }

      let quoteHints: string[] | undefined;
      if (next.cardType === "quote-fill") {
        const cd = compassDataRef.current;
        const hints: string[] = [];
        // From hero traits
        const heroTraits = cd.W?.heroTraits?.value;
        if (Array.isArray(heroTraits)) hints.push(...heroTraits.slice(0, 3));
        // From tradeoff choices — the side they picked
        const tradeoffs = cd.W?.tradeoffChoices?.value;
        if (Array.isArray(tradeoffs)) {
          for (const t of tradeoffs.slice(0, 2)) {
            hints.push(t.choice === "A" ? t.labelA : t.labelB);
          }
        }
        // Deduplicate
        quoteHints = [...new Set(hints)].slice(0, 6);
      }

      // For flipside-fill card: inject coreCodeName + AI suggestions
      let coreCodeName: string | undefined;
      let flipsideSuggestions: { tags?: string[]; example?: string; benefits?: string[]; costs?: string[] } | undefined;
      if (next.cardType === "flipside-fill" || next.cardType === "upgrade-path") {
        coreCodeName = compassDataRef.current.W?.coreCode?.value?.name;
      }
      if (next.cardType === "flipside-fill") {
        // Try AI-generated suggestions first
        if (structuredData) {
          const sd = structuredData as { flipside?: { tags?: string[]; example?: string; benefits?: string[]; costs?: string[] } };
          if (sd.flipside) flipsideSuggestions = sd.flipside;
        }
        // Fallback: generate from compass data if AI didn't return DATA
        if (!flipsideSuggestions) {
          const cd = compassDataRef.current;
          const codeName = cd.W?.coreCode?.value?.name || "";
          const storyText = (cd.W?.story?.value as string) || "";
          const heroes = cd.W?.heroTraits?.value as string[] | undefined;
          const storyShort = storyText.length > 40 ? storyText.slice(0, 40) + "…" : storyText;
          // Generate contextual defaults
          const tagMap: Record<string, string[]> = {
            "规则原则": ["过度严格", "非黑即白"],
            "守信重诺": ["过度承诺", "不懂拒绝"],
            "韧性": ["硬扛不求助", "忽视情感"],
            "决断力": ["冲动决策", "忽视风险"],
            "信念": ["固执己见", "听不进劝"],
            "信任": ["过度信任", "缺乏防备"],
          };
          const benefitMap: Record<string, string[]> = {
            "规则原则": ["孩子有清晰的是非观", "家庭有底线和秩序", "做人有原则不随波逐流"],
            "守信重诺": ["别人信任我们", "孩子学会负责任", "家庭信誉好"],
            "韧性": ["抗压能力强", "遇事不慌", "能扛过困难期"],
            "决断力": ["执行力强", "不拖延纠结", "抓住机会快"],
            "信念": ["目标感强", "不轻易放弃", "给孩子榜样力量"],
            "信任": ["家庭关系亲密", "沟通坦诚", "孩子有安全感"],
          };
          const costMap: Record<string, string[]> = {
            "规则原则": ["孩子害怕犯错", "缺乏灵活变通", "亲子关系紧张"],
            "守信重诺": ["给自己太大压力", "不敢说出真实想法", "牺牲自己成全承诺"],
            "韧性": ["忽视身体和情感信号", "孩子不敢示弱", "累了也不休息"],
            "决断力": ["决策前调研不足", "忽略家人感受", "偶尔踩坑"],
            "信念": ["听不进不同意见", "给孩子太大压力", "过于理想化"],
            "信任": ["容易被辜负", "缺乏防备心", "孩子可能太天真"],
          };
          const defaultTags = tagMap[codeName] || ["压力过大", "忽视感受"];
          const defaultBenefits = benefitMap[codeName] || ["家庭有凝聚力", "孩子有方向感", "做事有章法"];
          const defaultCosts = costMap[codeName] || ["可能给孩子压力", "缺乏弹性", "忽视个体差异"];
          flipsideSuggestions = {
            tags: defaultTags,
            example: storyShort ? `比如在「${storyShort}」这样的情境下，可能会因为太坚持而忽略了其他声音` : `在日常生活中，「${codeName}」可能让我们对孩子要求过高`,
            benefits: defaultBenefits,
            costs: defaultCosts,
          };
        }
      }

      // For upgrade-path card: inject flipside context for smart defaults
      let flipsideCost: string | undefined;
      let upgradeSuggestions: { keep?: string; reduce?: string; from?: string; to?: string } | undefined;
      if (next.cardType === "upgrade-path") {
        const cd = compassDataRef.current;
        flipsideCost = cd.W?.flipsideCost?.value;
        const benefit = cd.W?.flipsideBenefit?.value;
        const cost = cd.W?.flipsideCost?.value;
        const tags = cd.W?.flipsideTags?.value;
        const example = cd.W?.flipsideExample?.value;
        const story = cd.W?.story?.value;
        // Build smart defaults from flipside answers
        if (benefit || cost) {
          upgradeSuggestions = {
            keep: typeof benefit === "string" ? benefit : undefined,
            reduce: typeof cost === "string" ? cost : (Array.isArray(tags) ? tags[0] : undefined),
            // Infer "from" from the flipside example or tags
            from: typeof example === "string" && example.length > 0
              ? example.slice(0, 20) + (example.length > 20 ? "…" : "")
              : (Array.isArray(tags) ? tags.join("、") : undefined),
            // Leave "to" empty — this is the creative part the user should think about
          };
        }
      }

      const cardMsg: Message = {
        role: "ai",
        content: "",
        timestamp: new Date(),
        moduleIndex: mod,
        cardType: next.cardType,
        cardProps: {
          ...next.cardProps,
          ...(next.cardType === "snapshot" && resolvedSnapshotContent
            ? { content: resolvedSnapshotContent }
            : {}),
          ...(abilityHint ? { aiHint: abilityHint } : {}),
          ...(tradeoffAxes ? { axes: tradeoffAxes } : {}),
          ...(heroTraitsList ? { traits: heroTraitsList } : {}),
          ...(candidates ? { candidates } : {}),
          ...(coreCodeName ? { coreCodeName } : {}),
          ...(flipsideCost ? { flipsideCost } : {}),
          ...(flipsideSuggestions ? { suggestions: flipsideSuggestions } : {}),
          ...(upgradeSuggestions ? { upgradeSuggestions } : {}),
          ...(quoteHints?.length ? { themeHints: quoteHints } : {}),
        },
      };
      setMessages((prev) => [...prev, cardMsg]);
      setCurrentNode(nextNode);
    } else {
      setCurrentNode(nextNode);
    }
  };

  const handleCardConfirm = useCallback((cardType: string, data: unknown) => {
    // Family code card — special handling
    if (cardType === "family-code") {
      const code = data as string;
      const oldCode = familyCodeRef.current;
      const isReEdit = startedRef.current && oldCode;

      setFamilyCode(code);
      familyCodeRef.current = code;

      // Write to compass data
      compassDataRef.current = { ...compassDataRef.current, familyCode: field(code, "user_typed") };
      bumpCompass();

      if (isReEdit) {
        // Re-edit: update DB, rebuild memo, show confirmation
    
        if (conversationIdRef.current) {
          runPersistTask(
            updateConversation(conversationIdRef.current, { family_code: code }),
            "家庭代号保存失败，请稍后重试"
          ).catch(console.error);
          runPersistTask(
            saveCompassData(conversationIdRef.current, compassDataRef.current as Record<string, unknown>),
            "家庭代号保存失败，请稍后重试"
          ).catch(console.error);
        }
        setMessages((prev) => [
          ...prev,
          { role: "ai", content: `家庭代号已从「${oldCode}」更新为「${code}」`, timestamp: new Date(), moduleIndex: currentModuleRef.current },
        ]);
        return;
      }

      // First-time: start the flow
      setStarted(true);
      startedRef.current = true;
  
      setMessages((prev) => [
        ...prev,
        { role: "user", content: `家庭代号：${code}`, timestamp: new Date(), moduleIndex: currentModuleRef.current },
      ]);
      setTimeout(() => requestAIMessage(code), 300);
      return;
    }

    const mod = currentModuleRef.current;
    const curNode = currentNodeRef.current;

    // Store card data
    const dataKey = `${FLOW[mod]?.id}_${curNode}_${cardType}`;
    setModuleData((prev) => ({ ...prev, [dataKey]: data }));

    const moduleId = FLOW[mod]?.id || "_";

    // ── Accumulate structured compass data + persist ──
    compassDataRef.current = updateCompassFromCard(
      compassDataRef.current, moduleId, cardType, curNode, data,
    );
    bumpCompass();
    // Rebuild memo at this milestone (card confirm)

    if (conversationIdRef.current) {
      runPersistTask(
        saveCompassData(
          conversationIdRef.current,
          compassDataRef.current as Record<string, unknown>,
        ),
        "卡片数据保存失败，请稍后重试"
      ).catch((err) => console.error("Failed to save compass data:", err));
    }

    // Add user message summarizing the card data
    let summary = "";
    if (cardType === "capital-matrix") {
      const rows = data as { label: string; level: string; keyword: string }[];
      summary = rows.map((r) => `${r.label}：${r.level}${r.keyword ? ` (${r.keyword})` : ""}`).join("；");

      // After capital-matrix → render capital-summary card with the rows injected
      setMessages((prev) => [
        ...prev,
        { role: "user", content: summary, timestamp: new Date(), cardData: data, moduleIndex: mod },
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
        moduleIndex: mod,
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
    } else if (cardType === "priority-select") {
      summary = `我选择优先升级：${data}`;
    } else if (cardType === "single-select") {
      const d = data as { selected: string; reason?: string };
      const dirMatch = d.selected.match(/^(内核|创造|连接)/);
      const dir = dirMatch?.[1] || d.selected;
      summary = `教育战略方向：${dir}`;
      if (d.reason) summary += `\n理由：${d.reason}`;
    } else if (cardType === "agree-disagree") {
      const d = data as { agreed: boolean; reason?: string };
      if (d.agreed) {
        summary = "同意";
      } else {
        summary = `不同意：${d.reason || ""}`;
      }
    } else if (cardType === "spirit-upgrade") {
      summary = data as string;
    } else if (cardType === "trend-rank") {
      const ranked = data as string[];
      summary = `趋势判断：${ranked[0]}（主假设）、${ranked[1]}（对冲）、${ranked[2]}（对冲）`;
    } else if (cardType === "ability-select") {
      summary = `能力押注：${data as string}`;
    } else if (cardType === "story-input") {
      const d = data as { story: string };
      summary = d.story;
    } else if (cardType === "tradeoff-choice") {
      const choices = data as { axisId: string; labelA: string; labelB: string; choice: "A" | "B" }[];
      summary = choices.map((c) => c.choice === "A" ? c.labelA : c.labelB).join("；");
    } else if (cardType === "hero-select") {
      summary = `英雄基因：${(data as string[]).join("、")}`;
    } else if (cardType === "quote-fill") {
      const d = data as { childhood: string; now: string; themeTag?: string };
      summary = `小时候听到：「${d.childhood}」；现在常说：「${d.now}」${d.themeTag ? `（保护：${d.themeTag}）` : ""}`;
    } else if (cardType === "core-code-confirm") {
      const d = data as { name: string; definition: string; userEdited?: boolean };
      summary = `家风内核：${d.name}（${d.definition}）${d.userEdited ? " [已改写]" : ""}`;
    } else if (cardType === "flipside-fill") {
      const d = data as { tags: string[]; example: string; benefit: string; cost: string };
      summary = `副作用：${d.tags.join("、")}；好处：${d.benefit}；代价：${d.cost}`;
    } else if (cardType === "upgrade-path") {
      const d = data as { keep: string; reduce: string; from: string; to: string };
      summary = `保留「${d.keep}」，从「${d.from}」→「${d.to}」，减少「${d.reduce}」`;
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
      const confirmedSnapshotText = data as string;
      setSnapshots((prev) => ({ ...prev, [moduleId]: data as string }));
      // Also persist snapshot to compass data (so restoration detects completion)
      if (moduleId) {
        const existingCheckpoints = compassDataRef.current.checkpoints || {};
        const currentModuleSnapshotData =
          (compassDataRef.current as Record<string, unknown>)[moduleId] as Record<string, unknown> | undefined;
        compassDataRef.current = {
          ...compassDataRef.current,
          checkpoints: {
            ...existingCheckpoints,
            [moduleId]: {
              completedAt: new Date().toISOString(),
              snapshot: confirmedSnapshotText,
              cursorAtSave: { module: mod, node: curNode },
            },
          },
          [moduleId]: {
            ...(currentModuleSnapshotData || {}),
            snapshot: field(confirmedSnapshotText, "user_selected"),
          },
        };
        bumpCompass();
        if (conversationIdRef.current) {
          runPersistTask(
            saveCompassData(conversationIdRef.current, compassDataRef.current as Record<string, unknown>),
            "模块快照保存失败，请稍后重试"
          ).catch(console.error);
        }
      }
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
          { role: "user", content: summary, timestamp: new Date(), moduleIndex: mod },
        ]);
        setTimeout(() => requestAIMessage(summary), 300);
        return;
      }
      // All 4 modules complete
      setAllComplete(true);
      setMessages((prev) => [
        ...prev,
        { role: "user", content: summary, timestamp: new Date(), moduleIndex: mod },
        {
          role: "ai",
          content: "恭喜你们完成了全部四个模块的探索！\n\n你们已经梳理了**家底**、审视了**眼光**、挖掘了**根基**、达成了**共识**。\n\n现在可以点击右侧的「导出家庭罗盘」，生成你们的专属 **《家庭战略定位罗盘》** 报告。",
          timestamp: new Date(),
          moduleIndex: mod,
        },
      ]);
      return;
    } else if (cardType === "value-gallery") {
      const d = data as {
        selfCore: string[]; selfDeferred: string[];
        partnerCore?: string[]; partnerDeferred?: string[];
        core: string[]; deferred: string[];
        partnerSkipped: boolean;
      };
      if (d.partnerSkipped) {
        summary = `我选的核心价值观：${d.core.join("、")}\n战略暂缓：${d.deferred.join("、")}`;
      } else {
        summary = `我选的核心价值观：${d.selfCore.join("、")}，暂缓：${d.selfDeferred.join("、")}\n`
          + `伴侣选的核心价值观：${d.partnerCore?.join("、")}，暂缓：${d.partnerDeferred?.join("、")}\n`
          + `经过协商，最终共识 → 核心聚焦：${d.core.join("、")}；战略暂缓：${d.deferred.join("、")}`;
      }

      // E-04 -> E-05/E-06 robust path:
      // Generate a deterministic bridge message locally and jump directly to agree-disagree card.
      // This prevents the flow from stalling if remote AI request fails at this transition.
      const selfCoreSet = new Set(d.selfCore);
      const partnerCoreValues = d.partnerCore || [];
      const partnerCoreSet = new Set(partnerCoreValues);
      const coreConsensusValues = d.core.filter((value) => selfCoreSet.has(value) && partnerCoreSet.has(value));
      const selfOnlyCoreValues = d.selfCore.filter((value) => !partnerCoreSet.has(value));
      const partnerOnlyCoreValues = partnerCoreValues.filter((value) => !selfCoreSet.has(value));

      const analysisParts: string[] = [];
      analysisParts.push(`我看到了你的直觉锚定：希望孩子拥有「${d.core.join("、")}」，也在警惕某些风险。`);
      if (d.partnerSkipped) {
        analysisParts.push("这次先按你个人视角推进，我们后续也可以再补伴侣视角来做双人校准。");
      } else {
        if (coreConsensusValues.length > 0) {
          analysisParts.push(`你们的核心共识是：${coreConsensusValues.join("、")}。`);
        }
        if (selfOnlyCoreValues.length > 0 || partnerOnlyCoreValues.length > 0) {
          analysisParts.push(
            `你们的差异主要在：${[
              selfOnlyCoreValues.length > 0 ? `你更看重${selfOnlyCoreValues.join("、")}` : "",
              partnerOnlyCoreValues.length > 0 ? `伴侣更看重${partnerOnlyCoreValues.join("、")}` : "",
            ].filter(Boolean).join("；")}。`
          );
        }
        analysisParts.push("这不是冲突，而是角色分工：一个偏推进，一个偏稳住。");
      }
      analysisParts.push("下面这句总结你认可吗？如果不完全认可，可以直接改写。");

      const localBridgeMessage = analysisParts.join("\n\n");

      setMessages((prev) => [
        ...prev,
        { role: "user", content: summary, timestamp: new Date(), cardData: data, moduleIndex: mod },
        { role: "ai", content: localBridgeMessage, timestamp: new Date(), moduleIndex: mod },
        {
          role: "ai",
          content: "",
          timestamp: new Date(),
          cardType: "agree-disagree",
          moduleIndex: mod,
          cardProps: {
            disagreePlaceholder: "你觉得哪里不对？比如：我们其实更看重的是……",
          },
        },
      ]);

      const agreeDisagreeNodeIndex = curNode + 2;
      currentNodeRef.current = agreeDisagreeNodeIndex;
      setCurrentNode(agreeDisagreeNodeIndex);
      return;
    }

    // Add as user message and request next AI response
    setMessages((prev) => [
      ...prev,
      { role: "user", content: summary, timestamp: new Date(), cardData: data, moduleIndex: mod },
    ]);

    // Move to next node
    const nextNode = curNode + 1;
    currentNodeRef.current = nextNode;
    setCurrentNode(nextNode);

    const nextFlowNode = FLOW[mod]?.nodes[nextNode];

    // ── N module template-based nodes ──
    // N-05 (index 4): diagnostic three-part template after ability-select
    if (moduleId === "N" && nextNode === 4) {
      const cd = compassDataRef.current;
      const topTrend = cd.N?.trendsRanked?.value?.[0] || "";
      const coreAbility = cd.N?.coreAbility?.value || "";
      const capitalMatrix = cd.S?.capitalMatrix?.value;
      const priorityUpgrade = cd.S?.priorityUpgrade?.value;

      const diag = generateDiagnostic({ topTrend, coreAbility, capitalMatrix, priorityUpgrade });

      // Store diagnostic insights in compass data
      compassDataRef.current = {
        ...compassDataRef.current,
        N: {
          ...compassDataRef.current.N,
          insightExplain: field(diag.explain, "template_based"),
          insightConnect: field(diag.connect, "template_based"),
          insightGap: field(diag.gap, "template_based"),
        },
      };
      bumpCompass();
      if (conversationIdRef.current) {
        runPersistTask(
          saveCompassData(conversationIdRef.current, compassDataRef.current as Record<string, unknown>),
          "模块数据保存失败，请稍后重试"
        ).catch(console.error);
      }

      const diagText = `**趋势洞察**\n${diag.explain}\n\n**家底关联**\n${diag.connect}\n\n**现状差距**\n${diag.gap}\n\n你觉得这个分析准确吗？`;
      const aiMsg: Message = { role: "ai", content: diagText, timestamp: new Date(), moduleIndex: mod };
      setMessages((prev) => [...prev, aiMsg]);

      // Advance to N-06 (agree-disagree card)
      const n06 = nextNode + 1;
      currentNodeRef.current = n06;
      setCurrentNode(n06);
      const n06Node = FLOW[mod]?.nodes[n06];
      if (n06Node?.type === "card") {
        const cardMsg: Message = {
          role: "ai", content: "", timestamp: new Date(),
          moduleIndex: mod,
          cardType: (n06Node as CardNode).cardType,
          cardProps: { ...(n06Node as CardNode).cardProps },
        };
        setMessages((prev) => [...prev, cardMsg]);
      }
      return;
    }

    // N-07 (index 6): template snapshot after agree-disagree
    if (moduleId === "N" && nextNode === 6) {
      const snapshotText = generateSnapshotFromFields(compassDataRef.current, "N");

      compassDataRef.current = {
        ...compassDataRef.current,
        N: {
          ...compassDataRef.current.N,
          snapshot: field(snapshotText, "template_based"),
        },
      };
      bumpCompass();
      if (conversationIdRef.current) {
        runPersistTask(
          saveCompassData(conversationIdRef.current, compassDataRef.current as Record<string, unknown>),
          "模块数据保存失败，请稍后重试"
        ).catch(console.error);
      }

      const aiMsg: Message = { role: "ai", content: "好的，我来帮你整理一下这个模块的要点。", timestamp: new Date(), moduleIndex: mod };
      setMessages((prev) => [...prev, aiMsg]);

      const n08 = nextNode + 1;
      currentNodeRef.current = n08;
      setCurrentNode(n08);
      const n08Node = FLOW[mod]?.nodes[n08];
      if (n08Node?.type === "card") {
        const cardMsg: Message = {
          role: "ai", content: "", timestamp: new Date(),
          moduleIndex: mod,
          cardType: (n08Node as CardNode).cardType,
          cardProps: { ...(n08Node as CardNode).cardProps, content: snapshotText },
        };
        setMessages((prev) => [...prev, cardMsg]);
      }
      return;
    }

    // ── W module template-based nodes ──
    // W-12 (index 11): final statement template after upgrade-path
    if (moduleId === "W" && nextNode === 11) {
      const cd = compassDataRef.current;
      const stmt = buildFinalStatement({
        coreCodeName: cd.W?.coreCode?.value?.name || "",
        keep: cd.W?.upgradeKeep?.value || "",
        from: cd.W?.upgradeFrom?.value || "",
        to: cd.W?.upgradeTo?.value || "",
        reduce: cd.W?.upgradeReduce?.value || "",
      });

      // Store final statement + snapshot
      const snapshotText = generateSnapshotFromFields(cd, "W");
      compassDataRef.current = {
        ...compassDataRef.current,
        W: {
          ...compassDataRef.current.W,
          finalStatement: field(stmt, "template_based"),
          snapshot: field(snapshotText, "template_based"),
        },
      };
      bumpCompass();
      if (conversationIdRef.current) {
        runPersistTask(
          saveCompassData(conversationIdRef.current, compassDataRef.current as Record<string, unknown>),
          "模块数据保存失败，请稍后重试"
        ).catch(console.error);
      }

      const aiMsg: Message = {
        role: "ai",
        content: `好的，根据你的所有回答，我帮你拼出了升级宣言：\n\n**${stmt}**\n\n下面是完整的根基快照，请确认。`,
        timestamp: new Date(),
        moduleIndex: mod,
      };
      setMessages((prev) => [...prev, aiMsg]);

      // Advance to W-13 (snapshot card)
      const w13 = nextNode + 1;
      currentNodeRef.current = w13;
      setCurrentNode(w13);
      const w13Node = FLOW[mod]?.nodes[w13];
      if (w13Node?.type === "card") {
        const cardMsg: Message = {
          role: "ai", content: "", timestamp: new Date(),
          moduleIndex: mod,
          cardType: (w13Node as CardNode).cardType,
          cardProps: { ...(w13Node as CardNode).cardProps, content: snapshotText },
        };
        setMessages((prev) => [...prev, cardMsg]);
      }
      return;
    }

    if (nextFlowNode?.type === "ai") {
      // Next is AI — request response
      setTimeout(() => requestAIMessage(summary), 300);
    } else if (nextFlowNode?.type === "card") {
      // Next is another card — render it immediately
      const nextCardType = (nextFlowNode as CardNode).cardType;
      const cardMsg: Message = {
        role: "ai",
        content: "",
        timestamp: new Date(),
        moduleIndex: mod,
        cardType: nextCardType,
        cardProps: {
          ...(nextFlowNode as CardNode).cardProps,
          // Inject cached hero traits for HeroSelectCard
          ...(nextCardType === "hero-select" && heroTraitsRef.current?.length
            ? { traits: heroTraitsRef.current }
            : {}),
        },
      };
      setMessages((prev) => [...prev, cardMsg]);
    }
  }, [requestAIMessage]);

  const handleSendMessage = useCallback(async (content: string) => {
    const mod = currentModuleRef.current;
    // Pre-flow special actions
    if (content === "##INTRO##") {
      setIntroShown(true);
      setMessages((prev) => [
        ...prev,
        { role: "user", content: "能先帮我介绍一下这个流程吗？", timestamp: new Date(), moduleIndex: currentModuleRef.current },
        {
          role: "ai",
          content: "当然可以！\n\n整个工坊分为 **四个模块**，大约需要 20-30 分钟：\n\n**模块一 · 我们的家底（S）** — 梳理家庭现有的资源和优势\n**模块二 · 我们的眼光（N）** — 分析外部环境和未来趋势\n**模块三 · 我们的根基（W）** — 挖掘家族的底层价值观\n**模块四 · 我们的共识（E）** — 对齐教育方向和底线\n\n每个模块我会通过对话和互动卡片引导你思考，最后生成一份 **《家庭战略定位罗盘》**。",
          timestamp: new Date(),
          moduleIndex: currentModuleRef.current,
        },
      ]);
      return;
    }

    if (content === "##START##" || content === "##GOTO_CODE##") {
      // Scroll to and focus the family code card input, with visual highlight
      setTimeout(() => {
        const card = document.querySelector<HTMLElement>(".max-w-md");
        const input = card?.querySelector<HTMLInputElement>("input");
        if (card && input) {
          card.scrollIntoView({ behavior: "smooth", block: "center" });
          // Brief highlight effect
          card.style.transition = "box-shadow 0.3s";
          card.style.boxShadow = "0 0 0 2px hsl(var(--primary))";
          input.focus();
          setTimeout(() => { card.style.boxShadow = ""; }, 1500);
        }
      }, 100);
      return;
    }

    if (!startedRef.current) {
      return;
    }

    // ── Detect family code update intent ──
    // Matches patterns like:
    //   家庭代号=Harvey / 家庭代号＝Harvey
    //   代号改成Harvey / 代号改为Harvey / 代号换成Harvey
    //   家庭代号应该是Harvey / 代号应该是Harvey
    //   代号写错了，应该是Harvey / 代号不对，是Harvey
    //   改成Harvey / 换成Harvey (only when short + looks like a code)
    const CODE_PATTERNS = [
      /(?:家庭)?代号\s*[=＝]\s*(.{1,12})$/,
      /(?:家庭)?代号\s*(?:改成|改为|换成|更新为|更改为)\s*(.{1,12})$/,
      /(?:家庭)?代号\s*(?:应该|应当)是\s*(.{1,12})$/,
      /(?:家庭)?代号\s*(?:写错了|不对|错了)[，,]?\s*(?:应该是|是|改成)?\s*(.{1,12})$/,
      /(?:应该是|其实是|正确的是)\s*(.{1,12})$/,
    ];
    let detectedCode: string | null = null;
    for (const pattern of CODE_PATTERNS) {
      const m = content.trim().match(pattern);
      if (m) { detectedCode = m[1].trim(); break; }
    }
    // Last pattern ("应该是X") is ambiguous — only treat as code update
    // if the value looks like a short code (≤6 chars, no spaces, no punctuation)
    if (detectedCode && content.trim().match(/^(?:应该是|其实是|正确的是)/)) {
      if (detectedCode.length > 6 || /[\s，。！？,.!?]/.test(detectedCode)) {
        detectedCode = null; // too long or has punctuation → not a code update
      }
    }
    if (detectedCode && detectedCode.length >= 1 && !/\s/.test(detectedCode)) {
      const oldCode = familyCodeRef.current;
      setFamilyCode(detectedCode);
      familyCodeRef.current = detectedCode;
      compassDataRef.current = { ...compassDataRef.current, familyCode: field(detectedCode, "user_typed") };
      bumpCompass();
  
      if (conversationIdRef.current) {
        runPersistTask(
          updateConversation(conversationIdRef.current, { family_code: detectedCode }),
          "家庭代号更新失败，请稍后重试"
        ).catch(console.error);
        runPersistTask(
          saveCompassData(conversationIdRef.current, compassDataRef.current as Record<string, unknown>),
          "家庭代号更新失败，请稍后重试"
        ).catch(console.error);
      }
      setMessages((prev) => [
        ...prev,
        { role: "user", content, timestamp: new Date(), moduleIndex: currentModuleRef.current },
        { role: "ai", content: `家庭代号已从「${oldCode}」更新为「${detectedCode}」`, timestamp: new Date(), moduleIndex: currentModuleRef.current },
      ]);
      return;
    }

    // Regular user text reply
    setMessages((prev) => [
      ...prev,
      { role: "user", content, timestamp: new Date(), moduleIndex: mod },
    ]);

    // Save user free-text responses to compass_data
    const moduleId = FLOW[mod]?.id;
    const nodeIdx = currentNodeRef.current;

    // S-05: user explains capital assessment rationale (node index 4)
    if (moduleId === "S" && nodeIdx === 4) {
      if (!compassDataRef.current.S) compassDataRef.current.S = {};
      compassDataRef.current.S.capitalRationale = field(content, "user_typed");
      bumpCompass();
      if (conversationIdRef.current) {
        runPersistTask(
          saveCompassData(
            conversationIdRef.current,
            compassDataRef.current as Record<string, unknown>,
          ),
          "输入内容保存失败，请稍后重试"
        ).catch((err) => console.error("Failed to save S.capitalRationale:", err));
      }
    }
    // W-01 multi-round gate: stay on node 0, send user reply to AI without advancing
    if (moduleId === "W" && nodeIdx === 0) {
      w01RoundRef.current += 1;
      // Frontend safeguard: if 4+ user replies and AI still hasn't sent READY,
      // force advance to StoryInputCard
      if (w01RoundRef.current >= 4) {
        const forceNode = 1; // W-02: story-input card
        currentNodeRef.current = forceNode;
        setCurrentNode(forceNode);
        const cardNode = FLOW[mod]?.nodes[forceNode];
        if (cardNode?.type === "card") {
          setMessages((prev) => [...prev, {
            role: "ai",
            content: "好的，聊了不少了。现在请在下面的卡片里，把你印象最深的那个瞬间用 1-3 句话写下来。",
            timestamp: new Date(),
            moduleIndex: mod,
          }, {
            role: "ai",
            content: "",
            timestamp: new Date(),
            cardType: (cardNode as CardNode).cardType,
            cardProps: { ...(cardNode as CardNode).cardProps },
            moduleIndex: mod,
          }]);
        }
        return;
      }
      await requestAIMessage(content);
      return;
    }

    // Advance past the user node
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
        moduleIndex: mod,
      };
      setMessages((prev) => [...prev, cardMsg]);
    }
  }, [requestAIMessage]);

  const pruneCompassFromModule = useCallback((sourceCompassData: CompassDataSchema, fromModuleIndex: number): CompassDataSchema => {
    const nextCompassData: CompassDataSchema = { ...sourceCompassData };
    for (let moduleIndex = fromModuleIndex; moduleIndex < FLOW.length; moduleIndex += 1) {
      const moduleId = moduleIdByIndex(moduleIndex);
      delete (nextCompassData as Record<string, unknown>)[moduleId];
    }
    if (nextCompassData.checkpoints) {
      const nextCheckpoints = { ...nextCompassData.checkpoints };
      for (let moduleIndex = fromModuleIndex; moduleIndex < FLOW.length; moduleIndex += 1) {
        delete nextCheckpoints[moduleIdByIndex(moduleIndex)];
      }
      nextCompassData.checkpoints = nextCheckpoints;
    }
    return nextCompassData;
  }, []);

  const handleRestartModule = useCallback(async (targetModuleIndex: number) => {
    const cid = conversationIdRef.current;
    if (!cid) return;

    const safeModuleIndex = Math.max(0, Math.min(targetModuleIndex, FLOW.length - 1));
    const startedAfterRestart = startedRef.current || Boolean(familyCodeRef.current);

    setIsAiTyping(false);
    setStreamingContent("");
    setAllComplete(false);
    w01RoundRef.current = 0;
    heroTraitsRef.current = null;

    const prunedCompassData = pruneCompassFromModule(compassDataRef.current, safeModuleIndex);
    compassDataRef.current = prunedCompassData;
    bumpCompass();

    const snapshotsAfterRestart = extractSnapshotsFromCompass(prunedCompassData);
    const completedAfterRestart = computeCompletedModulesFromCompass(prunedCompassData)
      .filter((moduleIndex) => moduleIndex < safeModuleIndex);

    setSnapshots(snapshotsAfterRestart);
    snapshotsRef.current = snapshotsAfterRestart;
    setCompletedModules(completedAfterRestart);
    completedModulesRef.current = completedAfterRestart;
    setCurrentModule(safeModuleIndex);
    currentModuleRef.current = safeModuleIndex;
    setCurrentNode(0);
    currentNodeRef.current = 0;
    setModuleData({});
    moduleDataRef.current = {};
    allDataRef.current = Object.fromEntries(
      Object.entries(allDataRef.current).filter(([moduleId]) => {
        const moduleOrder = ["S", "N", "W", "E"];
        const modulePosition = moduleOrder.indexOf(moduleId);
        return modulePosition >= 0 && modulePosition < safeModuleIndex;
      })
    );
    setStarted(startedAfterRestart);
    startedRef.current = startedAfterRestart;

    try {
      await runPersistTask(Promise.all([
        saveCompassData(cid, prunedCompassData as Record<string, unknown>),
        deleteMessagesFromModule(cid, safeModuleIndex),
        updateConversation(cid, {
          current_module: safeModuleIndex,
          current_node: 0,
          started: startedAfterRestart,
          family_code: familyCodeRef.current,
        }),
      ]), "模块重开失败，请稍后重试");

      const remainingMessages = deduplicateMessages(await loadMessages(cid));
      const fixedMessages = ensureActiveCardMessage(remainingMessages, safeModuleIndex, 0);
      const repairedMessages = repairResumeCardProps(fixedMessages);
      const rebuiltModuleData = rebuildModuleDataFromMessages(repairedMessages);

      setMessages(repairedMessages);
      messagesRef.current = repairedMessages;
      lastSavedCountRef.current = repairedMessages.length;
      setModuleData(rebuiltModuleData);
      moduleDataRef.current = rebuiltModuleData;

      if (startedAfterRestart) {
        setTimeout(() => requestAIMessage(`我们重新开始${FLOW[safeModuleIndex]?.label || "当前"}模块`), 300);
      }
    } catch (error) {
      console.error("Failed to restart module:", error);
    }
  }, [
    computeCompletedModulesFromCompass,
    deduplicateMessages,
    ensureActiveCardMessage,
    extractSnapshotsFromCompass,
    pruneCompassFromModule,
    rebuildModuleDataFromMessages,
    requestAIMessage,
    runPersistTask,
  ]);

  const handleStepClick = (stepId: StepId) => {
    // Only allow clicking completed or current steps
    const stepIndex = STEPS.findIndex((s) => s.id === stepId);
    if (completedModules.includes(stepIndex) || stepIndex === currentModule) {
      // For now just visual, no navigation
    }
  };

  // (init logic merged into the single mount effect above)

  return (
    <div className="h-full flex flex-col overflow-hidden bg-background">
      <TopBanner />
      <div className="flex-1 flex overflow-hidden px-6 py-4">
        <ResizablePanelGroup direction="horizontal" className="gap-0">
          <ResizablePanel defaultSize={65} minSize={50}>
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
                totalPhases={STEPS.length * 3}
                hasUserReplied={hasUserReplied}
                isAiTyping={isAiTyping}
                streamingContent={streamingContent}
                onCardConfirm={handleCardConfirm}
                familyCodeConfirmed={started}
                familyCode={familyCode}
                introShown={introShown}
                onShowHistory={() => {
                  // Open drawer IMMEDIATELY — data loads inside with loading state
                  setShowHistory(true);
                  setLoadingHistory(true);
                  listConversations()
                    .then((convos) => {
                      setConversations(convos);
                      setLoadingHistory(false);
                      // Load compass data in background — don't block drawer
                      const cdMap: Record<string, CompassDataSchema> = {};
                      Promise.allSettled(
                        convos.map((c) =>
                          loadCompassData(c.id).then((cd) => {
                            if (cd) cdMap[c.id] = cd as CompassDataSchema;
                          })
                        )
                      ).then(() => setDrawerCompassMap(cdMap));
                    })
                    .catch((err) => {
                      console.error("Failed to refresh conversations:", err);
                      setLoadingHistory(false);
                    });
                }}
                onLogout={handleLogout}
                compassData={compassDataRef.current}
              />
            </div>
          </ResizablePanel>
          <ResizableHandle className="w-px mx-3 my-8 bg-border/50 rounded-full transition-all duration-200 hover:bg-primary/40 hover:w-[3px] hover:mx-[11px] active:bg-primary/60 active:w-[3px] data-[resize-handle-active]:bg-primary/60 data-[resize-handle-active]:w-[3px]" />
          <ResizablePanel defaultSize={35} minSize={20} maxSize={45}>
            <div className="h-full overflow-y-auto bg-background">
              <RightRail
                currentStep={currentStep}
                currentPhase={currentPhase}
                completedSteps={completedSteps}
                completedPhases={completedPhases}
                steps={STEPS}
                onExport={() => window.open(`/compass?cid=${conversationId || ""}`, "_blank")}
                compassData={compassDataRef.current}
                started={started}
                saveState={saveState}
                lastSavedAt={lastSavedAt}
                saveError={saveError}
                onRestartModule={handleRestartModule}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* History drawer overlay */}
      {showHistory && (
        <HistoryDrawer
          conversations={conversations}
          currentId={conversationId}
          compassDataMap={drawerCompassMap}
          onSelect={handleLoadConversation}
          onNewChat={() => {
            setShowHistory(false);
            handleNewConversation(familyCode || undefined);
          }}
          onClose={() => setShowHistory(false)}
          onLogout={handleLogout}
          loading={loadingHistory}
        />
      )}

      <FeedbackWidget
        conversationId={conversationId}
        familyCode={familyCode}
        currentStepId={currentStep}
        currentStepLabel={currentStepInfo.label}
        currentPhase={currentPhase}
        currentNodeIndex={currentNode}
        currentNodeType={currentNodeType}
        currentCardType={currentCardType}
        messages={messages}
      />
    </div>
  );
};

// ─── History Drawer Component ────────────────────────

const MODULE_NAMES = ["家底", "眼光", "根基", "共识"];

function getSmartTitle(convo: Conversation, cd?: CompassDataSchema): string {
  const code = convo.family_code;
  if (!convo.started) return code ? `${code} 家庭` : "新对话";
  return code ? `${code} 家庭愿景` : "家庭愿景";
}

function getStatusText(convo: Conversation, cd?: CompassDataSchema): string {
  if (!convo.started) return "未开始 · 等待确认家庭代号";

  const moduleIndex = convo.current_module;
  const moduleName = MODULE_NAMES[moduleIndex] || "未知";

  // If all 4 modules complete
  if (moduleIndex >= 3 && cd?.E?.snapshot) {
    return "已完成 · 罗盘已生成";
  }

  return `进行中 · 第 ${moduleIndex + 1}/4 步：${moduleName}`;
}

function formatTime(dateStr: string, full = false): string {
  const d = new Date(dateStr);
  if (full) {
    return d.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return `更新于 ${d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}`;
}

function HistoryDrawer({
  conversations,
  currentId,
  compassDataMap,
  onSelect,
  onNewChat,
  onClose,
  onLogout,
  loading,
}: {
  conversations: Conversation[];
  currentId: string | null;
  compassDataMap: Record<string, CompassDataSchema>;
  onSelect: (convo: Conversation) => void;
  onNewChat: () => void;
  onClose: () => void;
  onLogout: () => void;
  loading?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const query = search.trim().toLowerCase();
  const filtered = query
    ? conversations.filter((c) => {
        const title = getSmartTitle(c, compassDataMap[c.id]).toLowerCase();
        const code = (c.family_code || "").toLowerCase();
        const date = new Date(c.updated_at).toLocaleDateString("zh-CN");
        return title.includes(query) || code.includes(query) || date.includes(query);
      })
    : conversations;

  // Split into active (current) vs history
  const active = filtered.find((c) => c.id === currentId);
  const history = filtered.filter((c) => c.id !== currentId);

  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />
      <div className="fixed left-0 top-0 bottom-0 w-80 bg-background border-r border-border z-50 flex flex-col animate-slide-in-left">
        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-medium">历史对话</h2>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowSearch(!showSearch)}
                className={`p-1.5 rounded-md transition-colors ${showSearch ? "text-foreground bg-muted" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                title="搜索"
              >
                <Search size={15} />
              </button>
              <button onClick={onClose} className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <X size={15} />
              </button>
            </div>
          </div>

          {/* New Chat button */}
          <button
            onClick={onNewChat}
            className="w-full flex items-center justify-center gap-1.5 text-[13px] font-medium bg-foreground text-background rounded-lg px-3 py-2 hover:opacity-90 transition-opacity"
          >
            <Plus size={14} />
            新建愿景对话
          </button>

          {/* Search input */}
          {showSearch && (
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索标题、代号、日期..."
              autoFocus
              className="w-full mt-2.5 text-[12.5px] bg-secondary/50 border border-border rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-primary/30 placeholder:text-muted-foreground/50"
            />
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <p className="text-[13px] text-muted-foreground px-5 py-8 text-center animate-pulse">
              加载中…
            </p>
          ) : filtered.length === 0 ? (
            <p className="text-[13px] text-muted-foreground px-5 py-8 text-center">
              {query ? "无匹配结果" : "暂无历史对话"}
            </p>
          ) : (
            <>
              {/* Active / 继续进行 */}
              {active && (
                <>
                  <div className="px-5 pt-3 pb-1">
                    <p className="text-[10.5px] font-semibold text-muted-foreground tracking-wide">继续进行（1）</p>
                  </div>
                  <ConvoItem
                    convo={active}
                    cd={compassDataMap[active.id]}
                    isCurrent
                    onClick={() => onSelect(active)}
                  />
                </>
              )}

              {/* History / 历史记录 */}
              {history.length > 0 && (
                <>
                  <div className="flex items-center justify-between px-5 pt-3 pb-1">
                    <p className="text-[10.5px] font-semibold text-muted-foreground tracking-wide">
                      历史记录（{history.length}）
                    </p>
                    <button
                      onClick={onNewChat}
                      className="text-[10.5px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-0.5"
                    >
                      <Plus size={11} />
                      新建对话
                    </button>
                  </div>
                  {history.map((convo) => (
                    <ConvoItem
                      key={convo.id}
                      convo={convo}
                      cd={compassDataMap[convo.id]}
                      isCurrent={false}
                      onClick={() => onSelect(convo)}
                    />
                  ))}
                </>
              )}
            </>
          )}
        </div>

        {/* Bottom: logout */}
        <div className="px-5 py-3 border-t border-border">
          <button
            onClick={onLogout}
            className="w-full text-[12.5px] text-muted-foreground hover:text-foreground py-2 rounded-lg hover:bg-secondary/50 transition-colors"
          >
            退出登录
          </button>
        </div>
      </div>
    </>
  );
}

function ConvoItem({
  convo,
  cd,
  isCurrent,
  onClick,
}: {
  convo: Conversation;
  cd?: CompassDataSchema;
  isCurrent: boolean;
  onClick: () => void;
}) {
  const title = getSmartTitle(convo, cd);
  const status = getStatusText(convo, cd);
  const time = isCurrent
    ? formatTime(convo.updated_at)
    : formatTime(convo.updated_at, true);

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-5 py-3 border-b border-border/40 hover:bg-secondary/50 transition-colors ${
        isCurrent ? "bg-secondary/60" : ""
      }`}
    >
      <div className="text-[13px] font-medium truncate">{title}</div>
      <div className="text-[11px] text-muted-foreground/70 mt-0.5 truncate">{status}</div>
      <div className="text-[10.5px] text-muted-foreground/50 mt-0.5">{time}</div>
    </button>
  );
}

export default Workspace;
