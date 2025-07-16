import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ToolCallIndicator } from "../ToolCallIndicator";

describe("ToolCallIndicator", () => {
  describe("str_replace_editor tool", () => {
    it("shows create message for create command", () => {
      const toolInvocation = {
        toolName: "str_replace_editor",
        state: "result",
        args: {
          command: "create",
          path: "/components/Button.tsx",
        },
      };

      render(<ToolCallIndicator toolInvocation={toolInvocation} />);
      
      expect(screen.getByText("Creating Button.tsx")).toBeDefined();
      expect(document.querySelector(".w-2.h-2.rounded-full.bg-emerald-500")).toBeDefined();
    });

    it("shows edit message for str_replace command", () => {
      const toolInvocation = {
        toolName: "str_replace_editor",
        state: "result",
        args: {
          command: "str_replace",
          path: "/App.jsx",
          old_str: "old text",
          new_str: "new text",
        },
      };

      render(<ToolCallIndicator toolInvocation={toolInvocation} />);
      
      expect(screen.getByText("Editing App.jsx")).toBeDefined();
    });

    it("shows insert message for insert command", () => {
      const toolInvocation = {
        toolName: "str_replace_editor",
        args: {
          command: "insert",
          path: "/utils/helpers.ts",
          insert_line: 10,
          new_str: "new line",
        },
      };

      render(<ToolCallIndicator toolInvocation={toolInvocation} />);
      
      expect(screen.getByText("Adding to helpers.ts")).toBeDefined();
    });

    it("shows read message for view command", () => {
      const toolInvocation = {
        toolName: "str_replace_editor",
        state: "result",
        args: {
          command: "view",
          path: "/package.json",
        },
      };

      render(<ToolCallIndicator toolInvocation={toolInvocation} />);
      
      expect(screen.getByText("Reading package.json")).toBeDefined();
    });

    it("shows generic modify message for unknown command", () => {
      const toolInvocation = {
        toolName: "str_replace_editor",
        args: {
          command: "unknown",
          path: "/test.js",
        },
      };

      render(<ToolCallIndicator toolInvocation={toolInvocation} />);
      
      expect(screen.getByText("Modifying test.js")).toBeDefined();
    });

    it("shows generic message when no args provided", () => {
      const toolInvocation = {
        toolName: "str_replace_editor",
        state: "result",
      };

      render(<ToolCallIndicator toolInvocation={toolInvocation} />);
      
      expect(screen.getByText("Working with file...")).toBeDefined();
    });
  });

  describe("file_manager tool", () => {
    it("shows rename message for rename command", () => {
      const toolInvocation = {
        toolName: "file_manager",
        state: "result",
        args: {
          command: "rename",
          path: "/old-file.tsx",
          new_path: "/new-file.tsx",
        },
      };

      render(<ToolCallIndicator toolInvocation={toolInvocation} />);
      
      expect(screen.getByText("Renaming old-file.tsx to new-file.tsx")).toBeDefined();
    });

    it("shows delete message for delete command", () => {
      const toolInvocation = {
        toolName: "file_manager",
        args: {
          command: "delete",
          path: "/unused-component.tsx",
        },
      };

      render(<ToolCallIndicator toolInvocation={toolInvocation} />);
      
      expect(screen.getByText("Deleting unused-component.tsx")).toBeDefined();
    });

    it("shows generic managing message for unknown command", () => {
      const toolInvocation = {
        toolName: "file_manager",
        state: "result",
        args: {
          command: "unknown",
          path: "/some-file.ts",
        },
      };

      render(<ToolCallIndicator toolInvocation={toolInvocation} />);
      
      expect(screen.getByText("Managing some-file.ts")).toBeDefined();
    });

    it("shows generic message when no args provided", () => {
      const toolInvocation = {
        toolName: "file_manager",
      };

      render(<ToolCallIndicator toolInvocation={toolInvocation} />);
      
      expect(screen.getByText("Managing files...")).toBeDefined();
    });
  });

  describe("unknown tools", () => {
    it("formats unknown tool names by replacing underscores", () => {
      const toolInvocation = {
        toolName: "custom_unknown_tool",
        state: "result",
      };

      render(<ToolCallIndicator toolInvocation={toolInvocation} />);
      
      expect(screen.getByText("custom unknown tool")).toBeDefined();
    });
  });

  describe("loading states", () => {
    it("shows loading spinner when tool is not completed", () => {
      const toolInvocation = {
        toolName: "str_replace_editor",
        args: {
          command: "create",
          path: "/loading-file.tsx",
        },
      };

      render(<ToolCallIndicator toolInvocation={toolInvocation} />);
      
      expect(screen.getAllByTestId("loader-spinner").length).toBeGreaterThan(0);
      expect(screen.getByText("Creating loading-file.tsx")).toBeDefined();
    });

    it("shows success indicator when tool is completed", () => {
      const toolInvocation = {
        toolName: "str_replace_editor",
        state: "result",
        args: {
          command: "create",
          path: "/completed-file.tsx",
        },
      };

      render(<ToolCallIndicator toolInvocation={toolInvocation} />);
      
      expect(document.querySelector(".w-2.h-2.rounded-full.bg-emerald-500")).toBeDefined();
      expect(screen.getByText("Creating completed-file.tsx")).toBeDefined();
    });
  });

  describe("file path handling", () => {
    it("extracts filename from nested path", () => {
      const toolInvocation = {
        toolName: "str_replace_editor",
        state: "result",
        args: {
          command: "create",
          path: "/src/components/ui/Button.tsx",
        },
      };

      render(<ToolCallIndicator toolInvocation={toolInvocation} />);
      
      expect(screen.getAllByText("Creating Button.tsx").length).toBeGreaterThan(0);
    });

    it("handles root level files", () => {
      const toolInvocation = {
        toolName: "str_replace_editor",
        state: "result",
        args: {
          command: "create",
          path: "README.md",
        },
      };

      render(<ToolCallIndicator toolInvocation={toolInvocation} />);
      
      expect(screen.getByText("Creating README.md")).toBeDefined();
    });

    it("handles paths with just slashes", () => {
      const toolInvocation = {
        toolName: "str_replace_editor",
        state: "result",
        args: {
          command: "create",
          path: "/",
        },
      };

      render(<ToolCallIndicator toolInvocation={toolInvocation} />);
      
      expect(screen.getByText("Creating /")).toBeDefined();
    });
  });
});