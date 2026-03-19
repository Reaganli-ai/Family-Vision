function createFeedbackId() {
  return `fb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
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

  console.log("[feedback] received:", JSON.stringify(feedbackRecord));
  await forwardToWebhook(feedbackRecord);

  return res.status(200).json({ ok: true, feedbackId: feedbackRecord.id });
}
