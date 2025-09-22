import { verifyAccessToken } from '../../lib/auth/jwt.js';
import { LocalStorage } from '../../lib/auth/storage.js';
import type { AuthResponse } from '../../lib/auth/types.js';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return Response.json({
        success: false,
        message: '未提供认证令牌'
      } as AuthResponse, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = verifyAccessToken(token);

    if (!payload) {
      return Response.json({
        success: false,
        message: '无效的认证令牌'
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

    return Response.json({
      success: true,
      user,
      message: '令牌验证成功'
    } as AuthResponse, { status: 200 });

  } catch (error) {
    console.error('Token verification error:', error);
    return Response.json({
      success: false,
      message: '服务器内部错误'
    } as AuthResponse, { status: 500 });
  }
}