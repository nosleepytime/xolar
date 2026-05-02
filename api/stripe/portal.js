import { stripeClient, required, getOrCreateStripeCustomer } from "./_stripe.js";

export default async function handler(req, res) {
  res.setHeader("access-control-allow-origin", "*");
  res.setHeader("access-control-allow-methods", "POST,OPTIONS");
  res.setHeader("access-control-allow-headers", "content-type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  try {
    const stripe = stripeClient();
    const { customerEmail, returnPath = "/payments" } = req.body || {};

    if (!customerEmail || !String(customerEmail).includes("@")) {
      return res.status(400).json({ ok: false, error: "Valid customerEmail is required." });
    }

    const customerId = await getOrCreateStripeCustomer(stripe, customerEmail);
    const siteUrl = required("PUBLIC_SITE_URL");

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${siteUrl}${returnPath}`
    });

    return res.status(200).json({ ok: true, url: session.url });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
}
