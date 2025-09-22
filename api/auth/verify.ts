import { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyAccessToken } from '../../lib/auth/jwt';
import { LocalStorage } from '../../lib/auth/storage';
import type { AuthResponse } from '../../lib/auth/types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    } as AuthResponse);
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '未提供认证令牌'
      } as AuthResponse);
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);

    if (!payload) {
      return res.status(401).json({
        success: false,
        message: '无效的认证令牌'
      } as AuthResponse);
    }

    const storedUser = LocalStorage.findUserById(payload.userId);
    if (!storedUser) {
      return res.status(401).json({
        success: false,
        message: '用户不存在'
      } as AuthResponse);
    }

    const user = {
      id: storedUser.id,
      email: storedUser.email,
      username: storedUser.username,
      createdAt: storedUser.createdAt,
      updatedAt: storedUser.updatedAt,
    };

    res.status(200).json({
      success: true,
      user,
      message: '令牌验证成功'
    } as AuthResponse);

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    } as AuthResponse);
  }
}