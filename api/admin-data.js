/**
 * /api/admin-data  — global admin dashboard data. Protected by ADMIN_KEY.
 *   GET /api/admin-data?key=ADMIN_KEY
 * Returns: { ok, stats, payments[], events[] }
 *
 * Also doubles as login check: wrong key => 401.
 */
const { kv } = require("@vercel/kv");
const ADMIN_KEY = process.env.ADMIN_KEY;

async function num(k) { const v = await kv.get(k); return Number(v || 0); }

module.exports = async (req, res) => {
  try {
    if (!ADMIN_KEY) { res.status(500).json({ ok: false, error: "ADMIN_KEY not set" }); return; }
    const key = (req.query && req.query.key) || "";
    if (key !== ADMIN_KEY) { res.status(401).json({ ok: false, error: "unauthorized" }); return; }

    // payments (latest 200)
    const payIds = (await kv.lrange("pay:index", 0, 199)) || [];
    const payments = [];
    for (const id of payIds) { const r = await kv.get("pay:" + id); if (r) payments.push(r); }

    // events (latest 300)
    const evIds = (await kv.lrange("ev:index", 0, 299)) || [];
    const events = [];
    for (const id of evIds) { const r = await kv.get("ev:" + id); if (r) events.push(r); }

    // unique users (by uid) seen across events + payments
    const uids = new Set();
    events.forEach(e => e.uid && uids.add(e.uid));
    payments.forEach(p => p.uid && uids.add(p.uid));

    const stats = {
      resumes: await num("stat:resumes"),
      downloads: await num("stat:downloads"),
      paid: await num("stat:paid"),
      revenue: await num("stat:revenue"),
      users: uids.size,
      pending: payments.filter(p => p.status === "pending").length,
    };

    res.status(200).json({ ok: true, stats, payments, events });
  } catch (e) {
    console.error("admin-data error:", e);
    res.status(500).json({ ok: false, error: e?.message || "failed" });
  }
};
