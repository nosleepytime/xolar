import { stripeWebhook } from "../../lib/server.js";
export const config = {
  api: {
    bodyParser: false
  }
};
export default async function handler(req, res) {
  return stripeWebhook(req, res);
}
