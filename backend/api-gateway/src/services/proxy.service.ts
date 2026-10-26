import { createProxyMiddleware, fixRequestBody } from "http-proxy-middleware";
import type { Request, Response } from "express";

export interface ProxyOptions {
  target: string;
  routePrefix?: string;
  changeOrigin?: boolean;
  pathRewrite?: ((path: string, req: Request) => string) | Record<string, string>;
  serviceName?: string;
}

export function createServiceProxy(options: ProxyOptions) {
  const { target, routePrefix, changeOrigin = true, serviceName = "Microservice" } = options;


  const pathRewrite =
    options.pathRewrite || (routePrefix ? (p: string) => `${routePrefix}${p === "/" ? "" : p}` : undefined);

  return createProxyMiddleware({
    target,
    changeOrigin,
    pathRewrite,
    on: {
      proxyReq: (proxyReq, req: Request, _res: Response) => {

        if (req.headers["x-user-id"]) {
          proxyReq.setHeader("x-user-id", req.headers["x-user-id"]);
        }
        if (req.headers["x-user-email"]) {
          proxyReq.setHeader("x-user-email", req.headers["x-user-email"]);
        }
        if (req.headers["x-user-role"]) {
          proxyReq.setHeader("x-user-role", req.headers["x-user-role"]);
        }
        if (req.headers["x-request-id"]) {
          proxyReq.setHeader("x-request-id", req.headers["x-request-id"]);
        }


        if (req.body && Object.keys(req.body).length > 0) {
          fixRequestBody(proxyReq, req);
        }
      },
      error: (err, req: Request, res: any) => {
        console.error(`[Gateway Proxy Error] Target: ${target} (${serviceName}):`, err.message);

        if (!res.headersSent) {
          const origin = req.headers.origin || "*";
          res.setHeader("Access-Control-Allow-Origin", origin);
          res.setHeader("Access-Control-Allow-Credentials", "true");
          res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
          res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Request-Id");

          res.status(503).json({
            success: false,
            message: `${serviceName} is currently offline or unreachable at ${target}. Please start ${serviceName}.`,
            target,
            error: err.message
          });
        }
      }
    }
  });
}
