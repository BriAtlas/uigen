// Application startup initialization
import "server-only";
import { validateAndExit, performSecurityChecks } from "./env-validation";
import { logSystemStartup, cleanupOldAuditLogs } from "./audit-log";

// Flag to ensure initialization only runs once
let initialized = false;

export async function initializeApplication(): Promise<void> {
  if (initialized) {
    return;
  }

  console.log("🚀 Initializing UIGen application...");

  // Validate environment variables
  validateAndExit();

  // Perform security checks
  performSecurityChecks();

  // Log system startup
  await logSystemStartup();

  // Clean up old audit logs (keep 90 days)
  if (process.env.NODE_ENV === "production") {
    setTimeout(async () => {
      await cleanupOldAuditLogs(90);
    }, 5000); // Delay to avoid blocking startup
  }

  // Mark as initialized
  initialized = true;

  console.log("✅ Application initialization complete");
}

// Auto-initialize when this module is imported in server context
if (typeof window === "undefined") {
  initializeApplication();
}