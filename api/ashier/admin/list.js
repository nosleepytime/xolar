import { db, publicAshierPost, requireApiKey } from "../../_firebase.js";
export default async function handler(req, res) {
  if (!requireApiKey(req, res)) return;
  try {
    const snap = await db().ref("ashier/ipas").once("value");
    const viewsSnap = await db().ref("ashier/views").once("value");
    const raw = snap.val() || {};
    const viewsRaw = viewsSnap.val() || {};
    const posts = Object.entries(raw).map(([id, post]) => publicAshierPost(id, post, viewsRaw[id]?.count || 0)).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    return res.status(200).json({ ok: true, count: posts.length, posts });
  } catch (error) { return res.status(500).json({ ok: false, error: error.message }); }
}
