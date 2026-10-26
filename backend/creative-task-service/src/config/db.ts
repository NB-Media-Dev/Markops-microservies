import mysql from "mysql2/promise";
import type { Pool, PoolConnection } from "mysql2/promise";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Check multiple potential locations for .env
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "backend/.env") });
dotenv.config({ path: path.resolve(process.cwd(), "backend/creative-task-service/.env") });

const databaseUrl = process.env.DATABASE_URL || "mysql://root:Ratheesh@17@localhost:3306/designer_db";

const dbUrl = new URL(databaseUrl);

export const pool: Pool = mysql.createPool({
  host: dbUrl.hostname,
  port: Number(dbUrl.port || 3306),
  user: decodeURIComponent(dbUrl.username),
  password: decodeURIComponent(dbUrl.password),
  database: dbUrl.pathname.slice(1),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

export interface DbPoolWrapper {
  isConnected: () => boolean;
  query: Pool["query"];
  getConnection: () => Promise<PoolConnection>;
}

// Wrapper alias for compatibility
export const dbPool: DbPoolWrapper = {
  isConnected: () => true,
  query: pool.query.bind(pool),
  getConnection: () => pool.getConnection()
};

export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query("SELECT DATABASE() AS db");
    console.log("[Designer Microservice DB] Connected database:", rows);
    connection.release();
  } catch (error) {
    console.error("[Designer Microservice DB] Database connection failed:", error);
  }
}

export const initDatabase = testConnection;

// ==============================================================================
// Domain Entity Interfaces (Mapped directly to Schema.sql 5 tables)
// ==============================================================================

// 1. Table: ourproducts
export interface ProductItem {
  id: string;
  name: string;
  createdAt?: string;
}

// 2. Table: product_packages
export interface PackageItem {
  id: string;
  productId: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}
export type PackageStoreItem = PackageItem;

// 3. Table: tasks
export interface TaskItem {
  id: number;
  campaignId?: number | null;
  title: string;
  taskType: "BANNER" | "POSTER" | "VIDEO" | string;
  packageId?: string | null;
  packageName?: string | null;
  productId?: string | null;
  productName?: string | null;
  description?: string | null;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  reviewerFeedback?: string | null;
  status:
    | "DRAFT"
    | "ASSIGNED"
    | "ACCEPTED"
    | "IN_PROGRESS"
    | "SUBMITTED"
    | "UNDER_REVIEW"
    | "REVISION_REQUIRED"
    | "REDESIGN_REQUIRED"
    | "RESUBMITTED"
    | "APPROVED"
    | "PUBLISHED"
    | "COMPLETED"
    | string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT" | string;
  createdBy: number;
  assignedTo?: number | null;
  dueDate?: string | null;
  progressPercent: number;
  createdAt?: string;
  updatedAt?: string;
  deliverables?: DeliverableItem[];
  activities?: ActivityItem[];
  versions?: DeliverableItem[];
  comments?: ActivityItem[];
  statusHistory?: ActivityItem[];
  [key: string]: any;
}
export type TaskStoreItem = TaskItem;

// 4. Table: task_activities
export interface ActivityItem {
  id: number;
  taskId: number;
  previousStatus?: string | null;
  newStatus: string;
  changedBy: number;
  comment?: string | null;
  durationSeconds?: number | null;
  createdAt?: string;
  actorId?: number;
  actorName?: string;
  userId?: number;
  userName?: string;
  userRole?: string;
  remark?: string;
}
export type StatusHistoryItem = ActivityItem;
export type CommentItem = ActivityItem;

// 5. Table: task_deliverables
export interface DeliverableItem {
  id: number;
  taskId: number;
  userId: number;
  assetType: "BRIEF_ATTACHMENT" | "DESIGN_SUBMISSION" | string;
  versionNumber: number;
  fileName: string;
  filePath: string;
  storageKey?: string | null;
  fileSize: number;
  mimeType: string;
  changelog?: string | null;
  createdAt?: string;
  submittedBy?: number;
  submittedByName?: string;
}
export type VersionItem = DeliverableItem;

export interface NotificationStoreItem {
  id: number | string;
  userId: number | string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  targetRoute: string;
  createdAt: string;
}

export interface UserStoreItem {
  id: number | string;
  email: string;
  fullName: string;
  role: string;
  department: string;
  isActive: boolean;
}
