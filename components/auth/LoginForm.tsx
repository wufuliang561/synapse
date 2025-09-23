import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ErrorDisplay } from '../UI/ErrorDisplay';
import { OAuthButtons } from '../Auth/OAuthButtons';

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
}

export function LoginForm({ onSuccess, onSwitchToRegister }: LoginFormProps) {
  const { login, isLoading, lastError, clearError } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    clearError(); // 清除之前的错误

    if (!formData.email || !formData.password) {
      setErrors(['请填写所有字段']);
      return;
    }

    const success = await login(formData.email, formData.password);
    if (success) {
      onSuccess?.();
    } else {
      // 优先显示服务器返回的具体错误信息
      if (lastError) {
        setErrors([lastError]);
      } else {
        setErrors(['登录失败，请检查邮箱和密码']);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGoogleClick = () => {
    // Handled by OAuthButtons component
  };

  const handleGitHubClick = () => {
    // Handled by OAuthButtons component
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">
          登录 Synapse
        </h2>

        <ErrorDisplay
          errors={errors}
          onClose={() => setErrors([])}
        />

        {/* OAuth Buttons */}
        <OAuthButtons
          onGoogleClick={handleGoogleClick}
          onGitHubClick={handleGitHubClick}
          isLoading={isLoading}
        />

          <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              邮箱地址
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              placeholder="请输入邮箱地址"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              密码
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              placeholder="请输入密码"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? '登录中...' : '登录'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            还没有账号？{' '}
            <button
              onClick={onSwitchToRegister}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              立即注册
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}