import { VercelRequest, VercelResponse } from '@vercel/node';
import { verifyRefreshToken, generateAccessToken, generateRefreshToken } from '../../lib/auth/jwt';
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
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: '未提供刷新令牌'
      } as AuthResponse);
    }

    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return res.status(401).json({
        success: false,
        message: '无效的刷新令牌'
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

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user.id);

    res.status(200).json({
      success: true,
      user,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      message: '令牌刷新成功'
    } as AuthResponse);

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    } as AuthResponse);
  }
}