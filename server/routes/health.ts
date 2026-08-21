import { HealthCheckResponse } from "../api-zod";
import type { ApiRequest, ApiResponse } from "../lib/http";

export async function handleHealth(_req: ApiRequest, res: ApiResponse) {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
}
