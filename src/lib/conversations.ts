import { supabase } from "@/lib/supabase";
import type { Message } from "@/pages/Workspace";

// ─── Types ────────────────────────────────────────────

export interface Conversation {
  id: string;
  user_id: string;
  family_code: string;
  title: string;
  status: "active" | "archived";
  current_module: number;
  current_node: number;
  started: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbMessage {
  id: string;
  conversation_id: string;
  role: "ai" | "user";
  content: string;
  card_type: string | null;
  card_props: Record<string, unknown> | null;
  card_data: unknown | null;
  snapshot_content: string | null;
  created_at: string;
}

// ─── Conversations ───────────────────────────────────

export async function listConversations(): Promise<Conversation[]> {
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("status", "active")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createConversation(familyCode: string, title?: string): Promise<Conversation> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("conversations")
    .insert({
      user_id: user.id,
      family_code: familyCode,
      title: title || `${familyCode} 家庭愿景`,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateConversation(
  id: string,
  updates: Partial<Pick<Conversation, "family_code" | "title" | "current_module" | "current_node" | "started">>
): Promise<void> {
  const { error } = await supabase
    .from("conversations")
    .update(updates)
    .eq("id", id);

  if (error) throw error;
}

export async function archiveConversation(id: string): Promise<void> {
  const { error } = await supabase
    .from("conversations")
    .update({ status: "archived" })
    .eq("id", id);

  if (error) throw error;
}

// ─── Messages ────────────────────────────────────────

export async function loadMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data || []).map((m: DbMessage) => ({
    role: m.role as "ai" | "user",
    content: m.content,
    timestamp: new Date(m.created_at),
    cardType: m.card_type || undefined,
    cardProps: m.card_props || undefined,
    cardData: m.card_data || undefined,
    snapshotContent: m.snapshot_content || undefined,
  }));
}

export async function saveMessage(
  conversationId: string,
  msg: Message
): Promise<void> {
  const { error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      role: msg.role,
      content: msg.content,
      card_type: msg.cardType || null,
      card_props: msg.cardProps || null,
      card_data: msg.cardData || null,
      snapshot_content: msg.snapshotContent || null,
    });

  if (error) throw error;
}

export async function saveMessages(
  conversationId: string,
  msgs: Message[]
): Promise<void> {
  const rows = msgs.map((msg) => ({
    conversation_id: conversationId,
    role: msg.role,
    content: msg.content,
    card_type: msg.cardType || null,
    card_props: msg.cardProps || null,
    card_data: msg.cardData || null,
    snapshot_content: msg.snapshotContent || null,
  }));

  const { error } = await supabase.from("messages").insert(rows);
  if (error) throw error;
}

// ─── Compass Data ────────────────────────────────────

export async function saveCompassData(
  conversationId: string,
  compassData: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase
    .from("compass_data")
    .upsert(
      { conversation_id: conversationId, data: compassData },
      { onConflict: "conversation_id" }
    );

  if (error) throw error;
}

export async function loadCompassData(
  conversationId: string
): Promise<Record<string, unknown> | null> {
  const { data, error } = await supabase
    .from("compass_data")
    .select("data")
    .eq("conversation_id", conversationId)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // not found
    throw error;
  }
  return data?.data || null;
}
