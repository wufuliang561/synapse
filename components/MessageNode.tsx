import React from 'react';
import { Handle, Position, type Node } from '@xyflow/react';
import { SparklesIcon } from './icons';
import type { BranchNode } from '../types';

export interface BranchNodeData extends BranchNode {
  lastMessagePreview: string;
  messageCount: number;
  isCurrentBranch: boolean;
  layout?: 'horizontal' | 'vertical';
}

export type BranchNodeType = Node<BranchNodeData>;

interface BranchNodeProps {
  data: BranchNodeData;
  selected?: boolean;
}

const BranchNodeComponent: React.FC<BranchNodeProps> = ({ data, selected }) => {
  const highlightClass = data.isNew
    ? 'ring-4 ring-blue-500 ring-opacity-70 animate-pulse'
    : data.isCurrentBranch
    ? 'ring-2 ring-blue-400 bg-blue-50'
    : selected
    ? 'ring-2 ring-slate-400'
    : 'ring-1 ring-slate-200';

  // 根据布局模式设置连接点位置
  const isHorizontal = data.layout === 'horizontal';
  const inputPosition = isHorizontal ? Position.Left : Position.Top;
  const outputPosition = isHorizontal ? Position.Right : Position.Bottom;

  return (
    <div className={`bg-white rounded-lg shadow-md hover:shadow-xl cursor-pointer transition-all duration-300 w-48 p-3 ${highlightClass}`}>
      {/* 输入连接点 */}
      <Handle
        type="target"
        position={inputPosition}
        style={{ background: '#64748b', width: 8, height: 8 }}
      />

      {/* 分支标题 */}
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-slate-800 truncate flex-1">
          {data.name}
        </h4>
        {data.isCurrentBranch && (
          <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 flex-shrink-0"></div>
        )}
      </div>

      {/* AI模型和消息数量 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1">
          <SparklesIcon className="w-3 h-3 text-purple-500" />
          <span className="text-xs font-medium text-purple-600">
            Gemini 2.5 Flash
          </span>
        </div>
        <span className="text-xs text-slate-500">
          {data.messageCount} msg{data.messageCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* 最后消息预览 */}
      <p className="text-xs text-slate-600 line-clamp-2 h-8 overflow-hidden">
        {data.lastMessagePreview || 'No messages yet'}
      </p>

      {/* 输出连接点 */}
      <Handle
        type="source"
        position={outputPosition}
        style={{ background: '#64748b', width: 8, height: 8 }}
      />
    </div>
  );
};

export default BranchNodeComponent;