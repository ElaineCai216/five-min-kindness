// 五分钟善意 · AI 挑战代理（Cloudflare Worker）
// 隐藏大模型 API Key；前端只调用本 Worker。可选部署，不部署不影响网页。
//
// 环境变量（在 Cloudflare 中配置）：
//   DEEPSEEK_API_KEY 或 OPENAI_API_KEY   大模型密钥
//   BASE_URL         （可选）OpenAI 兼容接口地址，默认 https://api.deepseek.com
//   MODEL            （可选）模型名，默认 deepseek-chat
//   ALLOWED_ORIGIN   （可选）允许的前端来源，逗号分隔；留空则允许所有来源

const CAT_LABELS = { other: "对他人", world: "对环境", self: "对自己" };

const SYSTEM_PROMPT = `你是「五分钟善意」的策划人。每天为用户生成一个微小的、不需要社交压力的善意挑战。
要求：
1. 中文，一句话，35 字以内，具体可执行，五分钟内能完成；
2. 低社交压力：不需要长篇回复、不需要尴尬的对话、不做可能冒犯别人的事；
3. 方向从以下选择：「对他人」（朋友/陌生人/家人，低门槛）、「对环境」（植物/街道/小动物）、「对自己」（照顾自己）；
4. 尽量贴合给定的季节；
5. 只输出挑战内容本身，不要引号、不要编号、不要解释、不要「今天」之类的开头词。`;

function corsHeaders(env, request) {
  const origin = request.headers.get("Origin");
  const allowed = (env.ALLOWED_ORIGIN || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const allowOrigin = allowed.length === 0 ? "*" : origin && allowed.includes(origin) ? origin : "";
  const headers = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
  if (allowOrigin) headers["Access-Control-Allow-Origin"] = allowOrigin;
  return headers;
}

function json(data, status, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...extraHeaders },
  });
}

async function generateChallenge(env, date, season, category) {
  const apiKey = env.DEEPSEEK_API_KEY || env.OPENAI_API_KEY;
  if (!apiKey) return { ok: false, error: "missing-api-key" };
  const baseUrl = (env.BASE_URL || "https://api.deepseek.com").replace(/\/+$/, "");
  const model = env.MODEL || "deepseek-chat";
  const catLabel = CAT_LABELS[category] || "随机";
  const userPrompt = `日期：${date}\n季节：${season}\n方向：${catLabel}\n请生成一条合适的善意挑战。`;

  let res;
  try {
    res = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 1.0,
        max_tokens: 120,
      }),
    });
  } catch {
    return { ok: false, error: "upstream-network" };
  }
  if (!res.ok) return { ok: false, error: `upstream-${res.status}` };

  try {
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content || "";
    const text = content.replace(/^["'“”《》\s]+|["'“”《》\s]+$/g, "").trim();
    if (!text) return { ok: false, error: "empty" };
    return { ok: true, text };
  } catch {
    return { ok: false, error: "parse" };
  }
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(env, request);
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }
    if (request.method === "GET") {
      return json({ text: "五分钟善意 AI 代理：POST / 即可生成一条挑战" }, 200, cors);
    }
    if (request.method !== "POST" || url.pathname !== "/") {
      return json({ error: "not found" }, 404, cors);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "invalid json" }, 400, cors);
    }
    const date = String(body.date || "").trim().slice(0, 12);
    const season = String(body.season || "").trim().slice(0, 12);
    const category = String(body.category || "").trim().slice(0, 12);
    if (!date) return json({ error: "date required" }, 400, cors);

    const result = await generateChallenge(env, date, season, category);
    if (!result.ok) return json({ error: result.error }, 502, cors);
    return json({ text: result.text }, 200, cors);
  },
};
