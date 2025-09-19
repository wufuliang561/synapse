import React, { useState, useRef, useEffect } from 'react';
import type { BranchNode, Message } from '../types';
import { SendIcon, SparklesIcon } from './icons';
import BranchModal from './BranchModal';

interface ChatViewProps {
  currentBranch: BranchNode | null;
  onSendMessage: (content: string) => void;
  onCreateBranch: (branchName: string, sourceBranchId: string, upToMessageId?: string) => void;
  onUpdateSystemPrompt: (branchId: string, systemPrompt: string) => Promise<void>;
}

const MessageComponent: React.FC<{ message: Message; onBranch: (messageId: string) => void }> = ({ message, onBranch }) => {
  return (
    <div className={`group flex items-start gap-3 w-full ${message.author === 'user' ? 'justify-end' : 'justify-start'}`}>
      {message.author === 'ai' && (
        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center ring-2 ring-white flex-shrink-0">
          <SparklesIcon className="w-5 h-5 text-purple-600" />
        </div>
      )}

      <div className={`flex flex-col max-w-lg ${message.author === 'user' ? 'items-end' : 'items-start'}`}>
        <div className={`relative p-3 rounded-xl ${message.author === 'user' ? 'bg-blue-500 text-white' : 'bg-white text-slate-800 border border-slate-200'}`}>
          <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{message.content}</p>
          <button
            onClick={() => onBranch(message.id)}
            className="absolute -bottom-3 -right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-white rounded-full shadow-md hover:bg-slate-100"
            title="Branch from here"
          >
            <SparklesIcon className="w-4 h-4 text-yellow-500" />
          </button>
        </div>
        <span className="text-xs text-slate-400 mt-1">{message.timestamp}</span>
      </div>

      {message.author === 'user' && (
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center ring-2 ring-white text-blue-600 font-bold text-sm flex-shrink-0">
          You
        </div>
      )}
    </div>
  );
};

const ChatView: React.FC<ChatViewProps> = ({ currentBranch, onSendMessage, onCreateBranch, onUpdateSystemPrompt }) => {
  const [inputValue, setInputValue] = useState('');
  const [isBranchModalOpen, setBranchModalOpen] = useState(false);
  const [selectedMessageIdForBranch, setSelectedMessageIdForBranch] = useState<string | null>(null);
  const [showSystemPromptEditor, setShowSystemPromptEditor] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [isSystemPromptSaving, setIsSystemPromptSaving] = useState(false);

  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  // Sync system prompt when branch changes
  useEffect(() => {
    if (currentBranch) {
      setSystemPrompt(currentBranch.systemPrompt || '');
    }
  }, [currentBranch?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentBranch?.messages.length]);

  const handleSendMessage = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleOpenBranchModal = (messageId?: string) => {
    setSelectedMessageIdForBranch(messageId || null);
    setBranchModalOpen(true);
  };

  const handleCreateBranch = (branchName: string) => {
    if (currentBranch) {
      onCreateBranch(branchName, currentBranch.id, selectedMessageIdForBranch || undefined);
    }
    setBranchModalOpen(false);
    setSelectedMessageIdForBranch(null);
  };

  const handleSaveSystemPrompt = async () => {
    if (!currentBranch) return;

    setIsSystemPromptSaving(true);
    try {
      await onUpdateSystemPrompt(currentBranch.id, systemPrompt);
    } catch (error) {
      console.error('Failed to save system prompt:', error);
      // TODO: Show error message to user
    } finally {
      setIsSystemPromptSaving(false);
    }
  };

  const hasSystemPromptChanged = currentBranch?.systemPrompt !== systemPrompt;

  return (
    <div className="flex flex-col h-full bg-slate-50">
      {/* 分支信息头部 - 只在有分支时显示 */}
      {currentBranch && (
        <div className="border-b border-slate-200 bg-white">
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">{currentBranch.name}</h3>
                <p className="text-sm text-slate-500">{currentBranch.messages.length} messages</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSystemPromptEditor(!showSystemPromptEditor)}
                  className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                    showSystemPromptEditor
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  📝 System Prompt
                  {currentBranch.systemPrompt && <span className="w-2 h-2 bg-blue-500 rounded-full"></span>}
                </button>
                <button
                  onClick={() => handleOpenBranchModal()}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  <SparklesIcon className="w-4 h-4 text-yellow-500" />
                  Create Branch
                </button>
              </div>
            </div>
          </div>

          {/* System Prompt Editor */}
          {showSystemPromptEditor && (
            <div className="p-4 bg-slate-50 border-t border-slate-200">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">
                    System Prompt for "{currentBranch.name}"
                  </label>
                  {hasSystemPromptChanged && (
                    <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
                      Modified
                    </span>
                  )}
                </div>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="Enter a system prompt to guide the AI's behavior for this branch..."
                  className="w-full h-24 p-3 text-sm border border-slate-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    {systemPrompt.length} characters
                    {currentBranch.systemPrompt && !systemPrompt && (
                      <span className="ml-2 text-orange-600">(will be removed)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSystemPrompt(currentBranch.systemPrompt || '');
                      }}
                      disabled={!hasSystemPromptChanged}
                      className="px-3 py-1 text-xs text-slate-600 hover:text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Reset
                    </button>
                    <button
                      onClick={handleSaveSystemPrompt}
                      disabled={!hasSystemPromptChanged || isSystemPromptSaving}
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSystemPromptSaving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {!currentBranch ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <h3 className="text-xl font-semibold text-slate-800 mb-2">Welcome to your new topic!</h3>
              <p className="text-slate-500 mb-4">Start a conversation by sending your first message below.</p>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <SparklesIcon className="w-4 h-4" />
                <span>Your first message will create the initial branch</span>
              </div>
            </div>
          </div>
        ) : currentBranch.messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-slate-500">No messages in this branch yet. Send a message to start the conversation.</p>
          </div>
        ) : (
          currentBranch.messages.map(message => (
            <MessageComponent key={message.id} message={message} onBranch={handleOpenBranchModal} />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入框 - 始终显示 */}
      <div className="p-4 border-t border-slate-200 bg-white">
        <div className="relative">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder={!currentBranch ? "Start your conversation..." : "Type your message..."}
            className="w-full pl-4 pr-12 py-2 bg-slate-100 border border-transparent rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={1}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors"
          >
            <SendIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
      {isBranchModalOpen && (
        <BranchModal
          onClose={() => setBranchModalOpen(false)}
          onCreate={handleCreateBranch}
        />
      )}
    </div>
  );
};

export default ChatView;
