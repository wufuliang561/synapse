# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Development:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

**Setup:**
- `npm install` - Install dependencies
- Copy `.env.local.template` to `.env.local` and configure required environment variables

**Required Environment Variables:**
- `OPENROUTER_API_KEY` - OpenRouter API key for AI model access
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for API authentication)

## Architecture Overview

**Tech Stack:**
- React 19 + TypeScript + Vite (ESM modules)
- Supabase (authentication & database with Row Level Security)
- OpenRouter AI (openai package) with multiple model support (GPT-5, Claude, Gemini, DeepSeek)
- React Flow (@xyflow/react) for canvas visualization
- Tailwind CSS for styling
- Vercel deployment with serverless API functions

**Data Architecture:**
- **Database Layer**: Supabase with RLS policies for user data isolation
- **Frontend Layer**: React state management (useState) with message caching
- **API Layer**: Authenticated Vercel serverless functions

**Core Data Model:**
- `Topic` - Workspace container (stored in Supabase `topics` table)
- `BranchNode` - Conversation branch (stored in Supabase `branches` table)
- `Message` - Individual chat messages (stored in Supabase `messages` table)
- **Database Hierarchy**: users → topics → branches → messages
- **Frontend Hierarchy**: Topic → BranchNode → Message (loaded dynamically)

**Key Components:**
- `App.tsx` - Root component managing topics, branches, AI interactions, view state
- `ChatView.tsx` - Linear chat interface for current branch messages
- `CanvasView.tsx` - Node graph visualization using React Flow
- `Sidebar.tsx` - Topic management and selection
- `MessageNode.tsx` - Custom React Flow node (BranchNodeComponent)
- `BranchModal.tsx` - Branch creation modal

**State Architecture:**
- **App.tsx**: Central state management with useState hooks
  - `topics` - Array of TopicWithBranches from Supabase
  - `branchMessages` - Record<string, Message[]> for message caching
  - `selectedTopicId` + view state ('chat' | 'canvas')
- **Services Layer**: Database operations through service classes
  - `topicsService` - Topic CRUD operations
  - `branchesService` - Branch management
  - `messagesService` - Message operations with caching
  - `authService` - Authentication flow

**AI Integration Flow:**
1. User message added to current branch messages array
2. Branch message history converted to OpenAI format (role: 'user'|'assistant')
3. Get current user session and JWT token for authentication
4. Request sent to OpenRouter API with selected model and Authorization header
5. Server verifies JWT token with Supabase before processing
6. AI response appended to same branch messages
7. Error handling with authentication and API error messages

**Canvas System:**
- Automatic layout calculation based on parent-child branch relationships
- Position calculation with horizontal/vertical layout modes
- Non-draggable nodes with click navigation to chat view
- Edge rendering adapts to layout (straight/smoothstep)
- Empty state messaging for new topics

## Development Notes

**Critical Implementation Details:**

**Message Loading Strategy:**
- Messages are NOT preloaded with topics/branches to optimize performance
- `branchMessages` state provides client-side caching: Record<branchId, Message[]>
- Messages loaded on-demand when switching branches via `loadBranchMessages()`
- Data format conversion: DB format (`author: 'assistant'`) → App format (`author: 'ai'`)

**Authentication Flow:**
- Protected routes via `<ProtectedRoute>` wrapper around main app
- JWT tokens automatically sent with all API requests via Authorization header
- API endpoints verify tokens using Supabase service role key before processing
- Session persistence handled by Supabase client with automatic refresh

**Branch Creation Logic:**
- New topics auto-create "Main Discussion" branch on first message
- Branch creation copies parent messages up to specified message (or all)
- New branches positioned relative to parent with offset calculations
- AI automatically responds to new branches using copied message history

**Canvas System Architecture:**
- Tree traversal algorithm calculates branch positions based on parent-child relationships
- Custom React Flow nodes (`BranchNodeComponent`) display branch metadata
- Layout modes: horizontal/vertical with automatic position offsets
- Non-draggable nodes focus on conversation flow rather than manual positioning

**Data Synchronization Pattern:**
- App.tsx orchestrates all state mutations across database and UI
- After DB operations: `await loadTopics()` + `setBranchMessages()` to refresh state
- Service layer handles Supabase operations with automatic error handling
- No optimistic updates - always confirm with database before UI update

**Security & Authentication:**
- JWT-based authentication using Supabase
- Row Level Security (RLS) policies on all database tables
- AI API endpoints require valid JWT tokens
- Session management with automatic token refresh
- Protected routes prevent unauthorized access

**Deployment:**
- Configured for Vercel with `vercel.json`
- Frontend built with Vite, deployed as static assets
- API functions use Node.js 18.x runtime
- Required environment variables in Vercel settings:
  - `OPENROUTER_API_KEY` - OpenRouter API access
  - `SUPABASE_SERVICE_ROLE_KEY` - JWT token verification
  - `VITE_SUPABASE_URL` - Supabase project URL
  - `VITE_SUPABASE_ANON_KEY` - Supabase anon key
- Model selection available: GPT-5, Claude 3.5 Sonnet, Gemini 2.0 Flash, DeepSeek (free models available)
- View live app: https://ai.studio/apps/drive/1-vtkbF47ATQ-vF2H_CyMqVzDHfWGpinn