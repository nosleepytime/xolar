import Stripe from "stripe";
import { db, safeEmailKey } from "../_firebase.js";

export function stripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("Missing STRIPE_SECRET_KEY");
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

export function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing environment variable: ${name}`);
  return value;
}

export async function getOrCreateStripeCustomer(stripe, email) {
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
    createdAt: new Date().toISOString()
  });

  return customer.id;
}

export function scopeToPaths(scope) {
  if (scope === "elChapo") {
    return {
      ipas: "elChapo/ipas",
      purchases: "elChapo/purchases",
      access: "elChapo/purchaseAccess"
    };
  }

  return {
    ipas: "ipas",
    purchases: "purchases",
    access: "purchaseAccess"
  };
}
