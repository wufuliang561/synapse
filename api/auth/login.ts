import { UserService } from '../../lib/database/services/user.service.js';
import type { LoginRequest, AuthResponse } from '../../lib/auth/types.js';

export async function POST(request: Request) {
  console.log('Login API called!');

  try {
    const body = await request.json();
    const loginData: LoginRequest = body;
    console.log('Login attempt:', {
      email: loginData.email,
      password: '***'
    });

    // Use UserService for login logic
    const userService = new UserService();
    const result = await userService.login(loginData);

    // Determine HTTP status code based on result
    let statusCode = 200;
    if (!result.success) {
      if (result.message?.includes('邮箱或密码错误')) {
        statusCode = 401; // Unauthorized
      } else if (result.message?.includes('验证') || result.message?.includes('格式')) {
        statusCode = 400; // Bad Request
      } else {
        statusCode = 500; // Internal Server Error
      }
    }

    console.log('Login result:', {
      success: result.success,
      message: result.message,
      user: result.user ? { id: result.user.id, email: result.user.email } : null
    });

    return Response.json(result as AuthResponse, { status: statusCode });

  } catch (error) {
    console.error('Login error:', error);
    return Response.json({
      success: false,
      message: '服务器内部错误'
    } as AuthResponse, { status: 500 });
  }
}