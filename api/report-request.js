import { createReportRequest } from "../lib/server.js";

export default async function handler(req, res) {
  return createReportRequest(req, res);
}
