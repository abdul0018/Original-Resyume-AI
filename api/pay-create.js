/**
 * /api/pay-create  — user submits that they paid; stores a PENDING request
 * along with resume/user info for the admin dashboard.
 * Body: { ref, amount, name, role, lang, template, uid }
 * Returns: { ok, id }
 */
const { kv } = require("@vercel/kv");

function rid() {
  return "p_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

module.exports = async (req, res) => {
  if (req.method !== "POST") { res.status(405).json({ ok: false, error: "POST only" }); return; }
  try {
    const { ref, amount, name, role, lang, template, uid } = req.body || {};
    if (!ref) { res.status(400).json({ ok: false, error: "missing ref" }); return; }

    const id = rid();
    const record = {
      id,
      ref: String(ref).slice(0, 120),
      amount: String(amount || "4000"),
      name: String(name || "").slice(0, 120),
      role: String(role || "").slice(0, 120),
      lang: String(lang || "").slice(0, 8),
      template: String(template || "").slice(0, 24),
      uid: String(uid || "").slice(0, 40),
      status: "pending",
      createdAt: Date.now(),
    };
    await kv.set("pay:" + id, record, { ex: 60 * 60 * 24 * 30 }); // 30 days
    await kv.lpush("pay:index", id);
    await kv.ltrim("pay:index", 0, 999);

    res.status(200).json({ ok: true, id });
  } catch (e) {
    console.error("pay-create error:", e);
    res.status(500).json({ ok: false, error: e?.message || "create failed" });
  }
};
