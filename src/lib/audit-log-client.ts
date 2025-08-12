// Client-side audit logging that safely calls server-side functions
"use client";

// Re-export types that are safe to use on client
export enum AuditEventType {
  // Authentication events
  LOGIN_SUCCESS = "LOGIN_SUCCESS",
  LOGIN_FAILED = "LOGIN_FAILED",
  LOGOUT = "LOGOUT",
  SESSION_REFRESH = "SESSION_REFRESH",
  
  // Access control events
  UNAUTHORIZED_ACCESS = "UNAUTHORIZED_ACCESS",
  PERMISSION_DENIED = "PERMISSION_DENIED",
  
  // Rate limiting events
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  SUSPICIOUS_ACTIVITY = "SUSPICIOUS_ACTIVITY",
  
  // System events
  STARTUP = "STARTUP",
  ERROR = "ERROR",
  
  // File operations
  FILE_CREATE = "FILE_CREATE",
  FILE_UPDATE = "FILE_UPDATE",
  FILE_DELETE = "FILE_DELETE",
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

// Client-safe audit logging function
export async function logAuditEventClient(data: AuditLogData): Promise<void> {
  // Only log to console in development
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log(`[AUDIT] ${data.eventType}:`, data);
  }
  
  // In production, send to server endpoint
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    try {
      await fetch('/api/audit-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
    } catch (error) {
      // Silently fail if audit logging is not available
      console.warn('Failed to send audit log:', error);
    }
  }
}