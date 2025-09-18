import type { Topic } from './types';

export const MOCK_TOPICS: Topic[] = [
  {
    id: 'topic-1',
    name: 'Q3 Marketing Strategy',
    currentBranchId: 'branch-1-1',
    branches: [
      {
        id: 'branch-1-1',
        name: 'Main Discussion',
        parentId: null,
        position: { x: 100, y: 200 },
        createdAt: '2025-01-01T10:00:00Z',
        messages: [
          { id: 'msg-1-1', author: 'user', content: 'Let\'s brainstorm the Q3 marketing strategy. What are our primary goals?', timestamp: '10:00 AM' },
          { id: 'msg-1-2', author: 'ai', content: 'Primary goals for Q3 could be: 1. Increase user acquisition by 15%. 2. Improve user engagement on the platform. 3. Launch the new "Synapse" feature.', timestamp: '10:01 AM' },
        ]
      },
      {
        id: 'branch-1-2',
        name: 'User Acquisition Strategy',
        parentId: 'branch-1-1',
        position: { x: 400, y: 100 },
        createdAt: '2025-01-01T10:03:00Z',
        messages: [
          // 复制父分支的消息历史
          { id: 'msg-1-1', author: 'user', content: 'Let\'s brainstorm the Q3 marketing strategy. What are our primary goals?', timestamp: '10:00 AM' },
          { id: 'msg-1-2', author: 'ai', content: 'Primary goals for Q3 could be: 1. Increase user acquisition by 15%. 2. Improve user engagement on the platform. 3. Launch the new "Synapse" feature.', timestamp: '10:01 AM' },
          // 分支特有的消息
          { id: 'msg-1-3', author: 'user', content: 'Okay, for user acquisition, what channels should we focus on?', timestamp: '10:03 AM' },
          { id: 'msg-1-4', author: 'ai', content: 'Based on past performance, paid social (Instagram, TikTok) and content marketing (blog posts, tutorials) have the highest ROI.', timestamp: '10:04 AM' },
          { id: 'msg-1-5', author: 'user', content: 'Let\'s explore the content marketing angle further.', timestamp: '10:05 AM' },
        ]
      },
      {
        id: 'branch-1-3',
        name: 'Synapse Feature Launch',
        parentId: 'branch-1-1',
        position: { x: 400, y: 300 },
        createdAt: '2025-01-01T10:02:00Z',
        messages: [
          // 复制父分支的消息历史
          { id: 'msg-1-1', author: 'user', content: 'Let\'s brainstorm the Q3 marketing strategy. What are our primary goals?', timestamp: '10:00 AM' },
          { id: 'msg-1-2', author: 'ai', content: 'Primary goals for Q3 could be: 1. Increase user acquisition by 15%. 2. Improve user engagement on the platform. 3. Launch the new "Synapse" feature.', timestamp: '10:01 AM' },
          // 分支特有的消息
          { id: 'msg-1-6', author: 'user', content: 'What are some campaign ideas for the "Synapse" feature launch?', timestamp: '10:02 AM' },
        ]
      }
    ]
  },
  {
    id: 'topic-2',
    name: 'New Feature Brainstorm',
    currentBranchId: null,
    branches: []
  },
  {
    id: 'topic-3',
    name: 'Personal Journal',
    currentBranchId: 'branch-3-1',
    branches: [
      {
        id: 'branch-3-1',
        name: 'Daily Thoughts',
        parentId: null,
        position: { x: 100, y: 150 },
        createdAt: '2025-01-01T20:00:00Z',
        messages: [
          { id: 'msg-3-1', author: 'user', content: 'Today was a productive day. I managed to finish the prototype for the Synapse app.', timestamp: '08:00 PM' }
        ]
      }
    ]
  }
];

// FIX: Use the recommended 'gemini-2.5-flash' model and remove other models.
export const AI_MODELS = [
    'gemini-2.5-flash'
];