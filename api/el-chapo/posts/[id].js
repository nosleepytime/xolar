import { db, normalizePost, publicPost, requireApiKey } from "../_firebase.js";

export default async function handler(req, res) {
  res.setHeader("access-control-allow-origin", "*");
  res.setHeader("access-control-allow-methods", "GET,PUT,DELETE,OPTIONS");
  res.setHeader("access-control-allow-headers", "content-type,x-api-key");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const { id } = req.query;
    if (!id) return res.status(400).json({ ok: false, error: "Missing post id" });

    const ref = db().ref(`ipas/${id}`);

    if (req.method === "GET") {
      const snap = await ref.once("value");
      if (!snap.exists()) return res.status(404).json({ ok: false, error: "Post not found" });
      const viewsSnap = await db().ref(`views/${id}/count`).once("value");
      return res.status(200).json({ ok: true, post: publicPost(id, snap.val(), viewsSnap.val() || 0) });
    }

    if (req.method === "PUT") {
      if (!requireApiKey(req, res)) return;
      const snap = await ref.once("value");
      if (!snap.exists()) return res.status(404).json({ ok: false, error: "Post not found" });

      const post = normalizePost(
        { ...(req.body || {}), updatedAt: new Date().toISOString() },
        snap.val()
      );

      await ref.set(post);
      const viewsSnap = await db().ref(`views/${id}/count`).once("value");
      return res.status(200).json({ ok: true, id, post: publicPost(id, post, viewsSnap.val() || 0) });
    }

    if (req.method === "DELETE") {
      if (!requireApiKey(req, res)) return;
      await ref.remove();
      await db().ref(`views/${id}`).remove();
      return res.status(200).json({ ok: true, deleted: id });
    }

    return res.status(405).json({ ok: false, error: "Method not allowed" });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
}
