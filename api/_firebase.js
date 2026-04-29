import admin from "firebase-admin";

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export function getAdminApp() {
  if (admin.apps.length) return admin.apps[0];

  const privateKey = required("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n");

  return admin.initializeApp({
    credential: admin.credential.cert({
      projectId: required("FIREBASE_PROJECT_ID"),
      clientEmail: required("FIREBASE_CLIENT_EMAIL"),
      privateKey
    }),
    databaseURL: required("FIREBASE_DATABASE_URL")
  });
}

export function db() {
  getAdminApp();
  return admin.database();
}

export function nowIso() {
  return new Date().toISOString();
}

export function makeId(name = "ipa") {
  const clean = String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 42) || "ipa";
  return `${clean}-${Date.now().toString(36)}`;
}

export function requireApiKey(req, res) {
  const key = req.headers["x-api-key"] || req.query.key;
  if (!process.env.XOLAR_ADMIN_API_KEY || key !== process.env.XOLAR_ADMIN_API_KEY) {
    res.status(401).json({ ok: false, error: "Unauthorized. Missing or invalid x-api-key." });
    return false;
  }
  return true;
}

export function normalizePost(input = {}, existing = {}) {
  const merged = { ...existing, ...input };
  const name = String(merged.name || existing.name || "Untitled IPA").trim();

  const type = String(merged.type || existing.type || "app").toLowerCase();
  if (!["app", "game"].includes(type)) {
    throw new Error("type must be app or game");
  }

  const screenshots = Array.isArray(merged.screenshots) ? merged.screenshots.filter(Boolean) : [];
  const supportedDevices = Array.isArray(merged.supportedDevices) ? merged.supportedDevices.filter(Boolean) : [];
  const tags = Array.isArray(merged.tags) ? merged.tags.filter(Boolean) : [];

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
    screenshots,
    supportedDevices,
    category: String(merged.category || "").trim(),
    modFeatures: String(merged.modFeatures || "").trim(),
    tags,
    status: String(merged.status || "published").trim(),
    updatedAt: merged.updatedAt || nowIso(),
    createdAt: merged.createdAt || existing.createdAt || nowIso()
  };
}

export function publicPost(id, post, views = 0) {
  return {
    id,
    ...post,
    views: Number(views || 0)
  };
}
