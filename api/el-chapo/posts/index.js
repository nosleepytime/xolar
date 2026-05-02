import { db, makeId, normalizeElChapoPost, publicPost, requireApiKey } from "../../_firebase.js";

export default async function handler(req, res) {
  res.setHeader("access-control-allow-origin", "*");
  res.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");
  res.setHeader("access-control-allow-headers", "content-type,x-api-key");

  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    if (req.method === "GET") {
      const { id, search, priceMode } = req.query;

      const [snap, viewsSnap] = await Promise.all([
        db().ref("elChapo/ipas").once("value"),
        db().ref("elChapo/views").once("value")
      ]);

      const raw = snap.val() || {};
      const views = viewsSnap.val() || {};

      let posts = Object.entries(raw)
        .map(([postId, post]) => publicPost(postId, post, views[postId]?.count || 0))
        .filter(post => post.status !== "draft");

      if (id) posts = posts.filter(post => post.id === id);
      if (priceMode) posts = posts.filter(post => post.priceMode === String(priceMode).toLowerCase());

      if (search) {
        const q = String(search).toLowerCase();
        posts = posts.filter(post =>
          [post.name, post.bundleId, post.category, post.ipaVersion, post.priceMode, ...(post.tags || [])]
            .join(" ")
            .toLowerCase()
            .includes(q)
        );
      }

      posts.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      return res.status(200).json({ ok: true, count: posts.length, posts });
    }

    if (req.method === "POST") {
      if (!requireApiKey(req, res)) return;

      const post = normalizeElChapoPost(req.body || {});
      const postId = makeId(`el-chapo-${post.name}`);

      await db().ref(`elChapo/ipas/${postId}`).set(post);

      return res.status(201).json({
        ok: true,
        id: postId,
        post: publicPost(postId, post, 0)
      });
    }

    return res.status(405).json({ ok: false, error: "Method not allowed" });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
}
