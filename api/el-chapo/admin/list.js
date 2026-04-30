import { db, publicPost, requireApiKey } from "../../_firebase.js";

export default async function handler(req, res) {
  if (!requireApiKey(req, res)) return;

  try {
    const [snap, viewsSnap] = await Promise.all([
      db().ref("elChapo/ipas").once("value"),
      db().ref("elChapo/views").once("value")
    ]);

    const raw = snap.val() || {};
    const views = viewsSnap.val() || {};

    const posts = Object.entries(raw)
      .map(([id, post]) => publicPost(id, post, views[id]?.count || 0))
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    return res.status(200).json({ ok: true, count: posts.length, posts });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
}
