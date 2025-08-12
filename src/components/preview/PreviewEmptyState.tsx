"use client";

import { AlertCircle } from "lucide-react";

interface PreviewEmptyStateProps {
  isFirstLoad?: boolean;
  error?: string;
}

export function PreviewEmptyState({ isFirstLoad, error }: PreviewEmptyStateProps) {
  if (isFirstLoad) {
    return (
      <div className="h-full flex items-center justify-center p-8 bg-gray-50">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
            <svg
              className="h-8 w-8 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Welcome to UI Generator
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Start building React components with AI assistance
          </p>
          <p className="text-xs text-gray-500">
            Ask the AI to create your first component to see it live here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex items-center justify-center p-8 bg-gray-50">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
          <AlertCircle className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No Preview Available
        </h3>
        <p className="text-sm text-gray-500">{error}</p>
        <p className="text-xs text-gray-400 mt-2">
          Start by creating a React component using the AI assistant
        </p>
      </div>
    </div>
  );
}