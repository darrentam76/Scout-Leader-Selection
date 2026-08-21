import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
};

const systemPrompt = `你是小三童軍的「領袖資料收集與資安說明助手」。請使用繁體中文，以專業、安心、透明和支持的語氣回答。

你只可回答以下範圍：
- 系統用途、25 項年度活動的 IC 分工流程與工作量安排
- 領袖基本資料、20 項專長分類、活動意願和合作夥伴填報
- 資料私隱、安全、加密、保存與更正安排

資料原則：
- 只收集活動配對所需的姓名、性別、單位、資歷、專長和活動意願。
- 資料只用於年度活動分工和工作量平衡。
- 資料最長保存 6 個月；系統應在 180 天後刪除提交資料。
- 領袖可向領隊團隊申請檢視或更正資料。
- 傳輸採用 HTTPS；資料庫應啟用 RLS，讓一般領袖只可看見自己的資料；管理員存取需有 MFA 和稽核紀錄。
- 不要要求或保存身分證號、住址、付款資料等非必要敏感資料。

如問題超出上述範圍，請只回答：
「我是小三童軍領袖資料收集與資安說明助手。我只能協助解答關於本系統用途、領袖意願填報及資料隱私安全相關的問題。」`;

serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const { messages } = await request.json();
    const apiKey = Deno.env.get("DEEPSEEK_API_KEY");
    if (!apiKey) throw new Error("DEEPSEEK_API_KEY is not configured");
    const safeMessages = Array.isArray(messages) ? messages.slice(-8) : [];
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: "deepseek-chat", messages: [{ role: "system", content: systemPrompt }, ...safeMessages], temperature: 0.3 }),
    });
    const data = await response.json();
    return new Response(JSON.stringify(data), { status: response.ok ? 200 : response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Assistant request failed";
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});