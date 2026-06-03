/**
 * /api/pay-status?id=...  — the Mini App polls this until approved/rejected.
 * Returns: { status: "pending" | "approved" | "rejected" | "unknown" }
 */
const { kv } = require("@vercel/kv");

module.exports = async (req, res) => {
  try {
    const id = (req.query && req.query.id) || "";
    if (!id) { res.status(400).json({ status: "unknown", error: "missing id" }); return; }
    const rec = await kv.get("pay:" + id);
    if (!rec) { res.status(200).json({ status: "unknown" }); return; }
    res.status(200).json({ status: rec.status || "pending" });
  } catch (e) {
    console.error("pay-status error:", e);
    res.status(500).json({ status: "unknown", error: e?.message });
  }
};
