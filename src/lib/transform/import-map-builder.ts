import { createBlobURL, transformJSX } from "./jsx-transformer";
import { resolveRelativePath } from "@/lib/path-utils";

interface BlobURLEntry {
  url: string;
  createdAt: number;
  mimeType: string;
}

// Configuration constants
const CDN_BASE = "https://esm.sh";
const REACT_VERSION = "19";
const DEFAULT_IMPORTS = {
  react: `${CDN_BASE}/react@${REACT_VERSION}`,
  "react-dom": `${CDN_BASE}/react-dom@${REACT_VERSION}`,
  "react-dom/client": `${CDN_BASE}/react-dom@${REACT_VERSION}/client`,
  "react/jsx-runtime": `${CDN_BASE}/react@${REACT_VERSION}/jsx-runtime`,
  "react/jsx-dev-runtime": `${CDN_BASE}/react@${REACT_VERSION}/jsx-dev-runtime`,
};

export interface ImportMapResult {
  importMap: string;
  styles: string;
  errors: Array<{ path: string; error: string }>;
}

export class ImportMapBuilder {
  private imports: Record<string, string> = { ...DEFAULT_IMPORTS };
  private styles = "";
  private errors: Array<{ path: string; error: string }> = [];
  private transformedFiles = new Map<string, string>();
  private allImports = new Set<string>();
  private allCssImports = new Set<{ from: string; cssPath: string }>();

  constructor(private files: Map<string, string>) {}

  build(): ImportMapResult {
    this.processFiles();
    this.processCssImports();
    this.createPlaceholderModules();
    
    return {
      importMap: JSON.stringify({ imports: this.imports }, null, 2),
      styles: this.styles,
      errors: this.errors
    };
  }

  private processFiles(): void {
    const existingFiles = new Set(this.files.keys());

    for (const [path, content] of this.files) {
      if (this.isJavaScriptFile(path)) {
        this.processJavaScriptFile(path, content, existingFiles);
      } else if (path.endsWith(".css")) {
        this.processCSSFile(path, content);
      }
    }
  }

  private isJavaScriptFile(path: string): boolean {
    return /\.(js|jsx|ts|tsx)$/.test(path);
  }

  private processJavaScriptFile(path: string, content: string, existingFiles: Set<string>): void {
    const { code, error, missingImports, cssImports } = transformJSX(
      content,
      path,
      existingFiles
    );
    
    if (error) {
      this.errors.push({ path, error });
      return;
    }

    try {
      const blobUrl = createBlobURL(code);
      this.transformedFiles.set(path, blobUrl);
      this.addImportVariations(path, blobUrl);

      // Collect imports
      if (missingImports) {
        missingImports.forEach((imp) => {
          const isPackage = !imp.startsWith(".") && 
                            !imp.startsWith("/") && 
                            !imp.startsWith("@/");
          
          if (isPackage) {
            this.imports[imp] = `${CDN_BASE}/${imp}`;
          } else {
            this.allImports.add(imp);
          }
        });
      }

      // Collect CSS imports
      if (cssImports) {
        cssImports.forEach((cssImport) => {
          this.allCssImports.add({ from: path, cssPath: cssImport });
        });
      }
    } catch (error) {
      this.errors.push({
        path,
        error: error instanceof Error ? error.message : "Unknown transform error"
      });
    }
  }

  private processCSSFile(path: string, content: string): void {
    this.styles += `/* ${path} */\n${content}\n\n`;
  }

  private processCssImports(): void {
    for (const { from, cssPath } of this.allCssImports) {
      let resolvedPath = cssPath;
      
      if (cssPath.startsWith("@/")) {
        resolvedPath = cssPath.replace("@/", "/");
      } else if (cssPath.startsWith("./") || cssPath.startsWith("../")) {
        const fromDir = from.substring(0, from.lastIndexOf("/"));
        resolvedPath = resolveRelativePath(fromDir, cssPath);
      }

      if (!this.files.has(resolvedPath)) {
        this.styles += `/* ${cssPath} not found */\n`;
      }
    }
  }

  private addImportVariations(path: string, blobUrl: string): void {
    // Add primary path
    this.imports[path] = blobUrl;

    // Add path without leading slash
    if (path.startsWith("/")) {
      this.imports[path.substring(1)] = blobUrl;
    }

    // Add @/ alias variations
    if (path.startsWith("/")) {
      this.imports["@" + path] = blobUrl;
      this.imports["@/" + path.substring(1)] = blobUrl;
    }

    // Add versions without file extensions
    const pathWithoutExt = path.replace(/\.(jsx?|tsx?)$/, "");
    this.imports[pathWithoutExt] = blobUrl;

    if (path.startsWith("/")) {
      this.imports[pathWithoutExt.substring(1)] = blobUrl;
      this.imports["@" + pathWithoutExt] = blobUrl;
      this.imports["@/" + pathWithoutExt.substring(1)] = blobUrl;
    }
  }

  private createPlaceholderModules(): void {
    for (const importPath of this.allImports) {
      if (this.imports[importPath] || importPath.startsWith("react")) {
        continue;
      }

      const isPackage = !importPath.startsWith(".") && 
                        !importPath.startsWith("/") && 
                        !importPath.startsWith("@/");

      if (isPackage) {
        this.imports[importPath] = `${CDN_BASE}/${importPath}`;
        continue;
      }

      // Check if the import exists in any form
      const variations = [
        importPath,
        importPath + ".jsx",
        importPath + ".tsx", 
        importPath + ".js",
        importPath + ".ts",
        importPath.replace("@/", "/"),
        importPath.replace("@/", "/") + ".jsx",
        importPath.replace("@/", "/") + ".tsx",
      ];

      let found = false;
      for (const variant of variations) {
        if (this.imports[variant] || this.files.has(variant)) {
          found = true;
          break;
        }
      }

      if (!found) {
        const match = importPath.match(/\/([^\/]+)$/);
        const componentName = match
          ? match[1]
          : importPath.replace(/[^a-zA-Z0-9]/g, "");

        const placeholderCode = this.createPlaceholderModule(componentName);
        const placeholderUrl = createBlobURL(placeholderCode);

        this.imports[importPath] = placeholderUrl;
        if (importPath.startsWith("@/")) {
          this.imports[importPath.replace("@/", "/")] = placeholderUrl;
          this.imports[importPath.replace("@/", "")] = placeholderUrl;
        }
      }
    }
  }

  private createPlaceholderModule(componentName: string): string {
    return `
import React from 'react';
const ${componentName} = function() {
  return React.createElement('div', {}, null);
}
export default ${componentName};
export { ${componentName} };
`;
  }
}

export function createImportMap(files: Map<string, string>): ImportMapResult {
  const builder = new ImportMapBuilder(files);
  return builder.build();
}