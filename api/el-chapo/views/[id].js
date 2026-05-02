import { incrementView } from "../../../lib/server.js";
export default async function handler(req, res) {
  return incrementView(req, res, "elChapo", req.query.id);
}
