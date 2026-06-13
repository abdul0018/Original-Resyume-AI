/**
 * /api/pay-admin  — admin approve/reject, protected by ADMIN_KEY.
 *   POST { key, id, action }   action: "approve" | "reject"
 * On approve, increments the paid-downloads + revenue counters.
 */
const { kv } = require("@vercel/kv");
const ADMIN_KEY = process.env.ADMIN_KEY;

module.exports = async (req, res) => {
  try {
    if (!ADMIN_KEY) { res.status(500).json({ ok: false, error: "ADMIN_KEY not set" }); return; }
    if (req.method !== "POST") { res.status(405).json({ ok: false, error: "POST only" }); return; }
    const { key, id, action } = req.body || {};
    if (key !== ADMIN_KEY) { res.status(401).json({ ok: false, error: "unauthorized" }); return; }
    if (!id || !["approve", "reject"].includes(action)) {
      res.status(400).json({ ok: false, error: "bad request" }); return;
    }
    const rec = await kv.get("pay:" + id);
    if (!rec) { res.status(404).json({ ok: false, error: "not found" }); return; }
    const was = rec.status;
    rec.status = action === "approve" ? "approved" : "rejected";
    rec.decidedAt = Date.now();
    await kv.set("pay:" + id, rec, { ex: 60 * 60 * 24 * 30 });
    // count revenue only on first approval
    if (action === "approve" && was !== "approved") {
      await kv.incr("stat:paid");
      await kv.incrby("stat:revenue", parseInt(rec.amount || "4000", 10) || 4000);
    }
    res.status(200).json({ ok: true, status: rec.status });
  } catch (e) {
    console.error("pay-admin error:", e);
    res.status(500).json({ ok: false, error: e?.message || "admin failed" });
  }
};
