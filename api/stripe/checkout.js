import { stripeCheckout } from "../../lib/server.js";
export default async function handler(req, res) {
  return stripeCheckout(req, res);
}
