import { db, publicPost, safeEmailKey } from "../_firebase.js";
import { scopeToPaths } from "./_stripe.js";

export default async function handler(req, res) {
  res.setHeader("access-control-allow-origin", "*");
  res.setHeader("access-control-allow-methods", "GET,OPTIONS");
  res.setHeader("access-control-allow-headers", "content-type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ ok: false, error: "Method not allowed" });

  try {
    const email = String(req.query.email || "").trim().toLowerCase();
    const scope = req.query.scope === "elChapo" ? "elChapo" : "global";

    if (!email || !email.includes("@")) {
      return res.status(400).json({ ok: false, error: "Valid email is required." });
    }

    const emailKey = safeEmailKey(email);
    const paths = scopeToPaths(scope);

    const [accessSnap, postsSnap, subSnap] = await Promise.all([
      db().ref(`${paths.access}/${emailKey}`).once("value"),
      db().ref(paths.ipas).once("value"),
      scope === "global" ? db().ref(`subscriptions/${emailKey}`).once("value") : Promise.resolve({ val: () => null })
    ]);

    const access = accessSnap.val() || {};
    const allPosts = postsSnap.val() || {};
    const sub = subSnap.val();

    const ids = new Set(Object.keys(access));

    if (scope === "global" && ["active", "trialing"].includes(sub?.status)) {
      for (const [id, post] of Object.entries(allPosts)) {
        if (post.status !== "draft" && post.priceMode === "paid" && post.includedInSubscription !== false) {
          ids.add(id);
        }
      }
    }

    const posts = [...ids]
      .map(id => publicPost(id, allPosts[id], 0))
      .filter(post => post.id && post.status !== "draft");

    return res.status(200).json({
      ok: true,
      email,
      scope,
      subscription: sub || null,
      count: posts.length,
      posts
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
}
