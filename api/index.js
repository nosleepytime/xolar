import { createReportRequest, directDownload, send, setCors } from "../lib/server.js";

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();

  const action = String(req.query.action || "").trim().toLowerCase();

  if (action === "download") return directDownload(req, res);
  if (action === "report-request") return createReportRequest(req, res);

  if (req.method !== "GET") {
    res.setHeader("allow", "GET, OPTIONS");
    return send(res, 405, { ok: false, error: "Method not allowed" });
  }

  return send(res, 200, {
    ok: true,
    name: "xolar API",
    message: "API root is working.",
    endpoints: {
      globalPosts: "/api/posts",
      globalPaidPosts: "/api/posts?priceMode=paid",
      elChapoPosts: "/api/el-chapo/posts",
      appleLookup: "/api/apple?bundleId=com.spotify.client",
      adminList: "/api/admin/list?scope=global",
      elChapoAdminList: "/api/admin/list?scope=elChapo",
      stripeCheckout: "/api/stripe/checkout",
      stripePurchases: "/api/stripe/purchases?scope=global&email=you@example.com",
      stripePortal: "/api/stripe/portal",
      stripeWebhook: "/api/stripe/webhook",
      dropboxDownload: "/api?action=download&url=https%3A%2F%2Fwww.dropbox.com%2Fs%2F...",
      reportRequest: "/api?action=report-request"
    }
  });
}
