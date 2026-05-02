import { stripeSupport } from "../../lib/server.js";
export default async function handler(req, res) {
  return stripeSupport(req, res);
}
