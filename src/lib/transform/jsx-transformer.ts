import * as Babel from "@babel/standalone";

export interface TransformResult {
  code: string;
  error?: string;
  missingImports?: Set<string>;
  cssImports?: Set<string>;
}

// Helper to create a placeholder module
function createPlaceholderModule(componentName: string): string {
  return `
import React from 'react';
const ${componentName} = function() {
  return React.createElement('div', {}, null);
}
export default ${componentName};
export { ${componentName} };
`;
}


export function transformJSX(
  code: string,
  filename: string,
  existingFiles: Set<string>
): TransformResult {
  try {
    const isTypeScript = filename.endsWith(".ts") || filename.endsWith(".tsx");

    // Pre-process imports to handle missing files
    let processedCode = code;
    const importRegex =
      /import\s+(?:{[^}]+}|[^,\s]+)?\s*(?:,\s*{[^}]+})?\s+from\s+['"]([^'"]+)['"]/g;
    const imports = new Set<string>();
    const cssImports = new Set<string>();

    // Detect CSS imports
    const cssImportRegex = /import\s+['"]([^'"]+\.css)['"]/g;
    let cssMatch;
    while ((cssMatch = cssImportRegex.exec(code)) !== null) {
      cssImports.add(cssMatch[1]);
    }

    // Remove CSS imports from code
    processedCode = processedCode.replace(cssImportRegex, '');

    let match;
    while ((match = importRegex.exec(code)) !== null) {
      // Skip CSS files from regular imports
      if (!match[1].endsWith('.css')) {
        imports.add(match[1]);
      }
    }

    const result = Babel.transform(processedCode, {
      filename,
      presets: [
        ["react", { runtime: "automatic" }],
        ...(isTypeScript ? ["typescript"] : []),
      ],
      plugins: [],
    });

    return {
      code: result.code || "",
      missingImports: imports,
      cssImports: cssImports,
    };
  } catch (error) {
    return {
      code: "",
      error: error instanceof Error ? error.message : "Unknown transform error",
    };
  }
}

// Track valid blob URLs with cleanup mechanism
interface BlobURLEntry {
  url: string;
  createdAt: number;
  mimeType: string;
}

const validBlobURLs = new Map<string, BlobURLEntry>();

export function createBlobURL(
  code: string,
  mimeType: string = "application/javascript"
): string {
  // Validate input parameters
  if (typeof code !== "string") {
    throw new Error("Code must be a string");
  }
  
  if (typeof mimeType !== "string") {
    throw new Error("MIME type must be a string");
  }
  
  // Validate MIME type is safe
  const allowedMimeTypes = [
    "application/javascript",
    "text/javascript",
    "application/json",
    "text/css" // Allow CSS for styling
  ];
  
  if (!allowedMimeTypes.includes(mimeType)) {
    throw new Error(`Unsafe MIME type: ${mimeType}`);
  }
  
  // Basic code validation - prevent obvious malicious patterns
  const dangerousPatterns = [
    /<script[^>]*>/i,
    /javascript:/i,
    /data:/i,
    /vbscript:/i,
    /\bon[a-z]+\s*=/i, // event handlers like onclick=, onload=
    /eval\s*\(/i,
    /new\s+Function\s*\(/i, // Function constructor (more specific)
    /setTimeout\s*\(/i,
    /setInterval\s*\(/i
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(code)) {
      throw new Error(`Code contains potentially dangerous patterns: ${pattern.source}`);
    }
  }
  
  const blob = new Blob([code], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  // Track this URL as valid with metadata
  validBlobURLs.set(url, {
    url,
    createdAt: Date.now(),
    mimeType
  });
  
  return url;
}

// Validate blob URL before use
export function validateBlobURL(url: string): boolean {
  return validBlobURLs.has(url) && url.startsWith("blob:");
}

// Get blob URL statistics for debugging
export function getBlobURLStats(): { count: number; oldestAge: number; newestAge: number } {
  const now = Date.now();
  const entries = Array.from(validBlobURLs.values());
  
  if (entries.length === 0) {
    return { count: 0, oldestAge: 0, newestAge: 0 };
  }
  
  const ages = entries.map(entry => now - entry.createdAt);
  return {
    count: entries.length,
    oldestAge: Math.max(...ages),
    newestAge: Math.min(...ages)
  };
}

// Re-export from the new modular import map builder
export { createImportMap, type ImportMapResult } from "./import-map-builder";

// Re-export from the new HTML template module
export { createPreviewHTML } from "./html-template";
