import type { AuthResponse, LoginRequest, RegisterRequest, User } from '../../lib/auth/types';

const API_BASE = '/api/auth';

export class AuthAPI {
  static async register(data: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      // 如果服务器返回了结果，直接返回（包含具体的错误信息）
      if (result) {
        return result;
      }

      // 根据HTTP状态码提供更具体的错误信息
      if (!response.ok) {
        return {
          success: false,
          message: this.getErrorMessageByStatus(response.status),
        };
      }

      return result;
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: this.getNetworkErrorMessage(error),
      };
    }
  }

  static async login(data: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      // 如果服务器返回了结果，直接返回（包含具体的错误信息）
      if (result) {
        return result;
      }

      // 根据HTTP状态码提供更具体的错误信息
      if (!response.ok) {
        return {
          success: false,
          message: this.getErrorMessageByStatus(response.status),
        };
      }

      return result;
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: this.getNetworkErrorMessage(error),
      };
    }
  }

  static async verifyToken(token: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE}/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Token verification error:', error);
      return {
        success: false,
        message: '网络错误，请稍后重试',
      };
    }
  }

  static async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE}/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Token refresh error:', error);
      return {
        success: false,
        message: this.getNetworkErrorMessage(error),
      };
    }
  }

  /**
   * 根据HTTP状态码返回用户友好的错误信息
   */
  private static getErrorMessageByStatus(status: number): string {
    switch (status) {
      case 400:
        return '请求参数有误，请检查输入信息';
      case 401:
        return '邮箱或密码错误';
      case 403:
        return '访问被拒绝，请联系管理员';
      case 409:
        return '邮箱或用户名已被使用';
      case 429:
        return '请求过于频繁，请稍后再试';
      case 500:
        return '服务器内部错误，请稍后重试';
      case 502:
      case 503:
      case 504:
        return '服务暂时不可用，请稍后重试';
      default:
        return '请求失败，请稍后重试';
    }
  }

  /**
   * 根据网络错误类型返回用户友好的错误信息
   */
  private static getNetworkErrorMessage(error: any): string {
    if (error instanceof TypeError) {
      if (error.message.includes('Failed to fetch')) {
        return '网络连接失败，请检查网络设置';
      }
      if (error.message.includes('NetworkError')) {
        return '网络错误，请稍后重试';
      }
    }

    if (error.name === 'AbortError') {
      return '请求超时，请稍后重试';
    }

    return '网络错误，请稍后重试';
  }
}