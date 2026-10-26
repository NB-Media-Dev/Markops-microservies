import { servicesConfig } from "../config/services.config.js";

export interface ServiceHealthStatus {
  service: string;
  url: string;
  status: "UP" | "DOWN";
  responseTimeMs?: number;
  error?: string;
}

export async function checkMicroserviceHealth(
  name: string,
  url: string,
  timeoutMs = 2000
): Promise<ServiceHealthStatus> {
  const start = Date.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${url}/health`, { signal: controller.signal });
    clearTimeout(timer);
    const duration = Date.now() - start;

    if (res.ok) {
      return {
        service: name,
        url,
        status: "UP",
        responseTimeMs: duration
      };
    }

    return {
      service: name,
      url,
      status: "DOWN",
      responseTimeMs: duration,
      error: `HTTP ${res.status}`
    };
  } catch (err: any) {
    clearTimeout(timer);
    return {
      service: name,
      url,
      status: "DOWN",
      responseTimeMs: Date.now() - start,
      error: err.name === "AbortError" ? "Request Timeout" : err.message || "Connection refused"
    };
  }
}

export async function checkAllServicesHealth(): Promise<Record<string, ServiceHealthStatus>> {
  const entries = Object.entries(servicesConfig.services);
  const results: Record<string, ServiceHealthStatus> = {};

  const checks = entries.map(async ([name, url]) => {
    results[name] = await checkMicroserviceHealth(name, url);
  });

  await Promise.allSettled(checks);
  return results;
}

