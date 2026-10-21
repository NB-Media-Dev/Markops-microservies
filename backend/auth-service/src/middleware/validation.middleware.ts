import type { Request, Response, NextFunction } from "express";
import type { ZodType } from "zod";


export function validateBody(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join(".") || "body",
          message: issue.message
        }))
      });
    }

    req.body = result.data;
    next();
  };
}


export function validateParams(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid URL parameters",
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join(".") || "params",
          message: issue.message
        }))
      });
    }

    req.params = result.data as any;
    next();
  };
}


export function validateQuery(schema: ZodType) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid query parameters",
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join(".") || "query",
          message: issue.message
        }))
      });
    }

    req.query = result.data as any;
    next();
  };
}



