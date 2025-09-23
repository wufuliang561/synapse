import React, { useState, useMemo, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GoogleGenAI } from '@google/genai';
import Sidebar from './components/Sidebar';
import ChatView from './components/ChatView';
import CanvasView from './components/CanvasView';
import { AuthProvider } from './contexts/AuthContext';
import { AuthModal } from './components/Auth/AuthModal';
import { UserMenu } from './components/Auth/UserMenu';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import { useAuth } from './contexts/AuthContext';
import { MOCK_TOPICS } from './constants';
import type { Topic, Message, BranchNode } from './types';
import { ChevronLeftIcon } from './components/icons';

// FIX: Initialize GoogleGenAI with a named apiKey parameter as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MainApp: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [topics, setTopics] = useState<Topic[]>(MOCK_TOPICS);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(MOCK_TOPICS[0]?.id || null);
  const [view, setView] = useState<'chat' | 'canvas'>('canvas'); // 默认显示画布
  const [layout, setLayout] = useState<'horizontal' | 'vertical'>('horizontal');
  const [sidebarVisible, setSidebarVisible] = useState(true);


  const selectedTopic = useMemo(() => {
    return topics.find(t => t.id === selectedTopicId);
  }, [topics, selectedTopicId]);

  // 获取当前选中的分支
  const currentBranch = useMemo(() => {
    if (!selectedTopic || !selectedTopic.currentBranchId) return null;
    return selectedTopic.branches.find(b => b.id === selectedTopic.currentBranchId);
  }, [selectedTopic]);

  const handleCreateTopic = () => {
    const newTopicId = `topic-${Date.now()}`;
    const newTopic: Topic = {
      id: newTopicId,
      name: `New Topic ${topics.length + 1}`,
      branches: [],
      currentBranchId: null,
    };
    setTopics(prev => [...prev, newTopic]);
    setSelectedTopicId(newTopicId);
    setView('chat');
  };

  const handleSelectTopic = (topicId: string) => {
    setSelectedTopicId(topicId);

    // 如果选择的Topic没有分支，自动切换到Chat视图
    const topic = topics.find(t => t.id === topicId);
    if (topic && topic.branches.length === 0) {
      setView('chat');
    }
  };

  const handleSendMessage = async (content: string): Promise<void> => {
    if (!selectedTopic) return;

    let targetBranch = currentBranch;

    // 如果没有当前分支，创建第一个分支
    if (!targetBranch) {
      const newBranchId = `branch-${Date.now()}`;
      const newBranch: BranchNode = {
        id: newBranchId,
        name: 'Main Discussion',
        parentId: null,
        messages: [],
        position: { x: 100, y: 200 },
        createdAt: new Date().toISOString(),
      };

      // 更新主题，添加新分支并设为当前分支
      const updatedTopic: Topic = {
        ...selectedTopic,
        branches: [newBranch],
        currentBranchId: newBranchId,
      };

      setTopics(prevTopics => prevTopics.map(t =>
        t.id === selectedTopicId ? updatedTopic : t
      ));

      targetBranch = newBranch;
    }

    // 创建用户消息
    const userMessage: Message = {
      id: `msg-user-${Date.now()}`,
      author: 'user',
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // 向当前分支添加用户消息
    const updatedBranch: BranchNode = {
      ...targetBranch,
      messages: [...targetBranch.messages, userMessage],
    };

    // 更新主题状态
    setTopics(prevTopics => prevTopics.map(t =>
      t.id === selectedTopicId ? {
        ...t,
        branches: t.branches.map(b =>
          b.id === updatedBranch.id ? updatedBranch : b
        )
      } : t
    ));

    try {
      // 构建AI对话历史（使用分支内的消息）
      const history = updatedBranch.messages.map(msg => ({
        role: msg.author === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: history,
      });

      const aiMessage: Message = {
        id: `msg-ai-${Date.now()}`,
        author: 'ai',
        content: response.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      // 添加AI响应到分支
      setTopics(prevTopics => prevTopics.map(t =>
        t.id === selectedTopicId ? {
          ...t,
          branches: t.branches.map(b =>
            b.id === updatedBranch.id ? {
              ...b,
              messages: [...b.messages, aiMessage],
            } : b
          )
        } : t
      ));

    } catch (error) {
      console.error("Error getting AI response:", error);
      const errorMessage: Message = {
        id: `msg-err-${Date.now()}`,
        author: 'ai',
        content: "Sorry, I couldn't get a response. Please check your API key and network connection.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      // 添加错误消息到分支
      setTopics(prevTopics => prevTopics.map(t =>
        t.id === selectedTopicId ? {
          ...t,
          branches: t.branches.map(b =>
            b.id === updatedBranch.id ? {
              ...b,
              messages: [...b.messages, errorMessage],
            } : b
          )
        } : t
      ));
    }
  };
  
  const handleCreateBranch = async (branchName: string, sourceBranchId: string, upToMessageId?: string) => {
    if (!selectedTopic) return;

    // 找到源分支
    const sourceBranch = selectedTopic.branches.find(b => b.id === sourceBranchId);
    if (!sourceBranch) return;

    // 创建新分支ID
    const newBranchId = `branch-${Date.now()}`;

    // 根据upToMessageId决定要复制哪些消息
    let messagesToCopy = [...sourceBranch.messages];
    if (upToMessageId) {
      const messageIndex = sourceBranch.messages.findIndex(m => m.id === upToMessageId);
      if (messageIndex !== -1) {
        // 只复制到指定消息为止（包含该消息）
        messagesToCopy = sourceBranch.messages.slice(0, messageIndex + 1);
      }
    }

    // 计算新分支的位置（在父分支旁边）
    const newPosition = {
      x: sourceBranch.position.x + 300,
      y: sourceBranch.position.y + (selectedTopic.branches.filter(b => b.parentId === sourceBranchId).length * 150),
    };

    const newBranch: BranchNode = {
      id: newBranchId,
      name: branchName,
      parentId: sourceBranchId,
      messages: messagesToCopy, // 根据upToMessageId过滤后的消息
      position: newPosition,
      createdAt: new Date().toISOString(),
      isNew: true, // 标记为新分支以便高亮
    };

    // 更新主题：添加新分支，设为当前分支，清除其他分支的isNew标记
    const updatedTopic: Topic = {
      ...selectedTopic,
      branches: [
        ...selectedTopic.branches.map(b => ({ ...b, isNew: false })), // 清除其他分支的高亮
        newBranch
      ],
      currentBranchId: newBranchId,
    };

    setTopics(prevTopics => prevTopics.map(t =>
      t.id === selectedTopicId ? updatedTopic : t
    ));

    // 立即切换到画布视图（新分支会自动高亮）
    setView('canvas');

    // 异步处理AI响应
    try {
      const history = newBranch.messages.map(msg => ({
        role: msg.author === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: history,
      });

      const aiMessage: Message = {
        id: `msg-ai-${Date.now()}`,
        author: 'ai',
        content: response.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      // 添加AI响应到新分支
      setTopics(prevTopics => prevTopics.map(t =>
        t.id === selectedTopicId ? {
          ...t,
          branches: t.branches.map(b =>
            b.id === newBranchId ? {
              ...b,
              messages: [...b.messages, aiMessage],
            } : b
          )
        } : t
      ));

    } catch (error) {
      console.error("Error getting AI response for new branch:", error);
    }
  };

  const handleBranchClick = (branchId: string) => {
    if (!selectedTopic) return;

    // 设置当前分支并切换到聊天视图
    setTopics(prevTopics => prevTopics.map(t =>
      t.id === selectedTopicId ? { ...t, currentBranchId: branchId } : t
    ));
    setView('chat');
  };


  return (
    <ProtectedRoute
      requireAuth={true}
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-slate-800 mb-4">Synapse</h1>
            <p className="text-slate-600 mb-8">AI 对话分支工具</p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              开始使用
            </button>
          </div>
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
          />
        </div>
      }
    >
      <div className="flex h-screen bg-white font-sans text-slate-900">
        <div className={`transition-all duration-300 ${sidebarVisible ? 'w-64' : 'w-0'} overflow-hidden`}>
          <Sidebar
            topics={topics}
            selectedTopicId={selectedTopicId}
            onSelectTopic={handleSelectTopic}
            onCreateTopic={handleCreateTopic}
          />
        </div>
        <div className="flex-1 flex flex-col relative">
          <button
            onClick={() => setSidebarVisible(!sidebarVisible)}
            className="absolute top-1/2 -translate-y-1/2 -left-4 z-20 p-2 bg-white rounded-full shadow-md border border-slate-200 hover:bg-slate-100 transition-colors"
          >
            <ChevronLeftIcon className={`w-5 h-5 text-slate-600 transition-transform ${sidebarVisible ? '' : 'rotate-180'}`} />
          </button>
          {selectedTopic ? (
            <>
              <div className="flex items-center justify-between p-4 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-slate-800">{selectedTopic.name}</h2>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg">
                    <button onClick={() => setView('chat')} className={`px-3 py-1 text-sm rounded-md transition-colors ${view === 'chat' ? 'bg-white shadow-sm text-blue-600 font-semibold' : 'text-slate-600 hover:bg-slate-200'}`}>Chat</button>
                    <button onClick={() => setView('canvas')} className={`px-3 py-1 text-sm rounded-md transition-colors ${view === 'canvas' ? 'bg-white shadow-sm text-blue-600 font-semibold' : 'text-slate-600 hover:bg-slate-200'}`}>Canvas</button>
                  </div>
                  <UserMenu />
                </div>
              </div>
              <div className="flex-1 overflow-hidden bg-slate-50">
                  {view === 'chat' ? (
                      <ChatView
                        currentBranch={currentBranch}
                        onSendMessage={handleSendMessage}
                        onCreateBranch={handleCreateBranch}
                      />
                  ) : (
                      <CanvasView
                        topic={selectedTopic}
                        onBranchClick={handleBranchClick}
                        layout={layout}
                        onLayoutChange={setLayout}
                      />
                  )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500">
              <p>Select a topic or create a new one to start.</p>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<MainApp />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
