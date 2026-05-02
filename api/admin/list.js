import { adminList } from "../../lib/server.js";
export default async function handler(req, res) {
  return adminList(req, res);
}
