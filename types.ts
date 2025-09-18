
export interface Message {
  id: string;
  author: 'user' | 'ai';
  content: string;
  timestamp: string;
}

export interface BranchNode {
  id: string;
  name: string; // 分支名称
  parentId: string | null; // 父分支ID
  messages: Message[]; // 该分支内的所有消息
  position: { x: number; y: number };
  isNew?: boolean; // For highlighting new branches
  createdAt: string;
}

export interface Topic {
  id: string;
  name: string;
  branches: BranchNode[]; // 分支列表（代替nodes和messages）
  currentBranchId: string | null; // 当前选中的分支
}

// 保持向后兼容的别名，方便逐步迁移
export type NodeData = BranchNode;
