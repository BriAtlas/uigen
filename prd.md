# UIGen - AI-Powered React Component Generator Product Requirements Document

**Version:** 1.0  
**Date:** July 25, 2025  
**Document Purpose:** This PRD documents the existing UIGen application, an AI-powered React component generator built as a demonstration project for an Anthropic course on AI-assisted coding.

## Product overview

UIGen is a web-based development tool that enables developers to generate React components through natural language conversations with Claude AI. The project serves as an educational demonstration of AI integration in software development workflows, showcasing how developers can leverage conversational AI to accelerate component creation and prototyping.

### Product summary

The project provides a split-panel interface where users can describe components in natural language through a chat interface, receive AI-generated React code, and immediately preview the results in a live rendering environment. All code exists in a virtual file system that operates entirely in memory, making it safe for experimentation without affecting the local filesystem.

## Goals

### Business goals

- Demonstrate practical AI integration patterns for software development tools
- Showcase Claude AI's capabilities for code generation and development assistance
- Provide an educational resource for developers learning AI-assisted coding techniques
- Illustrate best practices for building AI-powered development environments

### User goals

- Learn how AI can accelerate React component development workflows
- Experiment with component generation without setup overhead or filesystem concerns
- Understand conversational AI patterns for technical assistance
- Explore live preview capabilities for rapid prototyping

### Non-goals

- Production deployment as a commercial development tool
- Complex project management or collaboration features
- Integration with external deployment platforms
- Advanced component library management or versioning

## User personas

### Primary developer learner

**Profile:** Software developers taking the Anthropic course on AI-assisted coding
**Experience Level:** Intermediate to advanced React developers
**Goals:** Learn AI integration patterns, understand conversational interfaces for development
**Pain Points:** Limited experience with AI tools, uncertainty about AI code generation reliability

### Secondary educator/instructor  

**Profile:** Technical instructors and course creators
**Experience Level:** Senior developers and technical educators
**Goals:** Demonstrate AI capabilities, provide hands-on learning experiences
**Pain Points:** Need concrete examples of AI integration, require reliable demonstration tools

### Role-based access

- **Anonymous users:** Full access to component generation with session-based storage
- **Authenticated users:** Persistent project storage, project management capabilities
- **No administrative roles:** Single-tier user access model

## Functional requirements

### Core component generation (Priority: High)
- AI-powered React component creation through natural language prompts
- Real-time streaming responses from Claude AI
- Support for complex component specifications including props, state, and styling
- Automatic handling of imports and dependencies

### Virtual file system management (Priority: High)
- In-memory file storage without filesystem writes
- Complete CRUD operations for files and directories
- File tree navigation and organization
- Support for multiple file types (JSX, JS, CSS, etc.)

### Live preview rendering (Priority: High)
- Real-time component preview using Babel standalone compilation
- Error handling and display for compilation issues
- Hot reloading when files change
- Isolated execution environment for safety

### Code editing capabilities (Priority: Medium)
- Monaco Editor integration with TypeScript support
- Syntax highlighting and error detection
- Code formatting and basic IDE features
- File tree management with create, rename, delete operations

### User authentication system (Priority: Medium)
- Optional JWT-based authentication
- User registration and login workflows
- Password hashing with bcrypt
- Session management and token refresh

### Project persistence (Priority: Medium)
- SQLite database storage for authenticated users
- Project serialization and deserialization
- Multiple project management per user
- Automatic project saving and loading

### Chat interface (Priority: Low)
- Conversational UI for AI interaction
- Message history and persistence
- Markdown rendering for formatted responses
- Tool call indicators for transparency

## User experience

### Entry points

**Anonymous access:** Users can immediately start generating components without any registration or setup. The application loads with an empty project and full functionality available.

**Authenticated access:** Returning users are redirected to their most recent project or a new project is automatically created if none exist.

### Core experience

The primary workflow centers around a three-panel interface:

1. **Chat panel (left):** Users describe desired components in natural language
2. **Preview panel (right, default):** Live rendering of generated components
3. **Code panel (right, toggle):** File tree and Monaco editor for direct code manipulation

Users can seamlessly switch between preview and code views, with all changes reflected immediately across both interfaces.

### Advanced features

- **File management:** Direct manipulation of the virtual file system through the code panel
- **Project switching:** Authenticated users can create and switch between multiple projects
- **Code editing:** Full IDE-like experience with syntax highlighting and error detection
- **Export capabilities:** Users can copy generated code for use in external projects

### UI/UX highlights

- **Responsive split-panel layout** with resizable sections for optimal viewing
- **Clean, minimal design** focusing on content and functionality
- **Real-time feedback** with streaming AI responses and live preview updates
- **Error boundaries** providing graceful failure handling and recovery

## Narrative

As a developer exploring AI-assisted coding, I open UIGen and immediately see a clean interface with a chat panel and preview area. I type "Create a responsive card component with an image, title, and description" and watch as Claude generates the code in real-time. The component appears instantly in the preview panel, fully rendered and interactive. I can switch to the code view to see the generated files, make manual adjustments using the built-in editor, and watch my changes update live in the preview. The entire experience feels seamless and educational, helping me understand both the capabilities of AI code generation and the patterns for building such systems.

## Success metrics

### User-centric metrics

- **Session duration:** Average time spent exploring and generating components
- **Component generation success rate:** Percentage of prompts resulting in functional components
- **Feature adoption:** Usage patterns across chat, preview, and code editing features
- **Learning progression:** User ability to create increasingly complex components over time

### Business metrics

- **Educational effectiveness:** Successful demonstration of AI integration patterns
- **Course completion rates:** Impact on Anthropic course engagement and completion
- **Knowledge transfer:** User understanding of conversational AI development practices
- **Technical demonstration success:** Reliability during presentations and demonstrations

### Technical metrics

- **System reliability:** Uptime and error rates during user sessions
- **Response time:** AI generation speed and preview rendering performance
- **Code quality:** Syntactic correctness and functional accuracy of generated components
- **Virtual file system performance:** Operations per second and memory efficiency

## Technical considerations

### Integration points

- **Anthropic Claude API:** Primary AI service for code generation via Vercel AI SDK
- **Mock AI provider:** Fallback system when API keys are unavailable
- **Babel standalone:** Client-side JavaScript compilation for preview rendering
- **Monaco Editor:** Web-based code editor with TypeScript language services

### Data storage and privacy

- **Anonymous sessions:** All data stored in browser memory, no server persistence
- **Authenticated sessions:** Project data stored as JSON in SQLite database
- **Password security:** bcrypt hashing with secure salt generation
- **No external data sharing:** All processing occurs within the application boundary

### Scalability and performance

- **Memory management:** Virtual file system optimized for browser memory constraints
- **Compilation performance:** Babel standalone execution limited to reasonable component sizes
- **Database efficiency:** SQLite with Prisma ORM for optimal query performance
- **Client-side rendering:** Preview generation occurs entirely in browser for scalability

### Potential challenges

- **Browser memory limits:** Large projects may exceed browser capabilities
- **Compilation errors:** Complex components may fail Babel compilation
- **AI service availability:** Dependency on external Claude API for core functionality
- **Security considerations:** Code execution in browser requires careful sandboxing

## Milestones & sequencing

### Project estimate
**Total development time:** 6-8 weeks  
**Team size:** 2-3 developers (1 frontend, 1 full-stack, 1 AI integration specialist)

### Phase 1: Core foundation (Weeks 1-2)
- Virtual file system implementation
- Basic React component structure
- Anthropic Claude API integration
- Simple chat interface

### Phase 2: Component generation (Weeks 3-4)
- AI tool calling system
- File management tools for AI
- Basic preview rendering with Babel
- Error handling and boundaries

### Phase 3: User interface (Weeks 5-6)
- Monaco Editor integration
- Resizable panel system
- File tree navigation
- Preview/code view toggling

### Phase 4: Authentication and persistence (Weeks 7-8)
- User authentication system
- Database schema and migrations
- Project management features
- Session handling and security

## User stories

### US-001: Anonymous component generation
**Description:** As an anonymous user, I want to generate React components through natural language prompts without requiring registration  
**Acceptance Criteria:**
- User can access the application without authentication
- Chat interface accepts natural language component descriptions
- AI generates functional React components based on prompts
- Generated components appear immediately in preview panel
- Session data persists in browser memory during use

### US-002: Live component preview
**Description:** As a user, I want to see generated components rendered live so I can immediately evaluate the results  
**Acceptance Criteria:**
- Preview panel displays components in real-time as they are generated
- Components render with proper styling and functionality
- Preview updates automatically when code changes
- Error states display clearly when components fail to compile
- Preview environment is isolated and secure

### US-003: Virtual file system management
**Description:** As a user, I want to manage files in a virtual environment that doesn't affect my local system  
**Acceptance Criteria:**
- All files exist only in browser memory
- File operations (create, read, update, delete) work correctly
- Directory structure is maintained and navigable
- File changes trigger appropriate UI updates
- System prevents any actual filesystem writes

### US-004: Code editing capabilities
**Description:** As a user, I want to directly edit generated code using a professional code editor  
**Acceptance Criteria:**
- Monaco Editor provides syntax highlighting for React/JavaScript
- Code completion and error detection work properly
- File tree allows navigation between multiple files
- Code changes update the preview in real-time
- Editor supports standard keyboard shortcuts and functionality

### US-005: Split-panel interface
**Description:** As a user, I want to use a split-panel interface that allows me to chat with AI while viewing results  
**Acceptance Criteria:**
- Left panel contains chat interface for AI interaction
- Right panel toggles between preview and code views
- Panels are resizable for optimal viewing
- Interface is responsive across different screen sizes
- Panel states persist during the session

### US-006: User registration and authentication
**Description:** As a user, I want to create an account to save my projects across sessions  
**Acceptance Criteria:**
- Registration form accepts email and password
- Password requirements are enforced and communicated
- Login form authenticates users securely
- JWT tokens are generated and managed properly
- Authentication state persists across browser sessions

### US-007: Project persistence
**Description:** As an authenticated user, I want my projects to be saved automatically so I can return to them later  
**Acceptance Criteria:**
- Projects are automatically saved to database
- Users can create multiple projects
- Project list shows recent projects with metadata
- Users are redirected to their most recent project on login
- Virtual file system state is preserved in project data

### US-008: AI streaming responses
**Description:** As a user, I want to see AI responses as they are generated rather than waiting for completion  
**Acceptance Criteria:**
- Chat messages stream in real-time during generation
- Tool calls are indicated visually during execution
- Users can see progress of file operations as they occur
- Streaming can be interrupted if needed
- Complete messages are properly formatted when finished

### US-009: Error handling and recovery
**Description:** As a user, I want clear error messages and recovery options when things go wrong  
**Acceptance Criteria:**
- Component compilation errors are displayed clearly
- AI service failures show appropriate fallback messages
- File operation errors provide specific feedback
- Error boundaries prevent application crashes
- Users can recover from error states without losing work

### US-010: Component generation with dependencies
**Description:** As a user, I want to generate components that can use common libraries and handle complex requirements  
**Acceptance Criteria:**
- Generated components can import and use React hooks
- Common styling approaches (CSS modules, styled-components) are supported
- Components can accept and use props appropriately
- Generated code follows React best practices
- Complex component structures (forms, data display) work correctly

### US-011: File tree operations
**Description:** As a user, I want to create, rename, and delete files and folders through the file tree interface  
**Acceptance Criteria:**
- Right-click context menu provides file operations
- New files and folders can be created with appropriate naming
- Rename operations update references and maintain structure
- Delete operations remove files safely with confirmation
- File tree updates immediately after operations

### US-012: Project management
**Description:** As an authenticated user, I want to manage multiple projects and switch between them easily  
**Acceptance Criteria:**
- Header actions provide access to project management
- Users can create new projects with custom names
- Project list shows all user projects with metadata
- Switching projects loads the correct virtual file system state
- Project deletion removes all associated data

### US-013: Chat message history
**Description:** As a user, I want to see the history of my conversation with the AI within each project  
**Acceptance Criteria:**
- Chat messages are preserved when switching views
- Message history persists across authenticated sessions
- Messages display proper formatting and timestamps
- Tool call results are shown inline with messages
- Chat can be scrolled to review previous interactions

### US-014: Export functionality
**Description:** As a user, I want to copy or export generated code for use in external projects  
**Acceptance Criteria:**
- Individual files can be copied to clipboard
- File contents include proper imports and formatting
- Export preserves directory structure information
- Generated code works correctly in external React projects
- Users receive confirmation when copying succeeds

### US-015: Secure authentication
**Description:** As a user, I want my account credentials to be stored securely with industry-standard practices  
**Acceptance Criteria:**
- Passwords are hashed using bcrypt with appropriate salt rounds
- JWT tokens include proper expiration and security claims
- Session refresh handles token renewal automatically
- Login attempts are rate-limited to prevent abuse
- Password requirements enforce reasonable security standards