import type { Request, Response, NextFunction } from "express";

export function errorMiddleware(
  error: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error("API Gateway Error:", error);

  const status = error.status || error.statusCode || 500;
  const message = error.message || "Internal Gateway Server Error";

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" ? { stack: error.stack } : {})
  });
}

