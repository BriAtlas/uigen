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

## Database Schema
- The data base schema is defined in the @prisma/schema.prisma file. Reference it anytime you need to understand the structure of data stored in the database