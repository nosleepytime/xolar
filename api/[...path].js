
import admin from "firebase-admin";
import Stripe from "stripe";

export const config = {
  api: {
    bodyParser: false
  }
};

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

function getAdminApp() {
  if (admin.apps.length) return admin.apps[0];

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: required("FIREBASE_PROJECT_ID"),
      clientEmail: required("FIREBASE_CLIENT_EMAIL"),
      privateKey: required("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n")
    }),
    databaseURL: required("FIREBASE_DATABASE_URL")
  });
}

function db() {
  getAdminApp();
  return admin.database();
}

function stripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("Missing STRIPE_SECRET_KEY");
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

function nowIso() {
  return new Date().toISOString();
}

function safeEmailKey(email) {
  return String(email || "").trim().toLowerCase().replace(/[.#$/[\]]/g, "_");
}

function makeId(name = "ipa") {
  const clean = String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 46) || "ipa";
  return `${clean}-${Date.now().toString(36)}`;
}

function publicPost(id, post, views = 0) {
  return { id, ...post, views: Number(views || 0) };
}

function send(res, status, data) {
  res.status(status).json(data);
}

function setCors(res) {
  res.setHeader("access-control-allow-origin", "*");
  res.setHeader("access-control-allow-methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("access-control-allow-headers", "content-type,x-api-key,stripe-signature");
}

function requireApiKey(req, res) {
  const key = req.headers["x-api-key"] || req.query.key;
  if (!process.env.XOLAR_ADMIN_API_KEY || key !== process.env.XOLAR_ADMIN_API_KEY) {
    send(res, 401, { ok: false, error: "Unauthorized. Missing or invalid x-api-key." });
    return false;
  }
  return true;
}

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

async function readJson(req) {
  const raw = await readRawBody(req);
  if (!raw.length) return {};
  try {
    return JSON.parse(raw.toString("utf8"));
  } catch {
    return {};
  }
}

function getPathParts(req) {
  // Vercel can expose the catch-all param as "...path" for a file named "[...path].js".
  // Some environments expose it as "path". We support both.
  const p =
    req.query.path ||
    req.query["...path"] ||
    req.query["[...path]"];

  if (Array.isArray(p)) return p.flatMap(part => String(part).split("/")).filter(Boolean);
  if (typeof p === "string") return p.split("/").filter(Boolean);

  const urlPath = String(req.url || "")
    .split("?")[0]
    .replace(/^\/api\/?/, "");

  return urlPath.split("/").filter(Boolean);
}

function scopeToPaths(scope) {
  if (scope === "elChapo") {
    return {
      ipas: "elChapo/ipas",
      views: "elChapo/views",
      purchases: "elChapo/purchases",
      access: "elChapo/purchaseAccess"
    };
  }

  return {
    ipas: "ipas",
    views: "views",
    purchases: "purchases",
    access: "purchaseAccess"
  };
}

function normalizeGlobalPost(input = {}, existing = {}) {
  const merged = { ...existing, ...input };
  const name = String(merged.name || existing.name || "Untitled IPA").trim();
  const type = String(merged.type || existing.type || "app").toLowerCase();
  const priceMode = String(merged.priceMode || existing.priceMode || "free").toLowerCase();

  if (!["app", "game"].includes(type)) throw new Error("type must be app or game");
  if (!["free", "paid"].includes(priceMode)) throw new Error("priceMode must be free or paid");

  return {
    name,
    nameLower: name.toLowerCase(),
    type,
    bundleId: String(merged.bundleId || "").trim(),
    ipaVersion: String(merged.ipaVersion || "").trim(),
    appStoreVersion: String(merged.appStoreVersion || "").trim(),
    size: String(merged.size || "").trim(),
    downloadUrl: String(merged.downloadUrl || "").trim(),
    iconUrl: String(merged.iconUrl || "").trim(),
    screenshots: Array.isArray(merged.screenshots) ? merged.screenshots.filter(Boolean) : [],
    supportedDevices: Array.isArray(merged.supportedDevices) ? merged.supportedDevices.filter(Boolean) : [],
    category: String(merged.category || "").trim(),
    modFeatures: String(merged.modFeatures || "").trim(),
    tags: Array.isArray(merged.tags) ? merged.tags.filter(Boolean) : [],
    priceMode,
    price: Number(merged.price || 0),
    currency: String(merged.currency || "USD").toUpperCase(),
    stripePriceId: String(merged.stripePriceId || "").trim(),
    includedInSubscription: merged.includedInSubscription !== false,
    status: String(merged.status || "published").trim(),
    updatedAt: merged.updatedAt || nowIso(),
    createdAt: merged.createdAt || existing.createdAt || nowIso()
  };
}

function normalizeElChapoPost(input = {}, existing = {}) {
  const merged = { ...existing, ...input };
  const name = String(merged.name || existing.name || "Untitled IPA").trim();
  const priceMode = String(merged.priceMode || existing.priceMode || "free").toLowerCase();

  if (!["free", "paid"].includes(priceMode)) throw new Error("priceMode must be free or paid");

  return {
    name,
    nameLower: name.toLowerCase(),
    bundleId: String(merged.bundleId || "").trim(),
    ipaVersion: String(merged.ipaVersion || "").trim(),
    appStoreVersion: String(merged.appStoreVersion || "").trim(),
    size: String(merged.size || "").trim(),
    downloadUrl: String(merged.downloadUrl || "").trim(),
    iconUrl: String(merged.iconUrl || "").trim(),
    screenshots: Array.isArray(merged.screenshots) ? merged.screenshots.filter(Boolean) : [],
    supportedDevices: Array.isArray(merged.supportedDevices) ? merged.supportedDevices.filter(Boolean) : [],
    category: String(merged.category || "").trim(),
    modFeatures: String(merged.modFeatures || "").trim(),
    tags: Array.isArray(merged.tags) ? merged.tags.filter(Boolean) : [],
    priceMode,
    price: Number(merged.price || 0),
    currency: String(merged.currency || "USD").toUpperCase(),
    stripePriceId: String(merged.stripePriceId || "").trim(),
    status: String(merged.status || "published").trim(),
    updatedAt: merged.updatedAt || nowIso(),
    createdAt: merged.createdAt || existing.createdAt || nowIso()
  };
}

async function listPosts(req, res, scope) {
  const paths = scopeToPaths(scope);
  const { id, type, search, priceMode } = req.query;
  const [snap, viewsSnap] = await Promise.all([
    db().ref(paths.ipas).once("value"),
    db().ref(paths.views).once("value")
  ]);

  const raw = snap.val() || {};
  const views = viewsSnap.val() || {};

  let posts = Object.entries(raw)
    .map(([postId, post]) => publicPost(postId, post, views[postId]?.count || 0))
    .filter(post => post.status !== "draft");

  if (id) posts = posts.filter(post => post.id === id);
  if (type && scope === "global") posts = posts.filter(post => post.type === String(type).toLowerCase());
  if (priceMode) posts = posts.filter(post => post.priceMode === String(priceMode).toLowerCase());

  if (search) {
    const q = String(search).toLowerCase();
    posts = posts.filter(post => [
      post.name,
      post.bundleId,
      post.category,
      post.ipaVersion,
      post.type,
      post.priceMode,
      ...(post.tags || [])
    ].join(" ").toLowerCase().includes(q));
  }

  posts.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  return send(res, 200, { ok: true, count: posts.length, posts });
}

async function createPost(req, res, scope) {
  if (!requireApiKey(req, res)) return;

  const body = await readJson(req);
  const post = scope === "elChapo" ? normalizeElChapoPost(body) : normalizeGlobalPost(body);
  const id = scope === "elChapo" ? makeId(`el-chapo-${post.name}`) : makeId(post.name);
  const paths = scopeToPaths(scope);

  await db().ref(`${paths.ipas}/${id}`).set(post);
  return send(res, 201, { ok: true, id, post: publicPost(id, post, 0) });
}

async function readPost(req, res, scope, id) {
  const paths = scopeToPaths(scope);
  const snap = await db().ref(`${paths.ipas}/${id}`).once("value");

  if (!snap.exists()) return send(res, 404, { ok: false, error: "Post not found" });

  const viewsSnap = await db().ref(`${paths.views}/${id}/count`).once("value");
  return send(res, 200, { ok: true, post: publicPost(id, snap.val(), viewsSnap.val() || 0) });
}

async function updatePost(req, res, scope, id) {
  if (!requireApiKey(req, res)) return;

  const paths = scopeToPaths(scope);
  const body = await readJson(req);
  const ref = db().ref(`${paths.ipas}/${id}`);
  const snap = await ref.once("value");

  if (!snap.exists()) return send(res, 404, { ok: false, error: "Post not found" });

  const post = scope === "elChapo"
    ? normalizeElChapoPost({ ...body, updatedAt: nowIso() }, snap.val())
    : normalizeGlobalPost({ ...body, updatedAt: nowIso() }, snap.val());

  await ref.set(post);
  const viewsSnap = await db().ref(`${paths.views}/${id}/count`).once("value");

  return send(res, 200, { ok: true, id, post: publicPost(id, post, viewsSnap.val() || 0) });
}

async function deletePost(req, res, scope, id) {
  if (!requireApiKey(req, res)) return;

  const paths = scopeToPaths(scope);
  await db().ref(`${paths.ipas}/${id}`).remove();
  await db().ref(`${paths.views}/${id}`).remove();

  return send(res, 200, { ok: true, deleted: id });
}

async function incrementView(req, res, scope, id) {
  const paths = scopeToPaths(scope);
  const ref = db().ref(`${paths.views}/${id}`);

  await ref.transaction(current => ({
    count: Number(current?.count || 0) + 1,
    updatedAt: nowIso()
  }));

  const snap = await ref.once("value");
  return send(res, 200, { ok: true, views: snap.val()?.count || 0 });
}

async function adminList(req, res, scope) {
  if (!requireApiKey(req, res)) return;

  const paths = scopeToPaths(scope);
  const [snap, viewsSnap] = await Promise.all([
    db().ref(paths.ipas).once("value"),
    db().ref(paths.views).once("value")
  ]);

  const raw = snap.val() || {};
  const views = viewsSnap.val() || {};

  const posts = Object.entries(raw)
    .map(([id, post]) => publicPost(id, post, views[id]?.count || 0))
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  return send(res, 200, { ok: true, count: posts.length, posts });
}

async function appleLookup(req, res) {
  const bundleId = String(req.query.bundleId || "").trim();
  if (!bundleId) return send(res, 400, { ok: false, error: "Missing bundleId" });

  const appleRes = await fetch(`https://itunes.apple.com/lookup?bundleId=${encodeURIComponent(bundleId)}`);
  const data = await appleRes.json();
  const item = data.results?.[0] || null;

  return send(res, 200, {
    ok: true,
    found: Boolean(item),
    apple: item ? {
      trackName: item.trackName || "",
      version: item.version || "",
      bundleId: item.bundleId || "",
      primaryGenreName: item.primaryGenreName || "",
      averageUserRating: item.averageUserRating ?? 0,
      userRatingCount: item.userRatingCount ?? 0,
      artworkUrl512: item.artworkUrl512 || "",
      screenshotUrls: item.screenshotUrls || [],
      ipadScreenshotUrls: item.ipadScreenshotUrls || [],
      supportedDevices: item.supportedDevices || [],
      trackViewUrl: item.trackViewUrl || ""
    } : null
  });
}

async function getOrCreateStripeCustomer(stripe, email) {
  const cleanEmail = String(email || "").trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes("@")) throw new Error("Valid customer email is required.");

  const emailKey = safeEmailKey(cleanEmail);
  const ref = db().ref(`stripeCustomers/${emailKey}`);
  const snap = await ref.once("value");
  const existing = snap.val();

  if (existing?.customerId) return existing.customerId;

  const customer = await stripe.customers.create({
    email: cleanEmail,
    metadata: { emailKey }
  });

  await ref.set({
    email: cleanEmail,
    customerId: customer.id,
    createdAt: nowIso()
  });

  return customer.id;
}

async function stripeCheckout(req, res) {
  const stripe = stripeClient();
  const siteUrl = required("PUBLIC_SITE_URL");
  const body = await readJson(req);
  const { scope = "global", postIds = [], customerEmail, plan } = body;

  if (!customerEmail || !String(customerEmail).includes("@")) {
    return send(res, 400, { ok: false, error: "Valid customerEmail is required." });
  }

  const normalizedScope = scope === "elChapo" ? "elChapo" : "global";
  const customerId = await getOrCreateStripeCustomer(stripe, customerEmail);

  if (plan) {
    if (normalizedScope !== "global") {
      return send(res, 400, { ok: false, error: "Subscriptions are only enabled for the global xolar site." });
    }

    const planKey = String(plan).toLowerCase();
    const priceId = planKey === "yearly"
      ? process.env.STRIPE_GLOBAL_SUB_YEARLY_PRICE_ID
      : process.env.STRIPE_GLOBAL_SUB_MONTHLY_PRICE_ID;

    if (!priceId) {
      return send(res, 400, { ok: false, error: `Missing Stripe subscription price id for ${planKey}.` });
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

    return send(res, 200, { ok: true, url: session.url });
  }

  if (!Array.isArray(postIds) || postIds.length === 0) {
    return send(res, 400, { ok: false, error: "postIds must be a non-empty array." });
  }

  const paths = scopeToPaths(normalizedScope);
  const postsSnap = await db().ref(paths.ipas).once("value");
  const allPosts = postsSnap.val() || {};

  const selectedPosts = postIds
    .map(id => ({ id, ...allPosts[id] }))
    .filter(post => post.id && post.status !== "draft" && post.priceMode === "paid");

  if (!selectedPosts.length) {
    return send(res, 400, { ok: false, error: "No paid published IPAs found for checkout." });
  }

  const missingPrice = selectedPosts.find(post => !post.stripePriceId);
  if (missingPrice) {
    return send(res, 400, { ok: false, error: `Missing stripePriceId for ${missingPrice.name}.` });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    line_items: selectedPosts.map(post => ({
      price: post.stripePriceId,
      quantity: 1
    })),
    success_url: `${siteUrl}${normalizedScope === "elChapo" ? "/el-chapo" : ""}/purchases?success=true&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}${normalizedScope === "elChapo" ? "/el-chapo" : ""}/cart?canceled=true`,
    metadata: {
      scope: normalizedScope,
      checkoutType: "one_time",
      customerEmail: String(customerEmail).toLowerCase(),
      postIds: selectedPosts.map(post => post.id).join(",")
    }
  });

  return send(res, 200, { ok: true, url: session.url });
}

async function saveStripeCustomer(email, customerId) {
  if (!email || !customerId) return;

  await db().ref(`stripeCustomers/${safeEmailKey(email)}`).update({
    email: String(email).toLowerCase(),
    customerId,
    updatedAt: nowIso()
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

  if (customerEmail && session.customer) await saveStripeCustomer(customerEmail, session.customer);
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
      createdAt: nowIso(),
      updatedAt: nowIso()
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
    createdAt: nowIso()
  });

  for (const postId of postIds) {
    await db().ref(`${paths.access}/${emailKey}/${postId}`).set({
      postId,
      customerEmail,
      stripeSessionId: session.id,
      unlockedAt: nowIso(),
      updatedAt: nowIso()
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
    updatedAt: nowIso()
  });
}

async function stripeWebhook(req, res) {
  const stripe = stripeClient();
  const signature = req.headers["stripe-signature"];
  let event;

  try {
    const rawBody = await readRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    return send(res, 400, { ok: false, error: `Webhook signature verification failed: ${error.message}` });
  }

  if (event.type === "checkout.session.completed") await handleCheckoutCompleted(event.data.object);

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    await handleSubscriptionChange(event.data.object);
  }

  return send(res, 200, { ok: true, received: true });
}

async function stripePurchases(req, res) {
  const email = String(req.query.email || "").trim().toLowerCase();
  const scope = req.query.scope === "elChapo" ? "elChapo" : "global";

  if (!email || !email.includes("@")) {
    return send(res, 400, { ok: false, error: "Valid email is required." });
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
      if (post.status !== "draft" && post.priceMode === "paid" && post.includedInSubscription !== false) ids.add(id);
    }
  }

  const posts = [...ids]
    .map(id => publicPost(id, allPosts[id], 0))
    .filter(post => post.id && post.status !== "draft");

  return send(res, 200, { ok: true, email, scope, subscription: sub || null, count: posts.length, posts });
}

async function stripePortal(req, res) {
  const stripe = stripeClient();
  const body = await readJson(req);
  const { customerEmail, returnPath = "/payments" } = body;

  if (!customerEmail || !String(customerEmail).includes("@")) {
    return send(res, 400, { ok: false, error: "Valid customerEmail is required." });
  }

  const customerId = await getOrCreateStripeCustomer(stripe, customerEmail);
  const siteUrl = required("PUBLIC_SITE_URL");

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${siteUrl}${returnPath}`
  });

  return send(res, 200, { ok: true, url: session.url });
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(200).end();

  try {
    const parts = getPathParts(req);
    const route = parts.join("/");

    if (req.method === "GET" && route === "apple") return await appleLookup(req, res);

    if (parts[0] === "posts") {
      if (parts.length === 1) {
        if (req.method === "GET") return await listPosts(req, res, "global");
        if (req.method === "POST") return await createPost(req, res, "global");
      }

      if (parts.length === 2) {
        const id = parts[1];
        if (req.method === "GET") return await readPost(req, res, "global", id);
        if (req.method === "PUT") return await updatePost(req, res, "global", id);
        if (req.method === "DELETE") return await deletePost(req, res, "global", id);
      }
    }

    if (parts[0] === "views" && parts[1] && req.method === "POST") {
      return await incrementView(req, res, "global", parts[1]);
    }

    if (route === "admin/list" && req.method === "GET") return await adminList(req, res, "global");

    if (parts[0] === "el-chapo") {
      if (parts[1] === "posts") {
        if (parts.length === 2) {
          if (req.method === "GET") return await listPosts(req, res, "elChapo");
          if (req.method === "POST") return await createPost(req, res, "elChapo");
        }

        if (parts.length === 3) {
          const id = parts[2];
          if (req.method === "GET") return await readPost(req, res, "elChapo", id);
          if (req.method === "PUT") return await updatePost(req, res, "elChapo", id);
          if (req.method === "DELETE") return await deletePost(req, res, "elChapo", id);
        }
      }

      if (parts[1] === "views" && parts[2] && req.method === "POST") {
        return await incrementView(req, res, "elChapo", parts[2]);
      }

      if (route === "el-chapo/admin/list" && req.method === "GET") return await adminList(req, res, "elChapo");
    }

    if (route === "stripe/checkout" && req.method === "POST") return await stripeCheckout(req, res);
    if (route === "stripe/webhook" && req.method === "POST") return await stripeWebhook(req, res);
    if (route === "stripe/purchases" && req.method === "GET") return await stripePurchases(req, res);
    if (route === "stripe/portal" && req.method === "POST") return await stripePortal(req, res);

    return send(res, 404, { ok: false, error: `API route not found: /api/${route}` });
  } catch (error) {
    return send(res, 500, { ok: false, error: error.message });
  }
}
