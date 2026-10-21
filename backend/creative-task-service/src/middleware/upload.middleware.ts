import fs from "node:fs";
import path from "node:path";
import { config } from "../config/env.config.js";

export function saveBase64Attachment(
  dataUrl?: string | null,
  fileName?: string,
  subFolder = "briefs"
): string | null | undefined {
  if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:")) {
    return dataUrl || null;
  }
  try {
    const matches = dataUrl.match(/^data:([A-Za-z0-9-+\/.]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return dataUrl;
    }
    const buffer = Buffer.from(matches[2], "base64");
    const safeName = `${Date.now()}_${(fileName || "asset.png").replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const targetDir = path.join(config.uploadDir, subFolder);
    fs.mkdirSync(targetDir, { recursive: true });
    const targetPath = path.join(targetDir, safeName);
    fs.writeFileSync(targetPath, buffer);
    return `/uploads/${subFolder}/${safeName}`;
  } catch (e: any) {
    console.error("[Upload Middleware Error] Failed to write file to disk:", e?.message || e);
    return dataUrl;
  }
}

export function formatDueDate(val: any): string {
  if (!val) return "";
  if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val.trim())) return val.trim();
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  } catch {
    return "";
  }
}

export function computeTaskProgress(status?: string | null, dbProgress?: number): number {
  const s = String(status || "").toUpperCase().trim();
  switch (s) {
    case "APPROVED":
    case "COMPLETED":
    case "PUBLISHED":
      return 100;
    case "SUBMITTED":
    case "UNDER_REVIEW":
    case "RESUBMITTED":
      return 80;
    case "IN_PROGRESS":
    case "REDESIGN_REQUIRED":
    case "REVISION_REQUIRED":
      return 50;
    case "ACCEPTED":
      return 25;
    case "ASSIGNED":
      return 10;
    case "DRAFT":
      return 0;
    default:
      if (typeof dbProgress === "number" && dbProgress >= 0 && dbProgress <= 100) {
        return dbProgress;
      }
      return 10;
  }
}

