# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Development:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

**Setup:**
- `npm install` - Install dependencies
- Create `.env.local` with `GEMINI_API_KEY=your_key_here`

## Architecture Overview

**Tech Stack:**
- React 19 + TypeScript + Vite (ESM modules)
- Google Gemini AI (@google/genai) with gemini-2.5-flash model
- React Flow (@xyflow/react) for canvas visualization
- Tailwind CSS for styling
- No external state management - pure React useState

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
2. Branch message history converted to Gemini format (role: 'user'|'model')
3. AI response appended to same branch messages
4. Error handling with fallback error messages

**Canvas System:**
- Automatic layout calculation based on parent-child branch relationships
- Position calculation with horizontal/vertical layout modes
- Non-draggable nodes with click navigation to chat view
- Edge rendering adapts to layout (straight/smoothstep)
- Empty state messaging for new topics

## Development Notes

**Environment & Build:**
- Vite config injects GEMINI_API_KEY as process.env.API_KEY and process.env.GEMINI_API_KEY
- TypeScript with @/* path alias pointing to project root
- No test framework configured

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