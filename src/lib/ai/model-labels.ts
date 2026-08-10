// แยกจาก lib/ai/client.ts โดยตั้งใจ — ไฟล์นี้ไม่ import env.ts (ไม่แตะ ANTHROPIC_API_KEY เลย)
// ปลอดภัยให้ client component import ตรง ๆ ได้ (lib/ai/client.ts ห้าม — ดู eslint.config.mjs)
const MODEL_LABEL_BY_ID: Record<string, string> = {
  "claude-haiku-4-5": "มาตรฐาน",
  "claude-opus-5": "เชิงลึก",
};

export function labelForModelId(modelId: string): string {
  return MODEL_LABEL_BY_ID[modelId] ?? modelId;
}
