import { db, makeId, normalizeAshierPost, publicAshierPost, requireApiKey } from "../../_firebase.js";

export default async function handler(req, res) {
  res.setHeader("access-control-allow-origin", "*");
  res.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");
  res.setHeader("access-control-allow-headers", "content-type,x-api-key");
  if (req.method === "OPTIONS") return res.status(200).end();
  try {
    if (req.method === "GET") {
      const { id, search, priceMode } = req.query;
      const snap = await db().ref("ashier/ipas").once("value");
      const viewsSnap = await db().ref("ashier/views").once("value");
      const raw = snap.val() || {};
      const viewsRaw = viewsSnap.val() || {};
      let posts = Object.entries(raw).map(([postId, post]) => publicAshierPost(postId, post, viewsRaw[postId]?.count || 0)).filter(post => post.status !== "draft").sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      if (id) posts = posts.filter(post => post.id === id);
      if (priceMode) posts = posts.filter(post => post.priceMode === String(priceMode).toLowerCase());
      if (search) {
        const q = String(search).toLowerCase();
        posts = posts.filter(post => [post.name, post.bundleId, post.category, post.ipaVersion, post.priceMode, ...(post.tags || [])].join(" ").toLowerCase().includes(q));
      }
      return res.status(200).json({ ok: true, count: posts.length, posts });
    }
    if (req.method === "POST") {
      if (!requireApiKey(req, res)) return;
      const post = normalizeAshierPost(req.body || {});
      const id = makeId(`ashier-${post.name}`);
      await db().ref(`ashier/ipas/${id}`).set(post);
      return res.status(201).json({ ok: true, id, post: publicAshierPost(id, post, 0) });
    }
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  } catch (error) { return res.status(500).json({ ok: false, error: error.message }); }
}
