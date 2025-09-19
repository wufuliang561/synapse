import React from 'react';

const AVAILABLE_MODELS = {
  'openai/gpt-5-chat': 'GPT-5 Chat',
  'anthropic/claude-3.5-sonnet': 'Claude 3.5 Sonnet',
  'google/gemini-2.0-flash-exp': 'Gemini 2.0 Flash',
  'deepseek/deepseek-chat-v3.1': 'DeepSeek Chat v3.1 (Free)',
  'deepseek/deepseek-r1-0528': 'DeepSeek R1 (Free)'
} as const;

type ModelKey = keyof typeof AVAILABLE_MODELS;

interface ModelSelectorProps {
  selectedModel: ModelKey;
  onModelChange: (model: ModelKey) => void;
}

export default function ModelSelector({ selectedModel, onModelChange }: ModelSelectorProps) {
  return (
    <div className="flex items-center gap-2 p-2 border-b border-gray-200">
      <label htmlFor="model-select" className="text-sm font-medium text-gray-700">
        AI Model:
      </label>
      <select
        id="model-select"
        value={selectedModel}
        onChange={(e) => onModelChange(e.target.value as ModelKey)}
        className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {Object.entries(AVAILABLE_MODELS).map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}

export { AVAILABLE_MODELS, type ModelKey };