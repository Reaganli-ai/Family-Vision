const API_BASE = import.meta.env.DEV ? "http://localhost:3001" : "";

export interface ChatMessage {
  role: "ai" | "user";
  content: string;
}

export interface AIState {
  step: string;
  phase: string;
  questionIndex: number;
  totalQuestions: number;
  summary?: string;
  phaseComplete?: boolean;
  stepComplete?: boolean;
}

export interface FeedbackContext {
  conversationId: string | null;
  familyCode: string;
  stepId: string;
  stepLabel: string;
  phase: string;
  nodeIndex: number;
  nodeType: string;
  cardType?: string;
  url: string;
  timestamp: string;
}

export interface FeedbackPayload {
  area: string;
  issueType: string;
  description: string;
  reproducibility?: string;
  contact?: string;
  context: FeedbackContext;
  recentMessages: Array<{ role: "ai" | "user"; content: string }>;
}

function parseStateFromContent(content: string): {
  cleanContent: string;
  state: AIState | null;
} {
  const stateMatch = content.match(/<!--STATE:(.*?)-->/s);
  if (!stateMatch) {
    return { cleanContent: content, state: null };
  }

  const cleanContent = content.replace(/<!--STATE:.*?-->/s, "").trim();
  try {
    const state = JSON.parse(stateMatch[1]) as AIState;
    return { cleanContent, state };
  } catch {
    return { cleanContent, state: null };
  }
}

export async function sendChatMessage(
  messages: ChatMessage[],
  onChunk: (text: string) => void,
  onState: (state: AIState) => void,
  onDone: (finalContent: string) => void,
  onError: (error: string) => void
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      onError(`API error: ${response.status}`);
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      onError("No response body");
      return;
    }

    const decoder = new TextDecoder();
    let fullContent = "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      // Keep the last incomplete line in the buffer
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data: ")) continue;

        const data = trimmed.slice(6);
        if (data === "[DONE]") {
          const { cleanContent, state } = parseStateFromContent(fullContent);
          if (state) onState(state);
          onDone(cleanContent);
          return;
        }
        try {
          const parsed = JSON.parse(data);
          if (parsed.text) {
            fullContent += parsed.text;
            const visibleText = fullContent
              .replace(/<!--STATE:.*?-->/s, "")
              .replace(/<!--STATE:.*/s, "");
            onChunk(visibleText);
          }
          if (parsed.error) {
            onError(parsed.error);
            return;
          }
        } catch {
          // skip malformed JSON
        }
      }
    }

    // Stream ended without [DONE] — still finalize
    const { cleanContent, state } = parseStateFromContent(fullContent);
    if (state) onState(state);
    onDone(cleanContent);
  } catch (error) {
    onError(error instanceof Error ? error.message : "Unknown error");
  }
}

export async function submitFeedback(payload: FeedbackPayload): Promise<{ ok: boolean; feedbackId?: string }> {
  const response = await fetch(`${API_BASE}/api/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Feedback API error: ${response.status}`);
  }

  return response.json();
}
