import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  type Node,
  type Edge,
  type OnNodeClick,
  type ReactFlowInstance,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import type { Topic, BranchNode } from '../types';
import { LayoutHorizontalIcon, LayoutVerticalIcon, SparklesIcon } from './icons';
import BranchNodeComponent, { type BranchNodeData } from './MessageNode';

// Constants for layout calculation
const NODE_WIDTH = 192; // Corresponds to w-48
const NODE_HEIGHT = 88; // Approximated height
const HORIZONTAL_GAP = 120; // 增加水平间距
const VERTICAL_GAP = 80; // 增加垂直间距

type Layout = 'horizontal' | 'vertical';

const nodeTypes = {
  branchNode: BranchNodeComponent,
};

interface CanvasViewProps {
  topic: Topic | null;
  onBranchClick: (branchId: string) => void;
  layout: Layout;
  onLayoutChange: (layout: Layout) => void;
}

const CanvasView: React.FC<CanvasViewProps> = ({
  topic,
  onBranchClick,
  layout,
  onLayoutChange,
}) => {
  if (!topic) {
    return (
      <div className="flex-1 w-full h-full relative bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">No topic selected.</p>
      </div>
    );
  }

  const { branches } = topic;

  // 计算布局位置 - 现在基于分支而不是消息节点
  const calculatedPositions = useMemo(() => {
    if (!branches.length) return new Map();

    const childrenMap = new Map<string, string[]>();
    const branchSet = new Set(branches.map(b => b.id));
    const rootIds: string[] = [];

    branches.forEach(branch => {
      if (branch.parentId && branchSet.has(branch.parentId)) {
        if (!childrenMap.has(branch.parentId)) {
          childrenMap.set(branch.parentId, []);
        }
        childrenMap.get(branch.parentId)!.push(branch.id);
      } else {
        rootIds.push(branch.id);
      }
    });

    const positions = new Map<string, { x: number; y: number }>();
    const subtreeSize = new Map<string, number>();

    function calculateSubtreeSize(branchId: string): number {
      const children = childrenMap.get(branchId) || [];
      const gap = layout === 'horizontal' ? VERTICAL_GAP : HORIZONTAL_GAP;
      const nodeSize = layout === 'horizontal' ? NODE_HEIGHT : NODE_WIDTH;

      if (children.length === 0) {
        subtreeSize.set(branchId, nodeSize);
        return nodeSize;
      }

      let totalSize = children.reduce((acc, childId) => acc + calculateSubtreeSize(childId), 0);
      totalSize += (children.length - 1) * gap;
      subtreeSize.set(branchId, totalSize);
      return totalSize;
    }

    function assignPositions(branchId: string, depth: number, startPos: number) {
      const parentSubtreeSize = subtreeSize.get(branchId) || 0;
      let x, y;

      if (layout === 'horizontal') {
        x = depth * (NODE_WIDTH + HORIZONTAL_GAP);
        y = startPos + parentSubtreeSize / 2 - NODE_HEIGHT / 2;
      } else {
        x = startPos + parentSubtreeSize / 2 - NODE_WIDTH / 2;
        y = depth * (NODE_HEIGHT + VERTICAL_GAP);
      }
      positions.set(branchId, { x, y });

      let childStartPos = startPos;
      const children = childrenMap.get(branchId) || [];
      const gap = layout === 'horizontal' ? VERTICAL_GAP : HORIZONTAL_GAP;
      children.forEach(childId => {
        assignPositions(childId, depth + 1, childStartPos);
        childStartPos += (subtreeSize.get(childId) || 0) + gap;
      });
    }

    let currentOffset = 0;
    const rootGap = layout === 'horizontal' ? VERTICAL_GAP * 2 : HORIZONTAL_GAP * 2;
    rootIds.forEach(rootId => {
      const rootSize = calculateSubtreeSize(rootId);
      assignPositions(rootId, 0, currentOffset);
      currentOffset += rootSize + rootGap;
    });

    return positions;
  }, [branches, layout]);

  // 转换为 React Flow 节点格式 - 现在基于分支
  const flowNodes: Node<BranchNodeData>[] = useMemo(() => {
    return branches.map(branch => {
      const position = calculatedPositions.get(branch.id);

      if (!position) return null;

      // 获取分支的最后一条消息作为预览
      const lastMessage = branch.messages[branch.messages.length - 1];
      const isCurrentBranch = branch.id === topic.currentBranchId;

      return {
        id: branch.id,
        type: 'branchNode',
        position,
        data: {
          ...branch,
          lastMessagePreview: lastMessage ? lastMessage.content : '',
          messageCount: branch.messages.length,
          isCurrentBranch,
          layout, // 传递布局模式
        },
        draggable: false, // 禁用拖拽
        selectable: true,
      };
    }).filter(Boolean) as Node<BranchNodeData>[];
  }, [branches, calculatedPositions, topic.currentBranchId, layout]);

  // 转换为 React Flow 边格式 - 现在基于分支关系
  const flowEdges: Edge[] = useMemo(() => {
    return branches
      .filter(branch => branch.parentId)
      .map(branch => ({
        id: `${branch.parentId}-${branch.id}`,
        source: branch.parentId!,
        target: branch.id,
        type: layout === 'horizontal' ? 'straight' : 'smoothstep', // 水平布局使用直线
        animated: false,
        style: {
          stroke: '#cbd5e1',
          strokeWidth: 2,
        },
        markerEnd: {
          type: 'arrowclosed',
          color: '#cbd5e1',
        },
      }));
  }, [branches, layout]);

  const [reactFlowNodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [reactFlowEdges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  // 当数据变化时更新 React Flow 状态
  React.useEffect(() => {
    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [flowNodes, flowEdges, setNodes, setEdges]);

  // 处理分支节点点击
  const handleNodeClick: OnNodeClick = useCallback((event, node) => {
    onBranchClick(node.id);
  }, [onBranchClick]);

  return (
    <div className="flex-1 w-full h-full relative bg-slate-50">
      <div className="absolute top-4 left-4 text-slate-400 text-sm z-10">
        Canvas Mode
      </div>
      <div className="absolute top-4 right-4 z-10 flex items-center space-x-1 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
        <button
          onClick={() => onLayoutChange('horizontal')}
          className={`p-1.5 rounded-md ${layout === 'horizontal' ? 'bg-blue-500 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
        >
          <LayoutVerticalIcon className="w-5 h-5" />
        </button>
        <button
          onClick={() => onLayoutChange('vertical')}
          className={`p-1.5 rounded-md ${layout === 'vertical' ? 'bg-blue-500 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
        >
          <LayoutHorizontalIcon className="w-5 h-5" />
        </button>
      </div>

      {branches.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-slate-800 mb-2">Canvas is empty</h3>
            <p className="text-slate-500 mb-4">Start a conversation in Chat to create your first branch.</p>
            <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
              <SparklesIcon className="w-4 h-4" />
              <span>Your conversation will appear as nodes here</span>
            </div>
          </div>
        </div>
      ) : (
        <ReactFlow
          nodes={reactFlowNodes}
          edges={reactFlowEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          nodeTypes={nodeTypes}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={true}
          fitView
          fitViewOptions={{
            padding: 0.2,
            includeHiddenNodes: false,
          }}
          minZoom={0.5}
          maxZoom={2}
          attributionPosition="bottom-left"
        >
          <Controls />
          <Background color="#f1f5f9" gap={16} />
        </ReactFlow>
      )}
    </div>
  );
};

export default CanvasView;