import { directDownload } from "../lib/server.js";

export default async function handler(req, res) {
  return directDownload(req, res);
}
