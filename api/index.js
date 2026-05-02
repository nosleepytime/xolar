export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    name: "xolar API",
    message: "API root is working. Use the endpoints below.",
    endpoints: {
      globalPosts: "/api/posts",
      globalPaidPosts: "/api/posts?priceMode=paid",
      elChapoPosts: "/api/el-chapo/posts",
      appleLookup: "/api/apple?bundleId=com.spotify.client",
      stripeCheckout: "/api/stripe/checkout",
      stripePurchases: "/api/stripe/purchases?scope=global&email=you@example.com",
      stripePortal: "/api/stripe/portal",
      stripeWebhook: "/api/stripe/webhook"
    }
  });
}
