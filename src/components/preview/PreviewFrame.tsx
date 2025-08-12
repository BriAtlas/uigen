"use client";

import { useEffect, useRef, useState } from "react";
import { useFileSystem } from "@/lib/contexts/file-system-context";
import {
  createImportMap,
  createPreviewHTML,
} from "@/lib/transform/jsx-transformer";
import { PreviewEmptyState } from "./PreviewEmptyState";
import { 
  findEntryPoint, 
  getPreviewError,
  shouldShowFirstLoadState 
} from "@/lib/preview-utils";
import { PREVIEW_CONFIG } from "@/lib/constants";

export function PreviewFrame() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { getAllFiles, refreshTrigger } = useFileSystem();
  const [error, setError] = useState<string | null>(null);
  const [entryPoint, setEntryPoint] = useState<string>("/App.jsx");
  const [isFirstLoad, setIsFirstLoad] = useState(true);

  useEffect(() => {
    const updatePreview = () => {
      try {
        const files = getAllFiles();
        const filesCount = files.size;

        // Clear error first when we have files
        if (filesCount > 0 && error) {
          setError(null);
        }

        // Find and update entry point
        const foundEntryPoint = findEntryPoint(files, entryPoint);
        if (foundEntryPoint !== entryPoint) {
          setEntryPoint(foundEntryPoint);
        }

        // Check for preview errors
        const previewError = getPreviewError(filesCount, foundEntryPoint, files, isFirstLoad);
        if (previewError) {
          setError(previewError);
          return;
        }

        // Mark as no longer first load if we have files
        if (filesCount > 0 && isFirstLoad) {
          setIsFirstLoad(false);
        }

        // Generate and display preview
        const { importMap, styles, errors } = createImportMap(files);
        const previewHTML = createPreviewHTML({
          entryPoint: foundEntryPoint,
          importMap,
          styles,
          errors
        });

        if (iframeRef.current) {
          const iframe = iframeRef.current;
          iframe.setAttribute(
            "sandbox",
            PREVIEW_CONFIG.IFRAME_SANDBOX_PERMISSIONS
          );
          iframe.srcdoc = previewHTML;
          setError(null);
        }
      } catch (err) {
        console.error("Preview error:", err);
        setError(err instanceof Error ? err.message : "Unknown preview error");
      }
    };

    updatePreview();
  }, [refreshTrigger, getAllFiles, entryPoint, error, isFirstLoad]);

  if (error) {
    return (
      <PreviewEmptyState 
        isFirstLoad={error === "firstLoad"}
        error={error !== "firstLoad" ? error : undefined}
      />
    );
  }

  return (
    <iframe
      ref={iframeRef}
      className="w-full h-full border-0 bg-white"
      title="Preview"
    />
  );
}

