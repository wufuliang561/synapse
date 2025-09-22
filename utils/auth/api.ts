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
      return result;
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: '网络错误，请稍后重试',
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
      return result;
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: '网络错误，请稍后重试',
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
        message: '网络错误，请稍后重试',
      };
    }
  }
}