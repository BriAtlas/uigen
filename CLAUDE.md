# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

UIGen is an AI-powered React component generator with live preview capabilities. It uses Claude AI to generate React components on demand, provides a virtual file system for code management, and includes a split-view interface with chat, code editor, and live preview.

## Core Architecture

### Virtual File System
- **Central Component**: `VirtualFileSystem` class in `src/lib/file-system.ts`
- **Purpose**: In-memory file system that doesn't write to disk, allowing component generation without filesystem modifications
- **Context**: `FileSystemProvider` in `src/lib/contexts/file-system-context.tsx` manages file operations across components
- **Tool Integration**: AI tools (`str_replace_editor`, `file_manager`) interact directly with the virtual file system

### Authentication & Projects
- **Database**: SQLite with Prisma ORM (schema in `prisma/schema.prisma`)
- **Models**: User and Project entities with optional authentication
- **Sessions**: JWT-based authentication in `src/lib/auth.ts`
- **Anonymous Support**: App functions without authentication, projects stored in memory only

### AI Integration
- **Provider**: Anthropic Claude via Vercel AI SDK
- **Fallback**: Mock provider when `ANTHROPIC_API_KEY` is not set
- **Chat API**: `/api/chat/route.ts` handles streaming responses with tool calling
- **Tools**: Custom tools for file management and string replacement operations

### UI Layout
- **Split View**: Resizable panels using `react-resizable-panels`
- **Left Panel**: Chat interface for AI interaction
- **Right Panel**: Toggleable between Preview (live component rendering) and Code (file tree + editor)
- **Main Component**: `MainContent` orchestrates the entire interface

## Development Commands

```bash
# Setup (install deps, generate Prisma client, run migrations)
npm run setup

# Development server with Turbopack
npm run dev

# Build production
npm run build

# Run tests (Vitest with jsdom)
npm test

# Linting
npm run lint

# Database operations
npm run db:reset  # Reset database with force
```

## Key Technical Details

### File System Integration
- Files exist only in memory via `VirtualFileSystem`
- Project data persisted as JSON in database `data` field
- Tool calls from AI directly manipulate virtual file system
- Component preview renders from virtual files using Babel standalone

### Testing Strategy
- Vitest with jsdom environment
- React Testing Library for component tests
- Test files located in `__tests__` directories alongside source

### Component Generation Flow
1. User describes component in chat
2. AI generates code using file management tools
3. Virtual file system updates trigger UI refresh
4. Preview frame renders components using in-memory files
5. For authenticated users, project state persists to database

### Development Notes
- TypeScript strict mode enabled
- Tailwind CSS v4 for styling
- Next.js 15 with App Router
- React 19 with concurrent features
- Monaco Editor for code editing with TypeScript support

## Code Writing Guidelines
- Use comments sparingly only on complex code.
- Use simple english to provide explanation for comments

## Database Schema
- The data base schema is defined in the @prisma/schema.prisma file. Reference it anytime you need to understand the structure of data stored in the database

## Development Best Practices & Lessons Learned

### Security vs Functionality Balance
- **Lesson**: Content Security Policy (CSP) headers can break essential functionality
- **Practice**: When adding security restrictions, test ALL features incrementally
- **Example**: CSP headers in `next.config.ts` blocked Monaco Editor web workers and preview iframe execution
- **Approach**: Implement security measures one at a time, testing after each change

### Avoid Over-Engineering Working Code
- **Lesson**: "Improvements" to working code often introduce new bugs
- **Practice**: If it ain't broke, don't fix it - question whether changes are truly necessary
- **Example**: Adding ErrorBoundary wrappers and extra console logging broke the preview functionality
- **Approach**: Keep working reference code when making changes, compare frequently

### State Management Complexity
- **Lesson**: Duplicate state creates race conditions and synchronization issues
- **Practice**: Prefer single source of truth, avoid redundant state management
- **Example**: Adding extra `setFiles` state alongside file system caused preview update issues
- **Approach**: Use existing patterns and avoid introducing parallel state systems

### Configuration File Impact
- **Lesson**: Changes to configuration files (next.config.ts, package.json) have wide-reaching effects
- **Practice**: Test all functionality after configuration changes
- **Example**: next.config.ts CSP changes affected both Monaco Editor and preview rendering
- **Approach**: Document configuration dependencies and test comprehensively

### Debugging Strategy
- **Lesson**: Compare working vs broken versions systematically
- **Practice**: Always maintain a working reference when refactoring
- **Example**: Comparing UIGEN2 (working) vs UIGEN (broken) revealed exact differences
- **Approach**: Make incremental changes and test each one rather than batch changes

### Component Architecture Principles
- **Lesson**: Simple, focused components are more reliable than complex wrapper components
- **Practice**: Avoid unnecessary abstraction layers and error boundaries unless specifically needed
- **Example**: PreviewFrame worked better as a direct component rather than wrapped in ErrorBoundary
- **Approach**: Start simple and add complexity only when proven necessary

### Testing After Changes
- **Lesson**: Even small changes can have unexpected side effects
- **Practice**: Test core functionality after every significant change
- **Critical Features**: Always verify preview rendering, file system operations, and Monaco Editor after modifications
- **Approach**: Have a standard set of manual tests for core features