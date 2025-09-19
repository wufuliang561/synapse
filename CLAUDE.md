# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Development:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

**Setup:**
- `npm install` - Install dependencies
- Create `.env.local` with `OPENROUTER_API_KEY=your_key_here`

**API/Backend:**
- API functions located in `/api/` directory (Vercel serverless functions)
- `api/chat.ts` - OpenRouter AI chat endpoint using Node.js runtime, supports multiple models
- Deployed with Vercel configuration in `vercel.json`

## Architecture Overview

**Tech Stack:**
- React 19 + TypeScript + Vite (ESM modules)
- OpenRouter AI (openai package) with multiple model support (GPT-5, Claude, Gemini, DeepSeek)
- React Flow (@xyflow/react) for canvas visualization
- Tailwind CSS for styling
- No external state management - pure React useState
- Vercel deployment with serverless API functions

**Core Data Model:**
- `Topic` - Workspace container with branches array and currentBranchId
- `BranchNode` - Conversation branch containing messages array, position, parentId
- `Message` - Individual chat messages (user/ai) with id, content, timestamp
- Data hierarchy: Topic → BranchNode → Message

**Key Components:**
- `App.tsx` - Root component managing topics, branches, AI interactions, view state
- `ChatView.tsx` - Linear chat interface for current branch messages
- `CanvasView.tsx` - Node graph visualization using React Flow
- `Sidebar.tsx` - Topic management and selection
- `MessageNode.tsx` - Custom React Flow node (BranchNodeComponent)
- `BranchModal.tsx` - Branch creation modal

**State Architecture:**
- Single state tree in App.tsx using useState hooks
- Topics array contains all workspace data
- selectedTopicId + currentBranchId track active conversation
- View state ('chat' | 'canvas') and layout ('horizontal' | 'vertical')

**AI Integration Flow:**
1. User message added to current branch messages array
2. Branch message history converted to OpenAI format (role: 'user'|'assistant')
3. Request sent to OpenRouter API with selected model
4. AI response appended to same branch messages
5. Error handling with fallback error messages

**Canvas System:**
- Automatic layout calculation based on parent-child branch relationships
- Position calculation with horizontal/vertical layout modes
- Non-draggable nodes with click navigation to chat view
- Edge rendering adapts to layout (straight/smoothstep)
- Empty state messaging for new topics

## Development Notes

**Environment & Build:**
- Vite config injects OPENROUTER_API_KEY as process.env.OPENROUTER_API_KEY
- TypeScript with @/* path alias pointing to project root
- No test framework configured
- Project structure: components in root-level `/components/`, main App.tsx in root
- API endpoints in `/api/` for Vercel serverless deployment
- Build output to `/dist/` directory

**Branch Creation Logic:**
- New topics auto-create "Main Discussion" branch on first message
- Branch creation copies parent messages up to specified message (or all)
- New branches positioned relative to parent with offset calculations
- AI automatically responds to new branches using copied message history

**Key Implementation Details:**
- Canvas layout uses tree traversal for position calculation
- Branch nodes show: name, message count, last message preview, current status
- View auto-switching: empty topics → chat, branch creation → canvas
- Sidebar toggle with smooth transitions
- Mock data in constants.ts for development

**Component Data Flow:**
- App.tsx handles all state mutations (topic/branch/message CRUD)
- Props drilling for callbacks (onSendMessage, onCreateBranch, onBranchClick)
- Canvas nodes use custom BranchNodeData interface extending BranchNode
- Message history inheritance ensures conversation continuity across branches

**Deployment:**
- Configured for Vercel with `vercel.json`
- Frontend built with Vite, deployed as static assets
- API functions use Node.js 18.x runtime
- Environment variable `OPENROUTER_API_KEY` required in Vercel settings
- Model selection available: GPT-5, Claude 3.5 Sonnet, Gemini 2.0 Flash, DeepSeek (free models available)
- View live app: https://ai.studio/apps/drive/1-vtkbF47ATQ-vF2H_CyMqVzDHfWGpinn