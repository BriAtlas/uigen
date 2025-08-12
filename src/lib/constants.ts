/**
 * Application-wide constants and configuration
 */

// File System Configuration
export const FILE_SYSTEM_LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_PATH_LENGTH: 4096,
  MAX_FILES: 1000,
} as const;

// Preview Configuration  
export const PREVIEW_CONFIG = {
  ENTRY_POINT_CANDIDATES: [
    "/App.jsx",
    "/App.tsx", 
    "/index.jsx",
    "/index.tsx",
    "/src/App.jsx",
    "/src/App.tsx",
  ],
  IFRAME_SANDBOX_PERMISSIONS: "allow-scripts allow-same-origin allow-forms",
} as const;

// External Service URLs
export const EXTERNAL_SERVICES = {
  CDN_BASE: "https://esm.sh",
  TAILWIND_CSS: "https://cdn.tailwindcss.com",
  REACT_VERSION: "19",
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  FILE_SYSTEM: {
    INVALID_PATH: "Invalid path provided",
    PATH_TOO_LONG: "Path exceeds maximum length",
    FILE_TOO_LARGE: "File content exceeds size limit",
    FILE_NOT_FOUND: "File not found",
    DIRECTORY_NOT_FOUND: "Directory not found",
  },
  PREVIEW: {
    NO_ENTRY_POINT: "No React component found. Create an App.jsx or index.jsx file to get started.",
    NO_FILES: "No files to preview",
    TRANSFORM_ERROR: "Error transforming component",
  },
  VALIDATION: {
    EMAIL_REQUIRED: "Email is required",
    EMAIL_INVALID: "Please enter a valid email address",
    PASSWORD_REQUIRED: "Password is required",
    PASSWORD_TOO_SHORT: "Password must be at least 8 characters long",
    PASSWORDS_NO_MATCH: "Passwords do not match",
  },
} as const;

// Security Configuration
export const SECURITY_CONFIG = {
  ALLOWED_BLOB_MIME_TYPES: [
    "application/javascript",
    "text/javascript", 
    "application/json",
    "text/css",
  ],
  DANGEROUS_PATTERNS: [
    /<script[^>]*>/i,
    /javascript:/i,
    /data:/i,
    /vbscript:/i,
    /\bon[a-z]+\s*=/i, // event handlers
    /eval\s*\(/i,
    /new\s+Function\s*\(/i,
    /setTimeout\s*\(/i,
    /setInterval\s*\(/i,
  ],
} as const;