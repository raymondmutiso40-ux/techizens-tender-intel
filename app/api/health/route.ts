export async function GET() {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  return Response.json({
    build: "2026-11-13-health",
    storage: url && token ? "redis" : "local-file (will fail on Vercel)",
    gemini_key_set: !!process.env.GEMINI_API_KEY,
    demo_password_set: !!process.env.DEMO_PASSWORD,
  });
}