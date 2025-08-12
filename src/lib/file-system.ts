import {
  normalizePath,
  getParentPath,
  getFileName,
  createDirectoryPath,
  isValidPath,
} from "@/lib/path-utils";

export interface FileNode {
  type: "file" | "directory";
  name: string;
  path: string;
  content?: string;
  children?: Map<string, FileNode>;
}

import { FILE_SYSTEM_LIMITS, ERROR_MESSAGES } from "@/lib/constants";

export class VirtualFileSystem {
  private files: Map<string, FileNode> = new Map();
  private root: FileNode;

  constructor() {
    this.root = {
      type: "directory",
      name: "/",
      path: "/",
      children: new Map(),
    };
    this.files.set("/", this.root);
  }

  private validatePath(path: string): void {
    if (!isValidPath(path)) {
      throw new Error(ERROR_MESSAGES.FILE_SYSTEM.INVALID_PATH);
    }
    if (path.length > FILE_SYSTEM_LIMITS.MAX_PATH_LENGTH) {
      throw new Error(`${ERROR_MESSAGES.FILE_SYSTEM.PATH_TOO_LONG}: ${path.length} > ${FILE_SYSTEM_LIMITS.MAX_PATH_LENGTH}`);
    }
  }

  private validateContent(content: string): void {
    if (content.length > FILE_SYSTEM_LIMITS.MAX_FILE_SIZE) {
      throw new Error(`${ERROR_MESSAGES.FILE_SYSTEM.FILE_TOO_LARGE}: ${content.length} > ${FILE_SYSTEM_LIMITS.MAX_FILE_SIZE}`);
    }
  }

  private getParentNode(path: string): FileNode | null {
    const parentPath = getParentPath(path);
    return this.files.get(parentPath) || null;
  }

  createFile(path: string, content: string = ""): FileNode | null {
    this.validatePath(path);
    this.validateContent(content);
    
    const normalized = normalizePath(path);

    if (this.files.has(normalized)) {
      return null;
    }

    this.ensureParentDirectories(normalized);

    const parent = this.getParentNode(normalized);
    if (!parent || parent.type !== "directory") {
      return null;
    }

    const fileName = getFileName(normalized);
    const file: FileNode = {
      type: "file",
      name: fileName,
      path: normalized,
      content,
    };

    this.files.set(normalized, file);
    parent.children!.set(fileName, file);

    return file;
  }

  private ensureParentDirectories(path: string): void {
    const directories = createDirectoryPath(path);
    for (const dirPath of directories) {
      if (!this.exists(dirPath)) {
        this.createDirectory(dirPath);
      }
    }
  }

  createDirectory(path: string): FileNode | null {
    this.validatePath(path);
    
    const normalized = normalizePath(path);

    if (this.files.has(normalized)) {
      return null;
    }

    const parent = this.getParentNode(normalized);
    if (!parent || parent.type !== "directory") {
      return null;
    }

    const dirName = getFileName(normalized);
    const directory: FileNode = {
      type: "directory",
      name: dirName,
      path: normalized,
      children: new Map(),
    };

    this.files.set(normalized, directory);
    parent.children!.set(dirName, directory);

    return directory;
  }

  readFile(path: string): string | null {
    this.validatePath(path);
    
    const normalized = normalizePath(path);
    const file = this.files.get(normalized);

    if (!file || file.type !== "file") {
      return null;
    }

    return file.content || "";
  }

  updateFile(path: string, content: string): boolean {
    this.validatePath(path);
    this.validateContent(content);
    
    const normalized = normalizePath(path);
    const file = this.files.get(normalized);

    if (!file || file.type !== "file") {
      return false;
    }

    file.content = content;
    return true;
  }

  deleteFile(path: string): boolean {
    this.validatePath(path);
    
    const normalized = normalizePath(path);
    const file = this.files.get(normalized);

    if (!file || normalized === "/") {
      return false;
    }

    const parent = this.getParentNode(normalized);
    if (!parent || parent.type !== "directory") {
      return false;
    }

    this.deleteRecursively(file);
    parent.children!.delete(file.name);
    this.files.delete(normalized);

    return true;
  }

  private deleteRecursively(node: FileNode): void {
    if (node.type === "directory" && node.children) {
      for (const [_, child] of node.children) {
        this.deleteRecursively(child);
        this.files.delete(child.path);
      }
    }
  }

  rename(oldPath: string, newPath: string): boolean {
    this.validatePath(oldPath);
    this.validatePath(newPath);
    
    const normalizedOld = normalizePath(oldPath);
    const normalizedNew = normalizePath(newPath);

    if (normalizedOld === "/" || normalizedNew === "/") {
      return false;
    }

    const sourceNode = this.files.get(normalizedOld);
    if (!sourceNode || this.files.has(normalizedNew)) {
      return false;
    }

    const oldParent = this.getParentNode(normalizedOld);
    if (!oldParent || oldParent.type !== "directory") {
      return false;
    }

    this.ensureParentDirectories(normalizedNew);

    const newParent = this.getParentNode(normalizedNew);
    if (!newParent || newParent.type !== "directory") {
      return false;
    }

    // Update node and parents
    oldParent.children!.delete(sourceNode.name);
    
    const newName = getFileName(normalizedNew);
    sourceNode.name = newName;
    sourceNode.path = normalizedNew;
    
    newParent.children!.set(newName, sourceNode);

    // Update file maps
    this.files.delete(normalizedOld);
    this.files.set(normalizedNew, sourceNode);

    if (sourceNode.type === "directory" && sourceNode.children) {
      this.updateChildrenPaths(sourceNode);
    }

    return true;
  }

  private updateChildrenPaths(node: FileNode): void {
    if (node.type === "directory" && node.children) {
      for (const [_, child] of node.children) {
        const oldChildPath = child.path;
        child.path = node.path + "/" + child.name;

        // Update in files map
        this.files.delete(oldChildPath);
        this.files.set(child.path, child);

        // Recursively update children if it's a directory
        if (child.type === "directory") {
          this.updateChildrenPaths(child);
        }
      }
    }
  }

  exists(path: string): boolean {
    if (!isValidPath(path)) return false;
    
    const normalized = normalizePath(path);
    return this.files.has(normalized);
  }

  getNode(path: string): FileNode | null {
    if (!isValidPath(path)) return null;
    
    const normalized = normalizePath(path);
    return this.files.get(normalized) || null;
  }

  listDirectory(path: string): FileNode[] | null {
    if (!isValidPath(path)) return null;
    
    const normalized = normalizePath(path);
    const dir = this.files.get(normalized);

    if (!dir || dir.type !== "directory") {
      return null;
    }

    return Array.from(dir.children?.values() || []);
  }

  getAllFiles(): Map<string, string> {
    const fileMap = new Map<string, string>();

    for (const [path, node] of this.files) {
      if (node.type === "file") {
        fileMap.set(path, node.content || "");
      }
    }

    return fileMap;
  }

  serialize(): Record<string, FileNode> {
    const result: Record<string, FileNode> = {};

    for (const [path, node] of this.files) {
      // Create a shallow copy without the Map children to avoid serialization issues
      if (node.type === "directory") {
        result[path] = {
          type: node.type,
          name: node.name,
          path: node.path,
        };
      } else {
        result[path] = {
          type: node.type,
          name: node.name,
          path: node.path,
          content: node.content,
        };
      }
    }

    return result;
  }

  deserialize(data: Record<string, string>): void {
    // Clear existing files except root
    this.files.clear();
    this.root.children?.clear();
    this.files.set("/", this.root);

    // Sort paths to ensure parent directories are created first
    const paths = Object.keys(data).sort();

    for (const path of paths) {
      const parts = path.split("/").filter(Boolean);
      let currentPath = "";

      // Create parent directories if they don't exist
      for (let i = 0; i < parts.length - 1; i++) {
        currentPath += "/" + parts[i];
        if (!this.exists(currentPath)) {
          this.createDirectory(currentPath);
        }
      }

      // Create the file
      this.createFile(path, data[path]);
    }
  }

  deserializeFromNodes(data: Record<string, FileNode>): void {
    // Clear existing files except root
    this.files.clear();
    this.root.children?.clear();
    this.files.set("/", this.root);

    // Sort paths to ensure parent directories are created first
    const paths = Object.keys(data).sort();

    for (const path of paths) {
      if (path === "/") continue; // Skip root

      const node = data[path];
      const parts = path.split("/").filter(Boolean);
      let currentPath = "";

      // Create parent directories if they don't exist
      for (let i = 0; i < parts.length - 1; i++) {
        currentPath += "/" + parts[i];
        if (!this.exists(currentPath)) {
          this.createDirectory(currentPath);
        }
      }

      // Create the file or directory
      if (node.type === "file") {
        this.createFile(path, node.content || "");
      } else if (node.type === "directory") {
        this.createDirectory(path);
      }
    }
  }

  // Text editor command implementations
  viewFile(path: string, viewRange?: [number, number]): string {
    const file = this.getNode(path);
    if (!file) {
      return `File not found: ${path}`;
    }

    // If it's a directory, list its contents
    if (file.type === "directory") {
      const children = this.listDirectory(path);
      if (!children || children.length === 0) {
        return "(empty directory)";
      }

      return children
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((child) => {
          const prefix = child.type === "directory" ? "[DIR]" : "[FILE]";
          return `${prefix} ${child.name}`;
        })
        .join("\n");
    }

    // For files, show content
    const content = file.content || "";

    // Handle view_range if provided
    if (viewRange && viewRange.length === 2) {
      const lines = content.split("\n");
      const [start, end] = viewRange;
      const startLine = Math.max(1, start);
      const endLine = end === -1 ? lines.length : Math.min(lines.length, end);

      const viewedLines = lines.slice(startLine - 1, endLine);
      return viewedLines
        .map((line, index) => `${startLine + index}\t${line}`)
        .join("\n");
    }

    // Return full file with line numbers
    const lines = content.split("\n");
    return (
      lines.map((line, index) => `${index + 1}\t${line}`).join("\n") ||
      "(empty file)"
    );
  }

  createFileWithParents(path: string, content: string = ""): string {
    // Check if file already exists
    if (this.exists(path)) {
      return `Error: File already exists: ${path}`;
    }

    // Create parent directories if they don't exist
    const parts = path.split("/").filter(Boolean);
    let currentPath = "";

    for (let i = 0; i < parts.length - 1; i++) {
      currentPath += "/" + parts[i];
      if (!this.exists(currentPath)) {
        this.createDirectory(currentPath);
      }
    }

    // Create the file
    this.createFile(path, content);
    return `File created: ${path}`;
  }

  replaceInFile(path: string, oldStr: string, newStr: string): string {
    const file = this.getNode(path);
    if (!file) {
      return `Error: File not found: ${path}`;
    }

    if (file.type !== "file") {
      return `Error: Cannot edit a directory: ${path}`;
    }

    const content = this.readFile(path) || "";

    // Check if old_str exists in the file
    if (!oldStr || !content.includes(oldStr)) {
      return `Error: String not found in file: "${oldStr}"`;
    }

    // Count occurrences
    const occurrences = (
      content.match(
        new RegExp(oldStr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")
      ) || []
    ).length;

    // Replace all occurrences
    const updatedContent = content.split(oldStr).join(newStr || "");
    this.updateFile(path, updatedContent);

    return `Replaced ${occurrences} occurrence(s) of the string in ${path}`;
  }

  insertInFile(path: string, insertLine: number, text: string): string {
    const file = this.getNode(path);
    if (!file) {
      return `Error: File not found: ${path}`;
    }

    if (file.type !== "file") {
      return `Error: Cannot edit a directory: ${path}`;
    }

    const content = this.readFile(path) || "";
    const lines = content.split("\n");

    // Validate insert_line
    if (
      insertLine === undefined ||
      insertLine < 0 ||
      insertLine > lines.length
    ) {
      return `Error: Invalid line number: ${insertLine}. File has ${lines.length} lines.`;
    }

    // Insert the text
    lines.splice(insertLine, 0, text || "");
    const updatedContent = lines.join("\n");
    this.updateFile(path, updatedContent);

    return `Text inserted at line ${insertLine} in ${path}`;
  }

  reset(): void {
    // Clear all files and reset to initial state
    this.files.clear();
    this.root = {
      type: "directory",
      name: "/",
      path: "/",
      children: new Map(),
    };
    this.files.set("/", this.root);
  }
}

export const fileSystem = new VirtualFileSystem();
