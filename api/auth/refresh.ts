import { verifyRefreshToken, generateAccessToken, generateRefreshToken } from '../../lib/auth/jwt.js';
import { LocalStorage } from '../../lib/auth/storage.js';
import type { AuthResponse } from '../../lib/auth/types.js';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return Response.json({
        success: false,
        message: '未提供刷新令牌'
      } as AuthResponse, { status: 400 });
    }

    const payload = verifyRefreshToken(refreshToken);
    if (!payload) {
      return Response.json({
        success: false,
        message: '无效的刷新令牌'
      } as AuthResponse, { status: 401 });
    }

    const storedUser = LocalStorage.findUserById(payload.userId);
    if (!storedUser) {
      return Response.json({
        success: false,
        message: '用户不存在'
      } as AuthResponse, { status: 401 });
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

    return Response.json({
      success: true,
      user,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      message: '令牌刷新成功'
    } as AuthResponse, { status: 200 });

  } catch (error) {
    console.error('Token refresh error:', error);
    return Response.json({
      success: false,
      message: '服务器内部错误'
    } as AuthResponse, { status: 500 });
  }
}