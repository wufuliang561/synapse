import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { OAuthAPI } from '../../utils/auth/oauth';

export function OAuthCallback() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setUser, setIsAuthenticated } = useAuth();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const params = new URLSearchParams(location.search);
        const code = params.get('code');
        const state = params.get('state');
        const error = params.get('error');
        const provider = location.pathname.includes('google') ? 'google' : 'github';

        if (error) {
          const errorDescription = params.get('error_description') || `${provider}授权被取消`;
          setStatus('error');
          setMessage(errorDescription);
          return;
        }

        if (!code) {
          const errorMsg = '未收到授权码';
          setStatus('error');
          setMessage(errorMsg);
          return;
        }

        // Verify state parameter for security
        const storedState = sessionStorage.getItem(`${provider}_oauth_state`);
        if (state !== storedState) {
          setStatus('error');
          setMessage('状态参数验证失败，可能存在安全风险');
          return;
        }

        // Clear stored state
        sessionStorage.removeItem(`${provider}_oauth_state`);

        let result;
        if (provider === 'google') {
          result = await OAuthAPI.loginWithGoogle(code, state);
        } else {
          result = await OAuthAPI.loginWithGitHub(code, state);
        }

        if (result.success && result.user && result.accessToken) {
          // Store tokens
          localStorage.setItem('accessToken', result.accessToken);
          if (result.refreshToken) {
            localStorage.setItem('refreshToken', result.refreshToken);
          }

          // Update auth context
          setUser(result.user);
          setIsAuthenticated(true);

          setStatus('success');
          setMessage(`${provider === 'google' ? 'Google' : 'GitHub'}登录成功！`);

          // Redirect to main app after a short delay
          setTimeout(() => {
            navigate('/', { replace: true });
          }, 1500);
        } else {
          setStatus('error');
          setMessage(result.message || `${provider === 'google' ? 'Google' : 'GitHub'}登录失败`);
        }
      } catch (error) {
        console.error('OAuth callback error:', error);
        setStatus('error');
        setMessage('处理OAuth回调时发生错误');
      }
    };

    handleOAuthCallback();
  }, [location, navigate, setUser, setIsAuthenticated]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          {status === 'processing' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <h2 className="mt-6 text-xl font-semibold text-gray-900">
                正在处理登录...
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                请稍候，我们正在验证您的账户信息
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="h-12 w-12 mx-auto">
                <svg className="text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="mt-6 text-xl font-semibold text-gray-900">
                登录成功！
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {message}
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="h-12 w-12 mx-auto">
                <svg className="text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="mt-6 text-xl font-semibold text-gray-900">
                登录失败
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                {message}
              </p>
              <button
                onClick={() => navigate('/login')}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                返回登录页面
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}