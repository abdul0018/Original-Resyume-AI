/**
 * /api/log-event  — records user activity so the admin dashboard can show it.
 * Body: { type: "resume_created" | "download_requested", name, role, lang, template, uid }
 *
 * Storage: Vercel KV. Keeps a capped list of recent events + counters.
 */
const { kv } = require("@vercel/kv");

function eid() {
  return "e_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

module.exports = async (req, res) => {
  if (req.method !== "POST") { res.status(405).json({ ok: false }); return; }
  try {
    const { type, name, role, lang, template, uid } = req.body || {};
    if (!["resume_created", "download_requested"].includes(type)) {
      res.status(400).json({ ok: false, error: "bad type" }); return;
    }
    const id = eid();
    const rec = {
      id, type,
      name: String(name || "").slice(0, 120),
      role: String(role || "").slice(0, 120),
      lang: String(lang || "").slice(0, 8),
      template: String(template || "").slice(0, 24),
      uid: String(uid || "").slice(0, 40),
      at: Date.now(),
    };
    await kv.set("ev:" + id, rec, { ex: 60 * 60 * 24 * 30 }); // 30 days
    await kv.lpush("ev:index", id);
    await kv.ltrim("ev:index", 0, 999); // keep last 1000 events
    // lightweight counters
    if (type === "resume_created") await kv.incr("stat:resumes");
    if (type === "download_requested") await kv.incr("stat:downloads");
    res.status(200).json({ ok: true, id });
  } catch (e) {
    console.error("log-event error:", e);
    res.status(200).json({ ok: false }); // non-blocking for the user
  }
};
