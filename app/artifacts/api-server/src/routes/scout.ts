import { Router, type IRouter } from "express";
import { createClient } from "@supabase/supabase-js";
import {
  ChatWithScoutAssistantBody,
  ChatWithScoutAssistantResponse,
  CreateScoutSubmissionBody,
  CreateScoutSubmissionResponse,
  GetScoutSummaryResponse,
  ListScoutEventsResponse,
  ListScoutSubmissionsResponse,
} from "@workspace/api-zod";
import { createAdminAuth } from "../middlewares/admin-auth";

const router: IRouter = Router();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set. Add them in Replit Secrets.",
  );
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
});

const adminAuth = createAdminAuth();

const FALLBACK_EVENTS = [
  { id: "leader-cub-oath", name: "新領袖及新幼童軍宣誓", nameEn: "New Leader & Cub Scout Promise Ceremony", unit: "P1–P6", date: "2026-12-05", helpers: 6 },
  { id: "autumn-trip", name: "秋季大旅行", nameEn: "Autumn Group Trip", unit: "P1–P6", date: "2027-01", helpers: 8 },
  { id: "entertainment-badge", name: "娛樂章", nameEn: "Entertainment Badge", unit: "P1–P6", date: "2027-03", helpers: 4 },
  { id: "household-badge", name: "家務章", nameEn: "Household Badge", unit: "P1–P6", date: "2027-04", helpers: 4 },
];

router.post("/admin/login", (req, res): void => {
  adminAuth.login(req, res);
});

router.post("/admin/logout", (req, res): void => {
  adminAuth.logout(req, res);
});

router.get("/scout/events", async (_req, res): Promise<void> => {
  const { data, error } = await supabase
    .from("events")
    .select("id, name, name_en, unit, event_date, helpers")
    .order("event_date", { ascending: true });

  if (error || !data || data.length === 0) {
    res.json(ListScoutEventsResponse.parse(FALLBACK_EVENTS));
    return;
  }

  const events = data.map((row) => ({
    id: row.id,
    name: row.name,
    nameEn: row.name_en ?? row.name,
    unit: row.unit ?? "",
    date: row.event_date,
    helpers: row.helpers,
  }));
  res.json(ListScoutEventsResponse.parse(events));
});

router.get("/scout/submissions", adminAuth.requireAdmin, async (_req, res): Promise<void> => {
  const { data, error } = await supabase
    .from("submissions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = (data ?? []).map((row) => ({
    id: row.id,
    createdAt: new Date(row.created_at).toISOString(),
    fullName: row.full_name,
    gender: row.gender ?? "未提供",
    unit: row.unit,
    yearsExp: row.years_exp,
    isSenior: row.is_senior,
    targetIcCount: row.target_ic_count,
    skills: row.skills ?? [],
    preferredIcEvents: row.preferred_ic_events ?? [],
    helperEvents: row.helper_events ?? [],
    preferredPartners: row.preferred_partners ?? [],
    notes: row.notes ?? "",
  }));
  res.json(ListScoutSubmissionsResponse.parse(rows));
});

router.post("/scout/submissions", async (req, res): Promise<void> => {
  const parsed = CreateScoutSubmissionBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid scout submission");
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const d = parsed.data;
  const { data, error } = await supabase
    .from("submissions")
    .insert({
      full_name: d.fullName,
      gender: d.gender ?? "未提供",
      unit: d.unit,
      years_exp: d.yearsExp,
      is_senior: d.isSenior,
      target_ic_count: d.targetIcCount,
      skills: d.skills,
      preferred_ic_events: d.preferredIcEvents,
      helper_events: d.helperEvents,
      preferred_partners: d.preferredPartners,
      notes: d.notes ?? "",
    })
    .select("id, created_at")
    .single();

  if (error) {
    req.log.error({ error }, "Failed to create scout submission");
    res.status(500).json({ error: "Failed to save submission" });
    return;
  }

  req.log.info({ id: data.id }, "Created scout submission");
  res.status(201).json(
    CreateScoutSubmissionResponse.parse({
      id: data.id,
      createdAt: new Date(data.created_at).toISOString(),
      fullName: d.fullName,
      gender: d.gender ?? "未提供",
      unit: d.unit,
      yearsExp: d.yearsExp,
      isSenior: d.isSenior,
      targetIcCount: d.targetIcCount,
      skills: d.skills,
      preferredIcEvents: d.preferredIcEvents,
      helperEvents: d.helperEvents,
      preferredPartners: d.preferredPartners,
      notes: d.notes ?? "",
    }),
  );
});

router.get("/scout/summary", adminAuth.requireAdmin, async (_req, res): Promise<void> => {
  const { data, error } = await supabase.from("submissions").select("is_senior, skills");
  if (error) throw error;

  const rows = data ?? [];
  const skillCounts = new Map<string, number>();
  for (const row of rows) {
    for (const skill of row.skills ?? []) {
      skillCounts.set(skill, (skillCounts.get(skill) ?? 0) + 1);
    }
  }
  const topSkills = [...skillCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([skill, count]) => ({ skill, count }));

  res.json(
    GetScoutSummaryResponse.parse({
      totalSubmissions: rows.length,
      seniorCount: rows.filter((row) => row.is_senior).length,
      topSkills,
    }),
  );
});

router.post("/scout/chat", async (req, res): Promise<void> => {
  const parsed = ChatWithScoutAssistantBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    req.log.warn("DEEPSEEK_API_KEY is not set");
    res.status(503).json({ error: "Assistant unavailable" });
    return;
  }

  try {
    const response = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "user", content: parsed.data.message }],
        temperature: 0.3,
      }),
    });
    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      error?: unknown;
    };
    const reply = data.choices?.[0]?.message?.content;
    if (!response.ok || !reply) {
      req.log.warn({ status: response.status }, "DeepSeek request failed");
      res.status(503).json({ error: "Assistant unavailable" });
      return;
    }
    res.json(ChatWithScoutAssistantResponse.parse({ reply }));
  } catch (error) {
    req.log.error({ error }, "Scout assistant request failed");
    res.status(503).json({ error: "Assistant unavailable" });
  }
});

export default router;
