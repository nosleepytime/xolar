import { db } from "../_firebase.js";

export default async function handler(req, res) {
  res.setHeader("access-control-allow-origin", "*");
  res.setHeader("access-control-allow-methods", "POST,OPTIONS");
  res.setHeader("access-control-allow-headers", "content-type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ ok: false, error: "Missing post id" });

    const ref = db().ref(`views/${id}`);
    await ref.transaction(current => {
      const data = current || {};
      data.count = Number(data.count || 0) + 1;
      data.updatedAt = new Date().toISOString();
      return data;
    });

    const snap = await ref.once("value");
    return res.status(200).json({ ok: true, views: snap.val()?.count || 0 });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
}
