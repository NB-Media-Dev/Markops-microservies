import mysql from "mysql2/promise";
import type { Pool, PoolConnection } from "mysql2/promise";
import { config } from "./env.config.js";

let activePool: Pool | null = null;

export interface DbPoolWrapper {
  isConnected: () => boolean;
  query: (...args: any[]) => Promise<any>;
  queryStrict: (...args: any[]) => Promise<any>;
  getConnection: () => Promise<PoolConnection>;
}

export const dbPool: DbPoolWrapper = {
  isConnected: () => Boolean(activePool),
  query: async (...args: any[]) => {
    if (!activePool) return [[]];
    try {
      return await (activePool as any).query(...args);
    } catch (e: any) {
      console.warn("[Designer DB Query Warning]:", e?.message || e);
      return [[]];
    }
  },
  queryStrict: async (...args: any[]) => {
    if (!activePool) throw new Error("Designer Database pool not connected");
    return (activePool as any).query(...args);
  },
  getConnection: async () => {
    if (!activePool) throw new Error("Designer Database pool not connected");
    return activePool.getConnection();
  }
};

export interface RoleInfo {
  id: number;
  name: string;
  code: string;
}

export const ROLE_MAP: Record<string, RoleInfo> = {
  ADMINISTRATOR: { id: 1, name: "Administrator", code: "ADMINISTRATOR" },
  DESIGNER: { id: 2, name: "Creative Designer", code: "DESIGNER" },
  BDM: { id: 3, name: "Business Development Manager", code: "BDM" },
  MARKETING_MANAGER: { id: 4, name: "Marketing Manager", code: "MARKETING_MANAGER" }
};

export interface UserStoreItem {
  id: number | string;
  email: string;
  fullName: string;
  role: string;
  department: string;
  isActive: boolean;
}

export interface PackageStoreItem {
  id: string;
  productId: string;
  name: string;
  description: string;
  price: number;
  status: string;
}

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

export interface VersionItem {
  id: number | string;
  taskId: number | string;
  versionNumber: number;
  submittedBy: number | string;
  submittedByName: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  changelog: string;
  createdAt: string;
}

export interface StatusHistoryItem {
  id: number | string;
  taskId: number | string;
  actorId: number | string;
  actorName: string;
  previousStatus: string;
  newStatus: string;
  remark: string;
  createdAt: string;
}

export interface CommentItem {
  id: number | string;
  taskId: number | string;
  userId: number | string;
  userName: string;
  userRole: string;
  comment: string;
  createdAt: string;
}

export interface TaskStoreItem {
  id: number | string;
  title: string;
  taskType: string;
  packageName: string;
  productId: string;
  productName: string;
  description: string;
  content: string;
  attachmentUrl: string;
  attachmentName: string;
  reviewerFeedback: string;
  status: string;
  priority: string;
  createdBy: number | string;
  creatorName: string;
  creatorRole: string;
  creatorEmail: string;
  assignedTo: number | string;
  assigneeName: string;
  dueDate: string;
  progressPercent: number;
  createdAt: string;
  updatedAt: string;
  versions?: VersionItem[];
  statusHistory?: StatusHistoryItem[];
  comments?: CommentItem[];
  [key: string]: any;
}

// Initial Seed Users for fallback
export const dbUsersStore: UserStoreItem[] = [
  {
    id: 1,
    email: "admin@markops.io",
    fullName: "System Administrator",
    role: "ADMINISTRATOR",
    department: "Executive Operations",
    isActive: true
  },
  {
    id: 2,
    email: "designer@markops.io",
    fullName: "Creative Designer",
    role: "DESIGNER",
    department: "Creative Design Studio",
    isActive: true
  },
  {
    id: 3,
    email: "bdm@markops.io",
    fullName: "Marcus BDM",
    role: "BDM",
    department: "Sales & BD",
    isActive: true
  },
  {
    id: 4,
    email: "sarah.designer@markops.io",
    fullName: "Sarah Jenkins",
    role: "DESIGNER",
    department: "Creative Design Studio",
    isActive: true
  },
  {
    id: 5,
    email: "david.visual@markops.io",
    fullName: "David Kim",
    role: "DESIGNER",
    department: "Creative Design Studio",
    isActive: true
  }
];

export const dbPackagesStore: PackageStoreItem[] = [
  {
    id: "pkg_careermate",
    productId: "prod_careermate",
    name: "Careermate",
    description: "Career acceleration & placement package",
    price: 2499.0,
    status: "ACTIVE"
  },
  {
    id: "pkg_classmate",
    productId: "prod_classmate",
    name: "Classmate",
    description: "Educational and exam prep package",
    price: 1899.0,
    status: "ACTIVE"
  },
  {
    id: "pkg_jesus_messanger",
    productId: "prod_jesus_messanger",
    name: "Jesus the messanger",
    description: "Community broadcast and faith package",
    price: 1499.0,
    status: "ACTIVE"
  }
];

export const dbNotificationsStore: NotificationStoreItem[] = [];

export const dbTasksStore: TaskStoreItem[] = [
  {
    id: 101,
    title: "Design Q4 Hero Banner for Careermate",
    taskType: "BANNER_DESIGN",
    packageName: "Careermate",
    productId: "pkg_careermate",
    productName: "Careermate",
    description: "Create an ultra-modern 1200x628 landscape hero banner highlighting AI-assisted mentoring.",
    content: "Hero copy: Fast-track your career trajectory with MarkOps AI.",
    attachmentUrl: "/uploads/briefs/careermate_brief.pdf",
    attachmentName: "careermate_brief.pdf",
    reviewerFeedback: "",
    status: "IN_PROGRESS",
    priority: "HIGH",
    createdBy: 3,
    creatorName: "Marcus BDM",
    creatorRole: "BDM",
    creatorEmail: "bdm@markops.io",
    assignedTo: 2,
    assigneeName: "Creative Designer",
    dueDate: new Date(Date.now() + 2 * 86400000).toISOString().split("T")[0],
    progressPercent: 50,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    updatedAt: new Date().toISOString(),
    versions: [],
    statusHistory: [
      {
        id: 1,
        taskId: 101,
        actorId: 3,
        actorName: "Marcus BDM",
        previousStatus: "DRAFT",
        newStatus: "ASSIGNED",
        remark: "Assigned to Creative Designer",
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
      },
      {
        id: 2,
        taskId: 101,
        actorId: 2,
        actorName: "Creative Designer",
        previousStatus: "ASSIGNED",
        newStatus: "IN_PROGRESS",
        remark: "Designer started working on this task.",
        createdAt: new Date(Date.now() - 3600000 * 3).toISOString()
      }
    ],
    comments: [
      {
        id: 1,
        taskId: 101,
        userId: 3,
        userName: "Marcus BDM",
        userRole: "BDM",
        comment: "Please ensure high contrast for mobile display.",
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
      }
    ]
  },
  {
    id: 102,
    title: "Classmate Mobile Feed Ad Creative Set",
    taskType: "BANNER_DESIGN",
    packageName: "Classmate",
    productId: "pkg_classmate",
    productName: "Classmate",
    description: "1080x1080 square format ad set with vibrant typography and badges.",
    content: "Key hook: Master your exams with targeted mock tests.",
    attachmentUrl: "",
    attachmentName: "",
    reviewerFeedback: "",
    status: "SUBMITTED",
    priority: "URGENT",
    createdBy: 3,
    creatorName: "Marcus BDM",
    creatorRole: "BDM",
    creatorEmail: "bdm@markops.io",
    assignedTo: 2,
    assigneeName: "Creative Designer",
    dueDate: new Date().toISOString().split("T")[0],
    progressPercent: 80,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    versions: [
      {
        id: 1,
        taskId: 102,
        versionNumber: 1,
        submittedBy: 2,
        submittedByName: "Creative Designer",
        fileName: "classmate_feed_v1.png",
        filePath: "/uploads/designs/classmate_feed_v1.png",
        fileSize: 1420500,
        mimeType: "image/png",
        changelog: "Initial submission of social ad design.",
        createdAt: new Date(Date.now() - 7200000).toISOString()
      }
    ],
    statusHistory: [
      {
        id: 3,
        taskId: 102,
        actorId: 2,
        actorName: "Creative Designer",
        previousStatus: "IN_PROGRESS",
        newStatus: "SUBMITTED",
        remark: "Version 1 submitted for review",
        createdAt: new Date(Date.now() - 7200000).toISOString()
      }
    ],
    comments: []
  },
  {
    id: 103,
    title: "Community Outreach Poster Series",
    taskType: "BANNER_DESIGN",
    packageName: "Jesus the messanger",
    productId: "pkg_jesus_messanger",
    productName: "Jesus the messanger",
    description: "Series of 3 portrait banners for church announcements.",
    content: "Quote: Hope, fellowship, and transformation.",
    attachmentUrl: "",
    attachmentName: "",
    reviewerFeedback: "Approved! Excellent visual balance and color harmony.",
    status: "APPROVED",
    priority: "MEDIUM",
    createdBy: 1,
    creatorName: "System Administrator",
    creatorRole: "ADMINISTRATOR",
    creatorEmail: "admin@markops.io",
    assignedTo: 4,
    assigneeName: "Sarah Jenkins",
    dueDate: new Date(Date.now() - 86400000).toISOString().split("T")[0],
    progressPercent: 100,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date().toISOString(),
    versions: [],
    statusHistory: [],
    comments: []
  },
  {
    id: 104,
    title: "Careermate LinkedIn Carousel Templates",
    taskType: "BANNER_DESIGN",
    packageName: "Careermate",
    productId: "pkg_careermate",
    productName: "Careermate",
    description: "5-slide carousel emphasizing job placement statistics.",
    content: "Call-to-action: Swipe through to see 2026 hiring trends.",
    attachmentUrl: "",
    attachmentName: "",
    reviewerFeedback: "Background contrast needs improvement on slide 1.",
    status: "REVISION_REQUIRED",
    priority: "HIGH",
    createdBy: 3,
    creatorName: "Marcus BDM",
    creatorRole: "BDM",
    creatorEmail: "bdm@markops.io",
    assignedTo: 2,
    assigneeName: "Creative Designer",
    dueDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    progressPercent: 50,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date().toISOString(),
    versions: [
      {
        id: 2,
        taskId: 104,
        versionNumber: 1,
        submittedBy: 2,
        submittedByName: "Creative Designer",
        fileName: "careermate_carousel_draft.png",
        filePath: "/uploads/designs/careermate_carousel_draft.png",
        fileSize: 2180400,
        mimeType: "image/png",
        changelog: "Initial 5 slides layout draft.",
        createdAt: new Date(Date.now() - 86400000).toISOString()
      }
    ],
    statusHistory: [],
    comments: []
  }
];

export async function initDatabase(): Promise<void> {
  try {
    let pool: Pool | null = null;
    let connected = false;

    if (config.databaseUrl) {
      try {
        const cleanUrl = config.databaseUrl.replace(/[?&]ssl-mode=[^&]*/i, "").replace(/\?$/, "");
        pool = mysql.createPool({
          uri: cleanUrl,
          ssl: { rejectUnauthorized: false },
          connectTimeout: 5000,
          waitForConnections: true,
          connectionLimit: 10
        });
        const conn = await pool.getConnection();
        conn.release();
        connected = true;
      } catch (err) {
        // Fall back to host/port
      }
    }

    if (!connected) {
      try {
        pool = mysql.createPool({
          host: config.dbHost,
          port: config.dbPort,
          user: config.dbUser,
          password: config.dbPassword,
          database: config.dbName,
          connectTimeout: 5000,
          waitForConnections: true,
          connectionLimit: 10
        });
        const conn = await pool.getConnection();
        conn.release();
        connected = true;
      } catch (err) {
        // Fallback to in-memory store
      }
    }

    if (connected && pool) {
      activePool = pool;
      console.log("[Designer Microservice DB] Connected to MySQL database.");
    } else {
      console.log("[Designer Microservice DB] MySQL unreachable. Active in-memory resilient store ready.");
      activePool = null;
    }
  } catch (err: any) {
    console.log("[Designer Microservice DB] Running in resilient memory store mode:", err?.message || err);
    activePool = null;
  }
}

