import { db, makeId, normalizePost, publicPost, requireApiKey } from "../_firebase.js";

export default async function handler(req, res) {
  res.setHeader("access-control-allow-origin", "*");
  res.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");
  res.setHeader("access-control-allow-headers", "content-type,x-api-key");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    if (req.method === "GET") {
      const { id, type, search, updated, priceMode } = req.query;
      const snap = await db().ref("ipas").once("value");
      const viewsSnap = await db().ref("views").once("value");
      const raw = snap.val() || {};
      const viewsRaw = viewsSnap.val() || {};

      let posts = Object.entries(raw)
        .map(([postId, post]) => publicPost(postId, post, viewsRaw[postId]?.count || 0))
        .filter(post => post.status !== "draft");

      if (id) posts = posts.filter(post => post.id === id);
      if (type) posts = posts.filter(post => post.type === String(type).toLowerCase());
      if (priceMode) posts = posts.filter(post => post.priceMode === String(priceMode).toLowerCase());
      if (updated === "true") posts = posts.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      else posts = posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      if (search) {
        const q = String(search).toLowerCase();
        posts = posts.filter(post =>
          [
            post.name,
            post.bundleId,
            post.category,
            post.ipaVersion,
            ...(post.tags || [])
          ].join(" ").toLowerCase().includes(q)
        );
      }

      return res.status(200).json({ ok: true, count: posts.length, posts });
    }

    if (req.method === "POST") {
      if (!requireApiKey(req, res)) return;
      const post = normalizePost(req.body || {});
      const id = makeId(post.name);
      await db().ref(`ipas/${id}`).set(post);
      return res.status(201).json({ ok: true, id, post: publicPost(id, post, 0) });
    }

    return res.status(405).json({ ok: false, error: "Method not allowed" });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
}
