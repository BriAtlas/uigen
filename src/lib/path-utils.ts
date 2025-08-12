/**
 * Utility functions for path manipulation in the virtual file system
 */

export function normalizePath(path: string): string {
  if (!path.startsWith("/")) {
    path = "/" + path;
  }
  
  if (path !== "/" && path.endsWith("/")) {
    path = path.slice(0, -1);
  }
  
  return path.replace(/\/+/g, "/");
}

export function getParentPath(path: string): string {
  const normalized = normalizePath(path);
  if (normalized === "/") return "/";
  
  const parts = normalized.split("/");
  parts.pop();
  return parts.length === 1 ? "/" : parts.join("/");
}

export function getFileName(path: string): string {
  const normalized = normalizePath(path);
  if (normalized === "/") return "/";
  
  const parts = normalized.split("/");
  return parts[parts.length - 1];
}

export function createDirectoryPath(targetPath: string): string[] {
  const parts = normalizePath(targetPath).split("/").filter(Boolean);
  const directories: string[] = [];
  let currentPath = "";

  for (let i = 0; i < parts.length - 1; i++) {
    currentPath += "/" + parts[i];
    directories.push(currentPath);
  }

  return directories;
}

export function resolveRelativePath(fromDir: string, relativePath: string): string {
  const parts = fromDir.split("/").filter(Boolean);
  const relParts = relativePath.split("/");
  
  for (const part of relParts) {
    if (part === "..") {
      parts.pop();
    } else if (part !== ".") {
      parts.push(part);
    }
  }
  
  return "/" + parts.join("/");
}

export function isValidPath(path: string): boolean {
  return typeof path === "string" && path.length > 0 && !path.includes('\0');
}