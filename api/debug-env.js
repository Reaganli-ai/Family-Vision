export default function handler(req, res) {
  res.json({
    hasKey: !!process.env.ANTHROPIC_API_KEY,
    keyPrefix: process.env.ANTHROPIC_API_KEY ? process.env.ANTHROPIC_API_KEY.substring(0, 8) + "..." : "NOT_SET",
    nodeEnv: process.env.NODE_ENV,
    vercel: process.env.VERCEL || "not set",
  });
}
