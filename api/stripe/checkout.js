import { db } from "../_firebase.js";
import { stripeClient, required, getOrCreateStripeCustomer, scopeToPaths } from "./_stripe.js";

export default async function handler(req, res) {
  res.setHeader("access-control-allow-origin", "*");
  res.setHeader("access-control-allow-methods", "POST,OPTIONS");
  res.setHeader("access-control-allow-headers", "content-type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  try {
    const stripe = stripeClient();
    const siteUrl = required("PUBLIC_SITE_URL");
    const { scope = "global", postIds = [], customerEmail, plan } = req.body || {};

    if (!customerEmail || !String(customerEmail).includes("@")) {
      return res.status(400).json({ ok: false, error: "Valid customerEmail is required." });
    }

    const normalizedScope = scope === "elChapo" ? "elChapo" : "global";
    const customerId = await getOrCreateStripeCustomer(stripe, customerEmail);

    if (plan) {
      if (normalizedScope !== "global") {
        return res.status(400).json({ ok: false, error: "Subscriptions are only enabled for the global xolar site." });
      }

      const planKey = String(plan).toLowerCase();
      const priceId = planKey === "yearly"
        ? process.env.STRIPE_GLOBAL_SUB_YEARLY_PRICE_ID
        : process.env.STRIPE_GLOBAL_SUB_MONTHLY_PRICE_ID;

      if (!priceId) {
        return res.status(400).json({ ok: false, error: `Missing Stripe subscription price id for ${planKey}.` });
      }

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${siteUrl}/purchases?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl}/subscriptions?canceled=true`,
        metadata: {
          scope: "global",
          checkoutType: "subscription",
          plan: planKey,
          customerEmail: String(customerEmail).toLowerCase()
        },
        subscription_data: {
          metadata: {
            scope: "global",
            plan: planKey,
            customerEmail: String(customerEmail).toLowerCase()
          }
        }
      });

      return res.status(200).json({ ok: true, url: session.url });
    }

    if (!Array.isArray(postIds) || postIds.length === 0) {
      return res.status(400).json({ ok: false, error: "postIds must be a non-empty array." });
    }

    const paths = scopeToPaths(normalizedScope);
    const postsSnap = await db().ref(paths.ipas).once("value");
    const allPosts = postsSnap.val() || {};

    const selectedPosts = postIds
      .map(id => ({ id, ...allPosts[id] }))
      .filter(post => post.id && post.status !== "draft" && post.priceMode === "paid");

    if (!selectedPosts.length) {
      return res.status(400).json({ ok: false, error: "No paid published IPAs found for checkout." });
    }

    const missingPrice = selectedPosts.find(post => !post.stripePriceId);
    if (missingPrice) {
      return res.status(400).json({ ok: false, error: `Missing stripePriceId for ${missingPrice.name}.` });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: customerId,
      line_items: selectedPosts.map(post => ({ price: post.stripePriceId, quantity: 1 })),
      success_url: `${siteUrl}${normalizedScope === "elChapo" ? "/el-chapo" : ""}/purchases?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}${normalizedScope === "elChapo" ? "/el-chapo" : ""}/cart?canceled=true`,
      metadata: {
        scope: normalizedScope,
        checkoutType: "one_time",
        customerEmail: String(customerEmail).toLowerCase(),
        postIds: selectedPosts.map(post => post.id).join(",")
      }
    });

    return res.status(200).json({ ok: true, url: session.url });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
}
