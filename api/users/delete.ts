import { UserService } from '../../lib/database/services/user.service.js';
import type { AuthResponse } from '../../lib/auth/types.js';

export async function POST(request: Request) {
  console.log('Delete User API called!');

  try {
    const body = await request.json();
    const { userId, permanent = false } = body;

    if (!userId) {
      return Response.json({
        success: false,
        message: '用户ID不能为空'
      } as AuthResponse, { status: 400 });
    }

    console.log('Delete user attempt:', { userId, permanent });

    const userService = new UserService();
    let result: AuthResponse;

    if (permanent) {
      // 永久删除
      result = await userService.permanentlyDeleteUser(userId);
    } else {
      // 逻辑删除
      result = await userService.deleteUser(userId);
    }

    // Determine HTTP status code based on result
    let statusCode = 200;
    if (!result.success) {
      if (result.message?.includes('无效的用户ID格式')) {
        statusCode = 400; // Bad Request
      } else if (result.message?.includes('不存在')) {
        statusCode = 404; // Not Found
      } else {
        statusCode = 500; // Internal Server Error
      }
    }

    console.log('Delete user result:', {
      success: result.success,
      message: result.message,
      permanent
    });

    return Response.json(result as AuthResponse, { status: statusCode });

  } catch (error) {
    console.error('Delete user error:', error);
    return Response.json({
      success: false,
      message: '服务器内部错误'
    } as AuthResponse, { status: 500 });
  }
}