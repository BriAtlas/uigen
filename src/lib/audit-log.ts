// Security audit logging system
import "server-only";
import { prisma } from "./prisma";

export enum AuditEventType {
  // Authentication events
  LOGIN_SUCCESS = "LOGIN_SUCCESS",
  LOGIN_FAILED = "LOGIN_FAILED",
  LOGOUT = "LOGOUT",
  SESSION_REFRESH = "SESSION_REFRESH",
  SESSION_EXPIRED = "SESSION_EXPIRED",
  
  // Rate limiting events
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  SUSPICIOUS_ACTIVITY = "SUSPICIOUS_ACTIVITY",
  
  // Authorization events
  UNAUTHORIZED_ACCESS = "UNAUTHORIZED_ACCESS",
  FORBIDDEN_ACCESS = "FORBIDDEN_ACCESS",
  
  // System events
  STARTUP = "STARTUP",
  SHUTDOWN = "SHUTDOWN",
  ERROR = "ERROR",
  
  // User events
  USER_CREATED = "USER_CREATED",
  PASSWORD_CHANGED = "PASSWORD_CHANGED",
  
  // Project events
  PROJECT_CREATED = "PROJECT_CREATED",
  PROJECT_ACCESSED = "PROJECT_ACCESSED",
  PROJECT_MODIFIED = "PROJECT_MODIFIED",
}

export interface AuditLogData {
  eventType: AuditEventType;
  userId?: string;
  userEmail?: string;
  clientId?: string;
  ipAddress?: string;
  userAgent?: string;
  resource?: string;
  details?: Record<string, any>;
  severity: "low" | "medium" | "high" | "critical";
  timestamp?: Date;
}

// In-memory buffer for high-frequency events (with fallback)
const auditBuffer: AuditLogData[] = [];
const MAX_BUFFER_SIZE = 100;
const FLUSH_INTERVAL = 30000; // 30 seconds

// Edge Runtime compatible timer management
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleNextFlush() {
  if (flushTimer) return; // Already scheduled
  
  flushTimer = setTimeout(async () => {
    flushTimer = null;
    
    if (auditBuffer.length === 0) {
      scheduleNextFlush(); // Schedule next check
      return;
    }
    
    try {
      await flushAuditBuffer();
    } catch (error) {
      console.error("Failed to flush audit buffer:", error);
    }
    
    scheduleNextFlush(); // Schedule next flush
  }, FLUSH_INTERVAL);
}

// Start the flush cycle
scheduleNextFlush();

async function flushAuditBuffer(): Promise<void> {
  if (auditBuffer.length === 0) return;
  
  const events = auditBuffer.splice(0, auditBuffer.length);
  
  try {
    // First, try to create audit table if it doesn't exist (in case of schema changes)
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "AuditLog" (
        "id" TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        "eventType" TEXT NOT NULL,
        "userId" TEXT,
        "userEmail" TEXT,
        "clientId" TEXT,
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "resource" TEXT,
        "details" TEXT,
        "severity" TEXT NOT NULL,
        "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create index if it doesn't exist
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "AuditLog_eventType_timestamp_idx" ON "AuditLog"("eventType", "timestamp")
    `;
    
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "AuditLog_userId_timestamp_idx" ON "AuditLog"("userId", "timestamp")
    `;

    // Insert audit events using raw SQL for better performance
    for (const event of events) {
      await prisma.$executeRaw`
        INSERT INTO "AuditLog" (
          "eventType", "userId", "userEmail", "clientId", 
          "ipAddress", "userAgent", "resource", "details", 
          "severity", "timestamp"
        ) VALUES (
          ${event.eventType}, ${event.userId || null}, ${event.userEmail || null}, 
          ${event.clientId || null}, ${event.ipAddress || null}, ${event.userAgent || null}, 
          ${event.resource || null}, ${event.details ? JSON.stringify(event.details) : null}, 
          ${event.severity}, ${event.timestamp || new Date()}
        )
      `;
    }
    
    console.log(`Flushed ${events.length} audit events to database`);
  } catch (error) {
    console.error("Failed to insert audit events, re-adding to buffer:", error);
    // Re-add events to buffer if database write fails
    auditBuffer.unshift(...events);
  }
}

export async function logAuditEvent(data: AuditLogData): Promise<void> {
  const auditEvent: AuditLogData = {
    ...data,
    timestamp: data.timestamp || new Date(),
  };

  // Add to buffer
  auditBuffer.push(auditEvent);

  // Flush immediately for critical events or if buffer is full
  if (data.severity === "critical" || auditBuffer.length >= MAX_BUFFER_SIZE) {
    await flushAuditBuffer();
  }

  // Log to console for immediate visibility (in development)
  // Edge Runtime compatible logging
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === "development") {
    try {
      console.log(`[AUDIT] ${data.eventType}:`, {
        severity: data.severity,
        userId: data.userId,
        resource: data.resource,
        details: data.details,
      });
    } catch {
      // Silently fail if console is not available
    }
  }
}

// Helper functions for common audit events

export async function logLoginSuccess(userId: string, email: string, clientId: string, ipAddress?: string): Promise<void> {
  await logAuditEvent({
    eventType: AuditEventType.LOGIN_SUCCESS,
    userId,
    userEmail: email,
    clientId,
    ipAddress,
    severity: "low",
    details: { success: true },
  });
}

export async function logLoginFailed(email: string, reason: string, clientId: string, ipAddress?: string): Promise<void> {
  await logAuditEvent({
    eventType: AuditEventType.LOGIN_FAILED,
    userEmail: email,
    clientId,
    ipAddress,
    severity: "medium",
    details: { reason, success: false },
  });
}

export async function logRateLimitExceeded(clientId: string, resource: string, ipAddress?: string, userAgent?: string): Promise<void> {
  await logAuditEvent({
    eventType: AuditEventType.RATE_LIMIT_EXCEEDED,
    clientId,
    ipAddress,
    userAgent,
    resource,
    severity: "medium",
    details: { blocked: true },
  });
}

export async function logSuspiciousActivity(clientId: string, reason: string, ipAddress?: string, userAgent?: string): Promise<void> {
  await logAuditEvent({
    eventType: AuditEventType.SUSPICIOUS_ACTIVITY,
    clientId,
    ipAddress,
    userAgent,
    severity: "high",
    details: { reason, blocked: true },
  });
}

export async function logUnauthorizedAccess(resource: string, clientId: string, ipAddress?: string): Promise<void> {
  await logAuditEvent({
    eventType: AuditEventType.UNAUTHORIZED_ACCESS,
    clientId,
    ipAddress,
    resource,
    severity: "high",
    details: { blocked: true },
  });
}

export async function logSessionRefresh(userId: string, email: string, clientId: string): Promise<void> {
  await logAuditEvent({
    eventType: AuditEventType.SESSION_REFRESH,
    userId,
    userEmail: email,
    clientId,
    severity: "low",
    details: { success: true },
  });
}

export async function logSystemStartup(): Promise<void> {
  await logAuditEvent({
    eventType: AuditEventType.STARTUP,
    severity: "low",
    details: { 
      nodeEnv: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    },
  });
}

// Cleanup old audit logs (run periodically)
export async function cleanupOldAuditLogs(daysToKeep: number = 90): Promise<void> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

  try {
    const result = await prisma.$executeRaw`
      DELETE FROM "AuditLog" WHERE "timestamp" < ${cutoffDate}
    `;
    console.log(`Cleaned up old audit logs older than ${daysToKeep} days`);
  } catch (error) {
    console.error("Failed to cleanup old audit logs:", error);
  }
}

// Query functions for audit logs (for security monitoring)
export async function getRecentFailedLogins(minutes: number = 60): Promise<any[]> {
  const since = new Date();
  since.setMinutes(since.getMinutes() - minutes);

  try {
    const results = await prisma.$queryRaw`
      SELECT * FROM "AuditLog" 
      WHERE "eventType" = ${AuditEventType.LOGIN_FAILED} 
      AND "timestamp" > ${since}
      ORDER BY "timestamp" DESC
    `;
    return results as any[];
  } catch (error) {
    console.error("Failed to query failed logins:", error);
    return [];
  }
}

export async function getRateLimitViolations(hours: number = 24): Promise<any[]> {
  const since = new Date();
  since.setHours(since.getHours() - hours);

  try {
    const results = await prisma.$queryRaw`
      SELECT * FROM "AuditLog" 
      WHERE "eventType" IN (${AuditEventType.RATE_LIMIT_EXCEEDED}, ${AuditEventType.SUSPICIOUS_ACTIVITY})
      AND "timestamp" > ${since}
      ORDER BY "timestamp" DESC
    `;
    return results as any[];
  } catch (error) {
    console.error("Failed to query rate limit violations:", error);
    return [];
  }
}

// Edge Runtime compatible shutdown handling
if (typeof globalThis !== 'undefined') {
  // Store flush function globally for manual cleanup if needed
  (globalThis as any).__flushAuditBuffer = flushAuditBuffer;
}

// For Node.js environments (non-Edge Runtime)
if (typeof process !== 'undefined' && typeof process.on === 'function') {
  const gracefulShutdown = async (signal: string) => {
    console.log(`Received ${signal}, flushing audit buffer...`);
    
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
    
    try {
      await flushAuditBuffer();
      console.log('Audit buffer flushed successfully');
    } catch (error) {
      console.error('Failed to flush audit buffer on shutdown:', error);
    }
  };
  
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
}