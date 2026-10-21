import type { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error("[Designer Microservice Error]:", err?.stack || err?.message || err);

  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || "Internal Server Error in Designer Microservice";

  res.status(statusCode).json({
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
    path: req.originalUrl
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: `Resource not found: ${req.method} ${req.originalUrl}`,
    service: "designer-microservice"
  });
}

