import { appleLookup } from "../lib/server.js";
export default async function handler(req, res) {
  return appleLookup(req, res);
}
