/**
 * Utility functions for preview functionality
 */

import { PREVIEW_CONFIG, ERROR_MESSAGES } from "@/lib/constants";

export function findEntryPoint(files: Map<string, string>, currentEntryPoint: string): string {
  // If current entry point exists, use it
  if (files.has(currentEntryPoint)) {
    return currentEntryPoint;
  }

  // Try standard entry points
  for (const candidate of PREVIEW_CONFIG.ENTRY_POINT_CANDIDATES) {
    if (files.has(candidate)) {
      return candidate;
    }
  }

  // Fall back to first JSX/TSX file
  const jsxFiles = Array.from(files.keys()).filter(path => 
    path.endsWith(".jsx") || path.endsWith(".tsx")
  );
  
  return jsxFiles[0] || currentEntryPoint;
}

export function shouldShowFirstLoadState(filesCount: number, isFirstLoad: boolean): boolean {
  return filesCount === 0 && isFirstLoad;
}

export function getPreviewError(
  filesCount: number, 
  entryPoint: string, 
  files: Map<string, string>,
  isFirstLoad: boolean
): string | null {
  if (filesCount === 0) {
    return isFirstLoad ? "firstLoad" : ERROR_MESSAGES.PREVIEW.NO_FILES;
  }

  if (!entryPoint || !files.has(entryPoint)) {
    return ERROR_MESSAGES.PREVIEW.NO_ENTRY_POINT;
  }

  return null;
}