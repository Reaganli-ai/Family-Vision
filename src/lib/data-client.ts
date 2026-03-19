/**
 * Data access layer — all Supabase calls go through here.
 * UI components never call supabase directly.
 * Every call logs: trigger, params, duration, result count, error.
 */

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

interface DbMessage {
  id: string;
  conversation_id: string;
  role: "ai" | "user";
  content: string;
  card_type: string | null;
  card_props: Record<string, unknown> | null;
  card_data: unknown | null;
  snapshot_content: string | null;
  module_index: number | null;
  created_at: string;
}

// ─── Logger ───────────────────────────────────────────

function log(method: string, params: Record<string, unknown>, startMs: number, result: { rows?: number; error?: string }) {
  const ms = Date.now() - startMs;
  const status = result.error ? `❌ ${result.error}` : `✅ ${result.rows ?? 0} rows`;
  console.log(`[data] ${method}(${JSON.stringify(params)}) ${ms}ms ${status}`);
}

// ─── Conversations ────────────────────────────────────

export async function listConversations(): Promise<Conversation[]> {
  const t = Date.now();
  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("status", "active")
    .order("updated_at", { ascending: false });

  log("listConversations", {}, t, { rows: data?.length, error: error?.message });
  if (error) throw error;
  return data || [];
}

export async function createConversation(familyCode: string, title?: string): Promise<Conversation> {
  const t = Date.now();
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

  log("createConversation", { familyCode }, t, { rows: data ? 1 : 0, error: error?.message });
  if (error) throw error;
  return data;
}

export async function updateConversation(
  id: string,
  updates: Partial<Pick<Conversation, "family_code" | "title" | "current_module" | "current_node" | "started">>
): Promise<void> {
  const t = Date.now();
  const { error } = await supabase
    .from("conversations")
    .update(updates)
    .eq("id", id);

  log("updateConversation", { id: id.slice(0, 8) }, t, { error: error?.message });
  if (error) throw error;
}

// ─── Messages ─────────────────────────────────────────

export async function loadMessages(conversationId: string): Promise<Message[]> {
  const t = Date.now();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  log("loadMessages", { cid: conversationId.slice(0, 8) }, t, { rows: data?.length, error: error?.message });
  if (error) throw error;

  return (data || []).map((m: DbMessage) => ({
    id: m.id,
    role: m.role as "ai" | "user",
    content: m.content,
    timestamp: new Date(m.created_at),
    cardType: m.card_type || undefined,
    cardProps: m.card_props || undefined,
    cardData: m.card_data || undefined,
    snapshotContent: m.snapshot_content || undefined,
    moduleIndex: typeof m.module_index === "number" ? m.module_index : undefined,
  }));
}

export async function saveMessage(conversationId: string, msg: Message): Promise<void> {
  const t = Date.now();
  const payloadWithModule = {
    conversation_id: conversationId,
    role: msg.role,
    content: msg.content,
    card_type: msg.cardType || null,
    card_props: msg.cardProps || null,
    card_data: msg.cardData || null,
    snapshot_content: msg.snapshotContent || null,
    module_index: typeof msg.moduleIndex === "number" ? msg.moduleIndex : null,
  };

  let { error } = await supabase
    .from("messages")
    .insert(payloadWithModule);

  // Backward compatibility: if DB schema not yet migrated (no module_index),
  // retry once without this field so existing deployments keep working.
  if (error?.message?.includes("module_index")) {
    ({ error } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        role: msg.role,
        content: msg.content,
        card_type: msg.cardType || null,
        card_props: msg.cardProps || null,
        card_data: msg.cardData || null,
        snapshot_content: msg.snapshotContent || null,
      }));
  }

  if (!error) {
    const { error: touchError } = await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);
    if (touchError) {
      console.error("Failed to touch conversation updated_at:", touchError);
    }
  }

  log("saveMessage", { cid: conversationId.slice(0, 8), role: msg.role }, t, { error: error?.message });
  if (error) throw error;
}

export async function deleteMessagesFromModule(
  conversationId: string,
  fromModuleIndex: number
): Promise<void> {
  const t = Date.now();
  const { error } = await supabase
    .from("messages")
    .delete()
    .eq("conversation_id", conversationId)
    .gte("module_index", fromModuleIndex);

  // If schema isn't migrated yet, fail clearly so caller can choose fallback.
  if (error?.message?.includes("module_index")) {
    log("deleteMessagesFromModule", { cid: conversationId.slice(0, 8), fromModuleIndex }, t, { error: "module_index missing" });
    throw new Error("messages.module_index 不存在，请先执行数据库迁移");
  }

  log("deleteMessagesFromModule", { cid: conversationId.slice(0, 8), fromModuleIndex }, t, { error: error?.message });
  if (error) throw error;
}

// ─── Compass Data ─────────────────────────────────────

export async function saveCompassData(
  conversationId: string,
  compassData: Record<string, unknown>
): Promise<void> {
  const t = Date.now();
  const { error } = await supabase
    .from("compass_data")
    .upsert(
      { conversation_id: conversationId, data: compassData },
      { onConflict: "conversation_id" }
    );

  log("saveCompassData", { cid: conversationId.slice(0, 8) }, t, { error: error?.message });
  if (error) throw error;
}

export async function loadCompassData(
  conversationId: string
): Promise<Record<string, unknown> | null> {
  const t = Date.now();
  const { data, error } = await supabase
    .from("compass_data")
    .select("data")
    .eq("conversation_id", conversationId)
    .maybeSingle();

  log("loadCompassData", { cid: conversationId.slice(0, 8) }, t, {
    rows: data ? 1 : 0,
    error: error?.message,
  });
  if (error) throw error;
  return data?.data || null;
}
