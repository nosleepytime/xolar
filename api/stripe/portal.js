import { stripePortal } from "../../lib/server.js";
export default async function handler(req, res) {
  return stripePortal(req, res);
}
