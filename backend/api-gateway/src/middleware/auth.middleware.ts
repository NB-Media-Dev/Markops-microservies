import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { servicesConfig } from "../config/services.config.js";

export interface GatewayUserPayload {
  userId: string;
  email: string;
  role: string;
  permissions?: string[];
  [key: string]: any;
}

export function authenticateGatewayToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Authorization token required (Bearer <token>)"
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, servicesConfig.jwtSecret) as GatewayUserPayload;

    // Attach decoded user to headers for downstream microservices
    req.headers["x-user-id"] = String(decoded.userId);
    req.headers["x-user-email"] = decoded.email;
    req.headers["x-user-role"] = decoded.role;

    (req as any).user = decoded;
    next();
  } catch (err: any) {
    return res.status(401).json({
      success: false,
      message: err.name === "TokenExpiredError" ? "Token expired" : "Invalid authentication token"
    });
  }
}

export function optionalGatewayToken(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, servicesConfig.jwtSecret) as GatewayUserPayload;
      req.headers["x-user-id"] = String(decoded.userId);
      req.headers["x-user-email"] = decoded.email;
      req.headers["x-user-role"] = decoded.role;
      (req as any).user = decoded;
    } catch {
      // Ignore if optional
    }
  }
  next();
}

export function requireRole(allowedRoles: string[]) {
  const normalizedAllowed = allowedRoles.map((r) => r.toUpperCase());

  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = (req.headers["x-user-role"] as string) || (req as any).user?.role;

    if (!userRole) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: No user role identified"
      });
    }

    if (!normalizedAllowed.includes(userRole.toUpperCase())) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to roles: [${allowedRoles.join(", ")}]`
      });
    }

    next();
  };
}

