import React, { useState, useMemo, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatView from './components/ChatView';
import CanvasView from './components/CanvasView';
import ModelSelector from './components/ModelSelector';
import type { ModelKey } from './components/ModelSelector';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import { useAuth } from './components/Auth/AuthProvider';
import { topicsService } from './services/topics.service';
import { branchesService } from './services/branches.service';
import { messagesService } from './services/messages.service';
import type { Topic, Message, BranchNode } from './types';
import type { TopicWithBranches } from './services/topics.service';
import { ChevronLeftIcon } from './components/icons';

const App: React.FC = () => {
  const { user, signOut } = useAuth();
  const [topics, setTopics] = useState<TopicWithBranches[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [view, setView] = useState<'chat' | 'canvas'>('canvas');
  const [layout, setLayout] = useState<'horizontal' | 'vertical'>('horizontal');
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelKey>('deepseek/deepseek-chat-v3.1');
  const [branchMessages, setBranchMessages] = useState<Record<string, Message[]>>({});

  // Load topics when user is authenticated
  useEffect(() => {
    if (user) {
      loadTopics();
    }
  }, [user]);

  const loadTopics = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userTopics = await topicsService.getTopics(user.id);
      setTopics(userTopics);

      // Select first topic if none selected
      if (userTopics.length > 0 && !selectedTopicId) {
        setSelectedTopicId(userTopics[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load topics');
    } finally {
      setLoading(false);
    }
  };

  // Convert database message to app format
  const convertMessage = (dbMessage: any): Message => ({
    id: dbMessage.id,
    author: dbMessage.author === 'assistant' ? 'ai' : dbMessage.author,
    content: dbMessage.content,
    timestamp: new Date(dbMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });

  // Load messages for a specific branch
  const loadBranchMessages = async (branchId: string): Promise<Message[]> => {
    try {
      const dbMessages = await messagesService.getMessages(branchId);
      return dbMessages.map(convertMessage);
    } catch (err) {
      console.error('Failed to load branch messages:', err);
      return [];
    }
  };

  const selectedTopic = useMemo(() => {
    return topics.find(t => t.id === selectedTopicId);
  }, [topics, selectedTopicId]);

  // Load messages when current branch changes
  useEffect(() => {
    const loadCurrentBranchMessages = async () => {
      if (selectedTopic?.current_branch_id) {
        const messages = await loadBranchMessages(selectedTopic.current_branch_id);
        setBranchMessages(prev => ({
          ...prev,
          [selectedTopic.current_branch_id!]: messages
        }));
      }
    };

    loadCurrentBranchMessages();
  }, [selectedTopic?.current_branch_id]);

  // Convert Supabase data to app format
  const currentBranch = useMemo(() => {
    if (!selectedTopic || !selectedTopic.current_branch_id) return null;
    const branch = selectedTopic.branches.find(b => b.id === selectedTopic.current_branch_id);
    if (!branch) return null;

    // Get messages for this branch
    const messages = branchMessages[selectedTopic.current_branch_id] || [];

    // Convert to app format
    return {
      id: branch.id,
      name: branch.name,
      parentId: branch.parent_id,
      messages: messages,
      position: branch.position as { x: number; y: number },
      systemPrompt: branch.system_prompt,
      createdAt: branch.created_at
    } as BranchNode;
  }, [selectedTopic, branchMessages]);

  const handleCreateTopic = async () => {
    if (!user) return;

    try {
      const newTopic = await topicsService.createTopic({
        user_id: user.id,
        name: `New Topic ${topics.length + 1}`,
        is_archived: false
      });

      // Refresh topics
      await loadTopics();
      setSelectedTopicId(newTopic.id);
      setView('chat');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create topic');
    }
  };

  const handleSelectTopic = async (topicId: string) => {
    setSelectedTopicId(topicId);

    // If selected topic has no branches, switch to chat view
    const topic = topics.find(t => t.id === topicId);
    if (topic && topic.branches.length === 0) {
      setView('chat');
    }

    // Set current branch if topic has one
    if (topic && topic.current_branch_id) {
      await topicsService.setCurrentBranch(topicId, topic.current_branch_id);
    }
  };

  const handleSendMessage = async (content: string): Promise<void> => {
    if (!selectedTopic || !user) return;

    try {
      let targetBranch = currentBranch;

      // If no current branch, create the first branch
      if (!targetBranch) {
        const newBranch = await branchesService.createBranch({
          topic_id: selectedTopic.id,
          name: 'Main Discussion',
          parent_id: null,
          system_prompt: null,
          model_config: {
            model: 'gpt-4',
            temperature: 0.7,
            max_tokens: 2000
          },
          position: { x: 100, y: 200 },
          is_active: true
        });

        // Set as current branch
        await topicsService.setCurrentBranch(selectedTopic.id, newBranch.id);

        // Reload topics to get updated state
        await loadTopics();

        targetBranch = {
          id: newBranch.id,
          name: newBranch.name,
          parentId: newBranch.parent_id,
          messages: [],
          position: newBranch.position as { x: number; y: number },
          createdAt: newBranch.created_at
        } as BranchNode;
      }

      // Create user message
      await messagesService.createMessage({
        branch_id: targetBranch.id,
        author: 'user',
        content,
        metadata: {}
      });

      // Get messages for context
      const messages = await messagesService.getMessages(targetBranch.id);

      // Convert to API format
      const apiMessages = messages.map(msg => ({
        role: msg.author === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      }));

      // Send to AI API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: apiMessages,
          model: selectedModel
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();

      // Create AI response message
      await messagesService.createMessage({
        branch_id: targetBranch.id,
        author: 'assistant',
        content: data.message,
        metadata: { model: selectedModel }
      });

      // Refresh the current topic to show new messages
      await loadTopics();

      // Reload messages for current branch
      const updatedMessages = await loadBranchMessages(targetBranch.id);
      setBranchMessages(prev => ({
        ...prev,
        [targetBranch.id]: updatedMessages
      }));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    }
  };

  const handleCreateBranch = async (
    parentBranchId: string,
    branchName: string,
    fromMessageIndex?: number
  ): Promise<void> => {
    if (!selectedTopic) return;

    try {
      const parentBranch = selectedTopic.branches.find(b => b.id === parentBranchId);
      if (!parentBranch) return;

      // Calculate position for new branch
      const parentPos = parentBranch.position as { x: number; y: number };
      const newPosition = {
        x: parentPos.x + 300,
        y: parentPos.y + 100
      };

      // Create new branch
      const newBranch = await branchesService.createBranch({
        topic_id: selectedTopic.id,
        parent_id: parentBranchId,
        name: branchName,
        system_prompt: parentBranch.system_prompt,
        model_config: parentBranch.model_config,
        position: newPosition,
        is_active: true
      });

      // Copy messages up to the specified index
      if (fromMessageIndex !== undefined) {
        // TODO: Load parent messages and copy them
        // This would require loading messages from the parent branch
      }

      // Set new branch as current
      await topicsService.setCurrentBranch(selectedTopic.id, newBranch.id);

      // Refresh topics and switch to canvas view
      await loadTopics();
      setView('canvas');

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create branch');
    }
  };

  const handleBranchClick = async (branchId: string): Promise<void> => {
    if (!selectedTopic) return;

    try {
      await topicsService.setCurrentBranch(selectedTopic.id, branchId);
      await loadTopics();

      // Load messages for the newly selected branch
      const messages = await loadBranchMessages(branchId);
      setBranchMessages(prev => ({
        ...prev,
        [branchId]: messages
      }));

      setView('chat');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch branch');
    }
  };

  const handleUpdateSystemPrompt = async (branchId: string, systemPrompt: string): Promise<void> => {
    try {
      await branchesService.updateSystemPrompt(branchId, systemPrompt);
      // Refresh topics to get updated data
      await loadTopics();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update system prompt');
      throw err; // Re-throw so the UI can handle it
    }
  };

  // Convert topics to app format for existing components
  const appTopics: Topic[] = topics.map(topic => ({
    id: topic.id,
    name: topic.name,
    branches: topic.branches.map(branch => ({
      id: branch.id,
      name: branch.name,
      parentId: branch.parent_id,
      messages: [], // Messages loaded separately
      position: branch.position as { x: number; y: number },
      systemPrompt: branch.system_prompt,
      createdAt: branch.created_at
    })),
    currentBranchId: topic.current_branch_id
  }));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="h-screen flex bg-gray-50">
        {error && (
          <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50">
            <button
              onClick={() => setError(null)}
              className="float-right ml-2 font-bold"
            >
              ×
            </button>
            {error}
          </div>
        )}

        {/* Sidebar */}
        <div className={`${sidebarVisible ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden`}>
          <Sidebar
            topics={appTopics}
            selectedTopicId={selectedTopicId}
            onSelectTopic={handleSelectTopic}
            onCreateTopic={handleCreateTopic}
            userEmail={user?.email || ''}
            onSignOut={signOut}
          />
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col">
          {/* Header with sidebar toggle */}
          <div className="bg-white border-b border-gray-200">
            <div className="h-12 flex items-center px-4">
              <button
                onClick={() => setSidebarVisible(!sidebarVisible)}
                className="p-1 rounded-md hover:bg-gray-100"
              >
                <ChevronLeftIcon className={`w-5 h-5 transition-transform ${sidebarVisible ? '' : 'rotate-180'}`} />
              </button>

              <div className="ml-4 flex items-center space-x-4 flex-1">
                <h1 className="text-lg font-semibold text-gray-900">
                  {selectedTopic?.name || 'Synapse'}
                </h1>

                {selectedTopic && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setView('chat')}
                      className={`px-3 py-1 rounded-md text-sm font-medium ${
                        view === 'chat'
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Chat
                    </button>
                    <button
                      onClick={() => setView('canvas')}
                      className={`px-3 py-1 rounded-md text-sm font-medium ${
                        view === 'canvas'
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Canvas
                    </button>
                  </div>
                )}

                <div className="ml-auto">
                  <ModelSelector
                    selectedModel={selectedModel}
                    onModelChange={setSelectedModel}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Main content area */}
          <div className="flex-1">
            {!selectedTopic ? (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Welcome to Synapse
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Create a new topic to start a conversation
                  </p>
                  <button
                    onClick={handleCreateTopic}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
                  >
                    Create Topic
                  </button>
                </div>
              </div>
            ) : view === 'chat' ? (
              <ChatView
                currentBranch={currentBranch}
                onSendMessage={handleSendMessage}
                onCreateBranch={handleCreateBranch}
                onUpdateSystemPrompt={handleUpdateSystemPrompt}
              />
            ) : (
              <CanvasView
                topic={selectedTopic}
                layout={layout}
                onLayoutChange={setLayout}
                onBranchClick={handleBranchClick}
                onCreateBranch={handleCreateBranch}
                onUpdateSystemPrompt={handleUpdateSystemPrompt}
              />
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default App;