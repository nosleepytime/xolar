import { handlePosts } from "../../lib/server.js";
export default async function handler(req, res) {
  return handlePosts(req, res, "elChapo");
}
