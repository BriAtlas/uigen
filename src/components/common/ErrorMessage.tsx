"use client";

interface ErrorMessageProps {
  error: string;
}

export function ErrorMessage({ error }: ErrorMessageProps) {
  if (!error) return null;

  return (
    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
      {error}
    </div>
  );
}