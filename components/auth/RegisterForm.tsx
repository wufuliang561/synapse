import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { validateRegistration } from '../../lib/auth/validators';
import { ErrorDisplay } from '../UI/ErrorDisplay';
import { OAuthButtons } from './OAuthButtons';

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const { register, isLoading, lastError, clearError } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    clearError(); // 清除之前的错误

    const validation = validateRegistration(formData.email, formData.username, formData.password);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrors(['两次输入的密码不一致']);
      return;
    }

    const success = await register(formData.email, formData.username, formData.password);
    if (success) {
      onSuccess?.();
    } else {
      // 优先显示服务器返回的具体错误信息
      if (lastError) {
        setErrors([lastError]);
      } else {
        setErrors(['注册失败，请稍后重试']);
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
          注册 Synapse
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
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              用户名
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              placeholder="请输入用户名"
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
            <p className="text-xs text-gray-500 mt-1">
              密码至少6位，包含大小写字母和数字
            </p>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              确认密码
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              placeholder="请再次输入密码"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? '注册中...' : '注册'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            已有账号？{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              立即登录
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}