import type { ServerResponse } from "node:http";
import { logger } from "./logger";
import { adaptResponse, requestPath, sendError, type ApiRequest, type ApiResponse } from "./http";
import { handleHealth } from "../routes/health";
import { handleManagement } from "../routes/management";

function addCors(res: ApiResponse) {
  res.setHeader("access-control-allow-origin", "*");
  res.setHeader("access-control-allow-headers", "Content-Type, Authorization");
  res.setHeader("access-control-allow-methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
}

export async function handleApiRequest(rawReq: ApiRequest, rawRes: ServerResponse) {
  const req = rawReq;
  const res = adaptResponse(rawRes);
  addCors(res);
  req.path = requestPath(req);
  req.params = {};

  if (req.method === "OPTIONS") {
    res.status(204).send();
    return;
  }

  try {
    if (req.path === "/health" || req.path === "/healthz") {
      await handleHealth(req, res);
      return;
    }
    if (await handleManagement(req, res)) return;
    sendError(res, 404, "NOT_FOUND", "API route not found.");
  } catch (error) {
    logger.error({ err: error, method: req.method, path: req.path }, "Unhandled API error");
    sendError(res, 500, "INTERNAL_ERROR", "Something went wrong. Please try again.");
  }
}