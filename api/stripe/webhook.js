import { db, safeEmailKey } from "../_firebase.js";
import { stripeClient, scopeToPaths } from "./_stripe.js";

export const config = {
  api: {
    bodyParser: false
  }
};

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

async function saveCustomer(email, customerId) {
  if (!email || !customerId) return;

  await db().ref(`stripeCustomers/${safeEmailKey(email)}`).update({
    email: String(email).toLowerCase(),
    customerId,
    updatedAt: new Date().toISOString()
  });
}

async function handleCheckoutCompleted(session) {
  const customerEmail = (
    session.customer_details?.email ||
    session.customer_email ||
    session.metadata?.customerEmail ||
    ""
  ).toLowerCase();

  const scope = session.metadata?.scope === "elChapo" ? "elChapo" : "global";
  const checkoutType = session.metadata?.checkoutType || "one_time";

  if (customerEmail && session.customer) await saveCustomer(customerEmail, session.customer);
  if (!customerEmail) return;

  const emailKey = safeEmailKey(customerEmail);

  if (checkoutType === "subscription") {
    await db().ref(`subscriptions/${emailKey}`).set({
      email: customerEmail,
      scope: "global",
      plan: session.metadata?.plan || "unknown",
      subscriptionId: session.subscription || "",
      customerId: session.customer || "",
      status: "active",
      stripeSessionId: session.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return;
  }

  const postIds = String(session.metadata?.postIds || "")
    .split(",")
    .map(id => id.trim())
    .filter(Boolean);

  if (!postIds.length) return;

  const paths = scopeToPaths(scope);

  await db().ref(`${paths.purchases}/${emailKey}/${session.id}`).set({
    customerEmail,
    stripeSessionId: session.id,
    paymentStatus: session.payment_status,
    amountTotal: session.amount_total,
    currency: session.currency,
    postIds,
    createdAt: new Date().toISOString()
  });

  for (const postId of postIds) {
    await db().ref(`${paths.access}/${emailKey}/${postId}`).set({
      postId,
      customerEmail,
      stripeSessionId: session.id,
      unlockedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
}

async function handleSubscriptionChange(subscription) {
  const email = String(subscription.metadata?.customerEmail || "").toLowerCase();
  if (!email) return;

  await db().ref(`subscriptions/${safeEmailKey(email)}`).update({
    email,
    scope: "global",
    plan: subscription.metadata?.plan || "unknown",
    subscriptionId: subscription.id,
    customerId: subscription.customer || "",
    status: subscription.status || "unknown",
    currentPeriodEnd: subscription.current_period_end || null,
    cancelAtPeriodEnd: Boolean(subscription.cancel_at_period_end),
    updatedAt: new Date().toISOString()
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  const stripe = stripeClient();
  const signature = req.headers["stripe-signature"];
  let event;

  try {
    const rawBody = await readRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    return res.status(400).json({ ok: false, error: `Webhook signature verification failed: ${error.message}` });
  }

  try {
    if (event.type === "checkout.session.completed") {
      await handleCheckoutCompleted(event.data.object);
    }

    if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      await handleSubscriptionChange(event.data.object);
    }

    return res.status(200).json({ ok: true, received: true });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
}
