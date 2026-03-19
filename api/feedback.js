import { createClient } from "@supabase/supabase-js";

function createFeedbackId() {
  return `fb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function getSupabaseAdminClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseServiceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Supabase admin env missing: SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function resolveUserIdByConversationId(supabaseAdmin, conversationId) {
  if (!conversationId) return null;
  const { data, error } = await supabaseAdmin
    .from("conversations")
    .select("user_id")
    .eq("id", conversationId)
    .single();

  if (error) {
    console.warn("[feedback] resolve user_id failed:", error.message);
    return null;
  }
  return data?.user_id || null;
}

async function forwardToWebhook(payload) {
  const webhookUrl = process.env.FEEDBACK_WEBHOOK_URL;
  if (!webhookUrl) return;
  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error("[feedback] webhook forward failed:", error);
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    area,
    issueType,
    description,
    reproducibility,
    contact,
    context,
    recentMessages,
  } = req.body || {};

  if (!description || typeof description !== "string" || !description.trim()) {
    return res.status(400).json({ error: "description is required" });
  }

  const feedbackRecord = {
    id: createFeedbackId(),
    area: typeof area === "string" ? area : "未分类",
    issueType: typeof issueType === "string" ? issueType : "其他",
    description: description.trim(),
    reproducibility: typeof reproducibility === "string" ? reproducibility : undefined,
    contact: typeof contact === "string" ? contact : undefined,
    context: context || {},
    recentMessages: Array.isArray(recentMessages) ? recentMessages : [],
    receivedAt: new Date().toISOString(),
  };

  try {
    const supabaseAdmin = getSupabaseAdminClient();
    const conversationId = context?.conversationId || null;
    const resolvedUserId = await resolveUserIdByConversationId(supabaseAdmin, conversationId);

    const insertPayload = {
      id: feedbackRecord.id,
      user_id: resolvedUserId,
      conversation_id: conversationId,
      area: feedbackRecord.area,
      issue_type: feedbackRecord.issueType,
      description: feedbackRecord.description,
      reproducibility: feedbackRecord.reproducibility || null,
      contact: feedbackRecord.contact || null,
      context: feedbackRecord.context || {},
      recent_messages: feedbackRecord.recentMessages || [],
      source: "in_app_widget",
      created_at: feedbackRecord.receivedAt,
    };

    const { error } = await supabaseAdmin.from("feedbacks").insert(insertPayload);
    if (error) {
      console.error("[feedback] supabase insert failed:", error);
      return res.status(500).json({ error: "failed to store feedback" });
    }

    await forwardToWebhook(feedbackRecord);
    return res.status(200).json({ ok: true, feedbackId: feedbackRecord.id });
  } catch (error) {
    console.error("[feedback] submit failed:", error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : "feedback submit failed",
    });
  }
}
