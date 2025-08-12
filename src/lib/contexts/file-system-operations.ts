/**
 * File system operation handlers extracted from context
 * This improves separation of concerns and testability
 */

import { VirtualFileSystem } from "@/lib/file-system";

export interface ToolCall {
  toolName: string;
  args: any;
}

export interface FileSystemOperations {
  fileSystem: VirtualFileSystem;
  onFileChange: () => void;
  onFileSelect: (path: string | null) => void;
}

export function handleStrReplaceEditor(
  { fileSystem, onFileChange }: FileSystemOperations,
  args: any
): void {
  const { command, path, file_text, old_str, new_str, insert_line } = args;

  switch (command) {
    case "create":
      if (path && file_text !== undefined) {
        const result = fileSystem.createFileWithParents(path, file_text);
        if (!result.startsWith("Error:")) {
          onFileChange();
        }
      }
      break;

    case "str_replace":
      if (path && old_str !== undefined && new_str !== undefined) {
        const result = fileSystem.replaceInFile(path, old_str, new_str);
        if (!result.startsWith("Error:")) {
          onFileChange();
        }
      }
      break;

    case "insert":
      if (path && new_str !== undefined && insert_line !== undefined) {
        const result = fileSystem.insertInFile(path, insert_line, new_str);
        if (!result.startsWith("Error:")) {
          onFileChange();
        }
      }
      break;
  }
}

export function handleFileManager(
  { fileSystem, onFileChange, onFileSelect }: FileSystemOperations,
  args: any,
  selectedFile: string | null
): void {
  const { command, path, new_path } = args;

  switch (command) {
    case "rename":
      if (path && new_path) {
        const success = fileSystem.rename(path, new_path);
        if (success) {
          // Update selected file if it was renamed or is inside a renamed directory
          if (selectedFile === path) {
            onFileSelect(new_path);
          } else if (selectedFile?.startsWith(path + "/")) {
            const relativePath = selectedFile.substring(path.length);
            onFileSelect(new_path + relativePath);
          }
          onFileChange();
        }
      }
      break;

    case "delete":
      if (path) {
        const success = fileSystem.deleteFile(path);
        if (success) {
          if (selectedFile === path) {
            onFileSelect(null);
          }
          onFileChange();
        }
      }
      break;
  }
}

export function handleToolCall(
  operations: FileSystemOperations,
  toolCall: ToolCall,
  selectedFile: string | null
): void {
  const { toolName, args } = toolCall;

  if (toolName === "str_replace_editor" && args) {
    handleStrReplaceEditor(operations, args);
  } else if (toolName === "file_manager" && args) {
    handleFileManager(operations, args, selectedFile);
  }
}