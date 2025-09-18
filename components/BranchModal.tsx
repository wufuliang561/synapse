
import React, { useState } from 'react';
import { AI_MODELS } from '../constants';
import { SparklesIcon } from './icons';

interface BranchModalProps {
  onClose: () => void;
  onCreate: (branchName: string) => void;
}

const BranchModal: React.FC<BranchModalProps> = ({ onClose, onCreate }) => {
  const [branchName, setBranchName] = useState('');

  const handleCreate = () => {
    if (branchName.trim()) {
      onCreate(branchName.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 m-4 transform transition-all" onClick={e => e.stopPropagation()}>
        <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-yellow-100 rounded-full">
                <SparklesIcon className="w-6 h-6 text-yellow-600"/>
            </div>
            <h2 className="text-xl font-bold text-slate-800">Create New Branch</h2>
        </div>
        
        <p className="text-sm text-slate-600 mb-6">
            Start a new, independent line of thought from this point. The first message of this branch will be its name.
        </p>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="branch-name" className="block text-sm font-medium text-slate-700 mb-1">
              Branch Name
            </label>
            <input
              type="text"
              id="branch-name"
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              placeholder="e.g., 'Explore content marketing ideas'"
              className="w-full px-3 py-2 text-slate-900 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoFocus
            />
          </div>
          <div>
            <label htmlFor="ai-model" className="block text-sm font-medium text-slate-700 mb-1">
              AI Model <span className="text-slate-400">(Optional)</span>
            </label>
            <select id="ai-model" className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              {AI_MODELS.map(model => <option key={model}>{model}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-8 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!branchName.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
};

export default BranchModal;
