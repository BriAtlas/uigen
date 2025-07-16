"use client";

import { Loader2, FileText, FilePlus, Edit3, FileX, FolderOpen } from "lucide-react";

interface ToolInvocation {
  toolName: string;
  state?: "result" | string;
  args?: any;
  result?: any;
}

interface ToolCallIndicatorProps {
  toolInvocation: ToolInvocation;
}

export function ToolCallIndicator({ toolInvocation }: ToolCallIndicatorProps) {
  const { toolName, state, args } = toolInvocation;

  const getToolMessage = () => {
    switch (toolName) {
      case "str_replace_editor":
        if (!args) return "Working with file...";
        
        const { command, path } = args;
        const fileName = path ? path.split('/').pop() || path : 'file';
        
        switch (command) {
          case "create":
            return `Creating ${fileName}`;
          case "str_replace":
            return `Editing ${fileName}`;
          case "insert":
            return `Adding to ${fileName}`;
          case "view":
            return `Reading ${fileName}`;
          default:
            return `Modifying ${fileName}`;
        }
        
      case "file_manager":
        if (!args) return "Managing files...";
        
        const { command: fileCommand, path: filePath, new_path } = args;
        const fileToManage = filePath ? filePath.split('/').pop() || filePath : 'file';
        
        switch (fileCommand) {
          case "rename":
            const newFileName = new_path ? new_path.split('/').pop() || new_path : 'file';
            return `Renaming ${fileToManage} to ${newFileName}`;
          case "delete":
            return `Deleting ${fileToManage}`;
          default:
            return `Managing ${fileToManage}`;
        }
        
      default:
        return toolName.replace(/_/g, ' ');
    }
  };

  const getToolIcon = () => {
    switch (toolName) {
      case "str_replace_editor":
        if (!args) return FileText;
        
        const { command } = args;
        switch (command) {
          case "create":
            return FilePlus;
          case "view":
            return FolderOpen;
          default:
            return Edit3;
        }
        
      case "file_manager":
        if (!args) return FileText;
        
        const { command: fileManagerCommand } = args;
        switch (fileManagerCommand) {
          case "delete":
            return FileX;
          default:
            return FileText;
        }
        
      default:
        return FileText;
    }
  };

  const Icon = getToolIcon();
  const message = getToolMessage();
  const isCompleted = state === "result";

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs border border-neutral-200">
      {isCompleted ? (
        <>
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <Icon className="w-3 h-3 text-neutral-600" />
          <span className="text-neutral-700 font-medium">{message}</span>
        </>
      ) : (
        <>
          <Loader2 className="w-3 h-3 animate-spin text-blue-600" data-testid="loader-spinner" />
          <Icon className="w-3 h-3 text-neutral-600" />
          <span className="text-neutral-700 font-medium">{message}</span>
        </>
      )}
    </div>
  );
}