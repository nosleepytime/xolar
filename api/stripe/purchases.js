import { stripePurchases } from "../../lib/server.js";
export default async function handler(req, res) {
  return stripePurchases(req, res);
}
