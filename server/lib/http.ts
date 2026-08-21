import type { IncomingMessage, ServerResponse } from "node:http";

export type UserRole = "ADMIN" | "SUPERVISOR" | "SECURITY_GUARD";

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  mobileNumber?: string | null;
  profilePictureUrl?: string | null;
  role: UserRole;
};

export type ApiRequest = IncomingMessage & {
  body?: unknown;
  query: Record<string, string | string[] | undefined>;
  params: Record<string, string>;
  path: string;
  auth?: UserRecord;
  token?: string;
};

export type ApiResponse = ServerResponse & {
  status: (code: number) => ApiResponse;
  json: (body: unknown) => ApiResponse;
  send: (body?: unknown) => ApiResponse;
};

export function adaptResponse(res: ServerResponse): ApiResponse {
  const response = res as ApiResponse;
  if (typeof response.status !== "function") {
    response.status = (code) => {
      response.statusCode = code;
      return response;
    };
  }
  if (typeof response.json !== "function") {
    response.json = (body) => {
      response.setHeader("content-type", "application/json; charset=utf-8");
      response.end(JSON.stringify(body));
      return response;
    };
  }
  if (typeof response.send !== "function") {
    response.send = (body) => {
      if (body === undefined) {
        response.end();
      } else if (typeof body === "string" || Buffer.isBuffer(body)) {
        response.end(body);
      } else {
        response.json(body);
      }
      return response;
    };
  }
  return response;
}

export function sendError(res: ApiResponse, status: number, code: string, message: string) {
  return res.status(status).json({ success: false, error: { code, message } });
}

export function pathParams(path: string, pattern: string): Record<string, string> | null {
  const pathParts = path.split("/").filter(Boolean);
  const patternParts = pattern.split("/").filter(Boolean);
  if (pathParts.length !== patternParts.length) return null;

  const params: Record<string, string> = {};
  for (let index = 0; index < patternParts.length; index += 1) {
    const expected = patternParts[index];
    const actual = pathParts[index];
    if (expected.startsWith(":")) {
      params[expected.slice(1)] = decodeURIComponent(actual);
    } else if (expected !== actual) {
      return null;
    }
  }
  return params;
}

export function requestPath(req: IncomingMessage) {
  const rawPath = new URL(req.url ?? "/", "http://localhost").pathname;
  const path = rawPath.replace(/^\/api(?=\/|$)/, "");
  return path || "/";
}