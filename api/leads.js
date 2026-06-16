// Vercel Serverless Function
// Salva os leads no Supabase via REST API.
// Variáveis necessárias no Vercel:
// SUPABASE_URL=https://xxxx.supabase.co
// SUPABASE_SERVICE_ROLE_KEY=xxxx

function classifyLead(data) {
  const quantity = Number(data.estimated_quantity || 0);
  const custom = data.needs_custom === "sim" || data.needs_custom === "talvez";
  const urgent = data.desired_deadline === "urgente" || data.desired_deadline === "15";
  const strategicSegments = ["Açaí", "Sorvete", "Cafeteria", "Delivery", "Indústria"];
  const strategic = strategicSegments.includes(data.segment);
  let score = 0;

  if (quantity >= 10000) score += 50;
  else if (quantity >= 5000) score += 38;
  else if (quantity >= 2000) score += 26;
  else if (quantity >= 1000) score += 16;
  else if (quantity >= 500) score += 8;

  if (custom) score += 26;
  if (urgent) score += 20;
  if (strategic) score += 8;
  if (data.notes && data.notes.trim().length > 18) score += 5;

  if ((quantity >= 5000 && custom) || (quantity >= 2000 && custom && urgent) || score >= 62) {
    return { temperature: "hot", label: "Lead quente", score, route: "premium" };
  }
  if (quantity >= 1000 || custom || score >= 28) {
    return { temperature: "medium", label: "Lead médio", score, route: "whatsapp_nurture" };
  }
  return { temperature: "weak", label: "Lead fraco", score, route: "content_automation" };
}

function cleanText(value, max = 500) {
  return String(value || "").trim().slice(0, max);
}

function sanitizeLead(body) {
  const classification = classifyLead(body || {});
  return {
    lead_id: cleanText(body.lead_id, 40),
    name: cleanText(body.name, 120),
    whatsapp: cleanText(body.whatsapp, 30),
    whatsapp_e164: cleanText(body.whatsapp_e164, 30),
    city: cleanText(body.city, 100),
    state: cleanText(body.state, 2).toUpperCase(),
    segment: cleanText(body.segment, 80),
    packaging_type: cleanText(body.packaging_type, 80),
    estimated_quantity: Number(body.estimated_quantity || 0),
    needs_custom: cleanText(body.needs_custom, 20),
    desired_deadline: cleanText(body.desired_deadline, 30),
    notes: cleanText(body.notes, 1200),
    source: cleanText(body.source || "home_dia_2", 80),
    page: cleanText(body.page, 200),
    utm_source: cleanText(body.utm_source, 120),
    utm_medium: cleanText(body.utm_medium, 120),
    utm_campaign: cleanText(body.utm_campaign, 120),
    lead_score: classification.score,
    lead_temperature: classification.temperature,
    lead_label: classification.label,
    routing_recommendation: classification.route,
    raw_payload: body || {}
  };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: "Supabase não configurado. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY." });
  }

  try {
    const lead = sanitizeLead(req.body || {});
    if (!lead.name || !lead.whatsapp_e164 || !lead.city || !lead.state || !lead.segment || !lead.packaging_type || !lead.estimated_quantity) {
      return res.status(400).json({ error: "Campos obrigatórios ausentes." });
    }

    const response = await fetch(`${SUPABASE_URL}/rest/v1/packaging_leads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Prefer": "return=representation"
      },
      body: JSON.stringify(lead)
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      return res.status(response.status).json({ error: "Erro ao salvar no Supabase", details: data });
    }

    return res.status(201).json({ ok: true, lead: data?.[0] || lead });
  } catch (error) {
    return res.status(500).json({ error: "Erro interno", message: error.message });
  }
}
