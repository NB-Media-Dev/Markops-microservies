export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  details?: Record<string, any>;
  ip?: string;
  createdAt: string;
}


const auditLogs: AuditLog[] = [
  {
    id: "audit-1",
    userId: "usr-admin",
    action: "SYSTEM_INIT",
    details: { message: "Auth service started with sample initial data" },
    ip: "127.0.0.1",
    createdAt: new Date().toISOString()
  }
];

export async function logAudit(
  action: string,
  userId?: string,
  details?: Record<string, any>,
  ip?: string
): Promise<AuditLog> {
  const newLog: AuditLog = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    userId,
    action,
    details,
    ip: ip || "unknown",
    createdAt: new Date().toISOString()
  };

  auditLogs.unshift(newLog);

  if (auditLogs.length > 100) {
    auditLogs.pop();
  }

  return newLog;
}

export async function getAuditLogs(userId?: string): Promise<AuditLog[]> {
  if (userId) {
    return auditLogs.filter(log => log.userId === userId);
  }
  return [...auditLogs];
}

