export default function handler(req, res) {
  res.status(200).json({
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
      stripeWebhook: "/api/stripe/webhook"
    }
  });
}
