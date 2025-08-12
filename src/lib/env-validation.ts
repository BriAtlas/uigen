// Environment variable validation utility
import "server-only";

interface EnvVariable {
  name: string;
  required: boolean;
  description: string;
  validator?: (value: string) => boolean;
  defaultValue?: string;
}

// Define all environment variables used in the application
const ENV_VARIABLES: EnvVariable[] = [
  {
    name: "NODE_ENV",
    required: true,
    description: "Node.js environment (development, production, test)",
    validator: (value: string) => ["development", "production", "test"].includes(value),
  },
  {
    name: "JWT_SECRET",
    required: false, // Optional in development, required in production
    description: "Secret key for JWT token signing (min 32 characters)",
    validator: (value: string) => value.length >= 32,
  },
  {
    name: "ANTHROPIC_API_KEY",
    required: false, // Optional - falls back to mock provider
    description: "Anthropic API key for Claude AI integration",
    validator: (value: string) => value.startsWith("sk-ant-"),
  },
  {
    name: "DATABASE_URL",
    required: false, // Optional - uses default SQLite file
    description: "Database connection URL",
    defaultValue: "file:./dev.db",
  },
  {
    name: "NEXTAUTH_URL",
    required: false, // Optional - only needed for external auth
    description: "Base URL for authentication callbacks",
  },
  {
    name: "PORT",
    required: false,
    description: "Port number for the server",
    validator: (value: string) => {
      const port = parseInt(value, 10);
      return !isNaN(port) && port > 0 && port <= 65535;
    },
    defaultValue: "3000",
  },
];

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  missing: string[];
}

export function validateEnvironmentVariables(): ValidationResult {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    missing: [],
  };

  const isProduction = process.env.NODE_ENV === "production";

  for (const envVar of ENV_VARIABLES) {
    const value = process.env[envVar.name];

    // Check if required variable is missing
    if (!value) {
      if (envVar.required || (envVar.name === "JWT_SECRET" && isProduction)) {
        result.errors.push(
          `${envVar.name} is required ${isProduction ? "in production" : ""}: ${envVar.description}`
        );
        result.missing.push(envVar.name);
        result.valid = false;
      } else if (envVar.defaultValue) {
        result.warnings.push(
          `${envVar.name} not set, using default: ${envVar.defaultValue}`
        );
      } else {
        result.warnings.push(
          `${envVar.name} not set: ${envVar.description}`
        );
      }
      continue;
    }

    // Validate the value if validator is provided
    if (envVar.validator && !envVar.validator(value)) {
      result.errors.push(
        `${envVar.name} has invalid value: ${envVar.description}`
      );
      result.valid = false;
    }
  }

  // Additional production-specific checks
  if (isProduction) {
    // In production, we should have HTTPS
    const nextauthUrl = process.env.NEXTAUTH_URL;
    if (nextauthUrl && !nextauthUrl.startsWith("https://")) {
      result.warnings.push(
        "NEXTAUTH_URL should use HTTPS in production for security"
      );
    }

    // Check for development-only settings
    if (process.env.NODE_TLS_REJECT_UNAUTHORIZED === "0") {
      result.errors.push(
        "NODE_TLS_REJECT_UNAUTHORIZED=0 should not be used in production"
      );
      result.valid = false;
    }
  }

  return result;
}

export function logValidationResults(result: ValidationResult): void {
  if (result.errors.length > 0) {
    console.error("❌ Environment variable validation failed:");
    result.errors.forEach((error) => console.error(`  - ${error}`));
  }

  if (result.warnings.length > 0) {
    console.warn("⚠️  Environment variable warnings:");
    result.warnings.forEach((warning) => console.warn(`  - ${warning}`));
  }

  if (result.valid && result.errors.length === 0) {
    console.log("✅ Environment variables validated successfully");
  }
}

export function validateAndExit(): void {
  const result = validateEnvironmentVariables();
  logValidationResults(result);

  if (!result.valid) {
    console.error("\n💥 Application cannot start with invalid environment variables");
    console.error("Please fix the errors above and restart the application");
    process.exit(1);
  }
}

// Additional security-focused environment checks
export function performSecurityChecks(): void {
  const securityIssues: string[] = [];

  // Check for common insecure environment variables
  if (process.env.DEBUG === "true" || process.env.DEBUG === "*") {
    securityIssues.push("DEBUG mode is enabled - disable in production");
  }

  if (process.env.NODE_ENV === "production") {
    // Check for weak JWT secrets in production
    const jwtSecret = process.env.JWT_SECRET;
    if (jwtSecret && jwtSecret.length < 64) {
      securityIssues.push("JWT_SECRET should be at least 64 characters long in production");
    }

    // Check for insecure database URLs
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl && dbUrl.includes("password=") && !dbUrl.startsWith("postgres://") && !dbUrl.startsWith("mysql://")) {
      securityIssues.push("Database URL contains password - ensure it's properly secured");
    }
  }

  if (securityIssues.length > 0) {
    console.warn("🔒 Security recommendations:");
    securityIssues.forEach((issue) => console.warn(`  - ${issue}`));
  }
}