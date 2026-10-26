import { z } from "zod";


const preprocessBoolean = (defaultValue?: boolean) =>
  z.preprocess((val) => {
    if (typeof val === "boolean") return val;
    if (typeof val === "string") {
      const lower = val.trim().toLowerCase();
      if (lower === "true" || lower === "1") return true;
      if (lower === "false" || lower === "0") return false;
    }
    if (typeof val === "number") {
      if (val === 1) return true;
      if (val === 0) return false;
    }
    return val;
  }, defaultValue !== undefined ? z.boolean().default(defaultValue) : z.boolean().optional());


const preprocessNullableString = (maxLength = 500) =>
  z.preprocess((val) => {
    if (val === "" || val === "null" || val === "undefined" || val === null) return null;
    return typeof val === "string" ? val.trim() : val;
  }, z.string().max(maxLength, `Field cannot exceed ${maxLength} characters`).nullable().optional());


const preprocessOptionalString = (min = 2, max = 100, fieldName = "Field") =>
  z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return undefined;
    return typeof val === "string" ? val.trim() : val;
  }, z.string().min(min, `${fieldName} must be at least ${min} characters`).max(max, `${fieldName} cannot exceed ${max} characters`).optional());


export const idParamSchema = z.object({
  id: z.string().trim().min(1, "Identifier parameter is required")
});


export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please provide a valid email address (e.g. user@company.com)"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(128, "Password cannot exceed 128 characters")
});



export const refreshTokenSchema = z.object({
  refreshToken: z
    .string()
    .trim()
    .min(1, "Refresh token cannot be empty")
});


export const createUserSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please provide a valid email address (e.g. user@company.com)")
    .max(191, "Email cannot exceed 191 characters"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(128, "Password cannot exceed 128 characters"),
  roleId: preprocessOptionalString(2, 50, "RoleId"),
  avatar_image: preprocessNullableString(500),
  isActive: preprocessBoolean(true)
});


export const updateUserSchema = z.object({
  name: preprocessOptionalString(2, 100, "Name"),
  email: z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return undefined;
    return typeof val === "string" ? val.trim().toLowerCase() : val;
  }, z.string().email("Please provide a valid email address").max(191, "Email cannot exceed 191 characters").optional()),
  password: z.preprocess((val) => {
    if (val === "" || val === null || val === undefined) return undefined;
    return val;
  }, z.string().min(6, "Password must be at least 6 characters").max(128, "Password cannot exceed 128 characters").optional()),
  roleId: preprocessOptionalString(2, 50, "RoleId"),
  avatar_image: preprocessNullableString(500),
  isActive: preprocessBoolean()
});


export const roleSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Role name must be at least 2 characters")
    .max(50, "Role cannot exceed 50 characters"),
  description: z.string().max(255).optional().default(""),
  permissions: z.array(z.string().min(1)).default([])
});

export const permissionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Permission name must be at least 2 characters")
    .max(100, "Permission name cannot exceed 100 characters"),
  description: z.string().max(255).optional().default(""),
  resource: z
    .string()
    .trim()
    .min(1, "Resource cannot be empty")
    .max(50, "Resource cannot exceed 50 characters"),
  action: z
    .string()
    .trim()
    .min(1, "Action cannot be empty")
    .max(50, "Action cannot exceed 50 characters")
});
