import { randomUUID } from "node:crypto";
import type { Request, Response, NextFunction } from "express";

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const existingId = req.headers["x-request-id"] as string | undefined;
  const requestId = existingId || randomUUID();

  // Set on request and response headers
  req.headers["x-request-id"] = requestId;
  res.setHeader("X-Request-Id", requestId);

  next();
}

