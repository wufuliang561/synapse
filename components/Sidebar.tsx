import React from 'react';
import type { Topic } from '../types';
import { PlusIcon } from './icons';

interface SidebarProps {
  topics: Topic[];
  selectedTopicId: string | null;
  onSelectTopic: (topicId: string) => void;
  onCreateTopic: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ topics, selectedTopicId, onSelectTopic, onCreateTopic }) => {
  return (
    <aside className="w-64 h-full bg-slate-100 border-r border-slate-200 flex flex-col">
      <div className="p-4 border-b border-slate-200">
        <h1 className="text-xl font-bold text-slate-800">Synapse</h1>
      </div>
      <div className="p-2">
        <button
          onClick={onCreateTopic}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <PlusIcon className="w-4 h-4" />
          <span>New Topic</span>
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        <ul>
          {topics.map((topic) => (
            <li key={topic.id}>
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  onSelectTopic(topic.id);
                }}
                className={`block px-4 py-2 my-1 text-sm rounded-lg transition-colors ${
                  selectedTopicId === topic.id
                    ? 'bg-blue-500 text-white font-semibold'
                    : 'text-slate-700 hover:bg-slate-200'
                }`}
              >
                {topic.name}
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-4 border-t border-slate-200 text-xs text-slate-500">
        <p>Export to Sheets</p>
      </div>
    </aside>
  );
};

export default Sidebar;