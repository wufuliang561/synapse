import { UserService } from '../../lib/database/services/user.service.js';
import type { RegisterRequest, AuthResponse } from '../../lib/auth/types.js';

export async function POST(request: Request) {
  console.log('Register API called!');

  try {
    const body = await request.json();
    const registerData: RegisterRequest = body;
    console.log('Register attempt:', {
      email: registerData.email,
      username: registerData.username,
      password: '***'
    });

    // Use UserService for registration logic
    const userService = new UserService();
    const result = await userService.register(registerData);

    // Determine HTTP status code based on result
    let statusCode = 200;
    if (result.success) {
      statusCode = 201; // Created
    } else {
      // Determine error status code based on message
      if (result.message?.includes('已被注册') || result.message?.includes('已被使用')) {
        statusCode = 409; // Conflict
      } else if (result.message?.includes('验证') || result.message?.includes('格式')) {
        statusCode = 400; // Bad Request
      } else {
        statusCode = 500; // Internal Server Error
      }
    }

    console.log('Registration result:', {
      success: result.success,
      message: result.message,
      user: result.user ? { id: result.user.id, email: result.user.email } : null
    });

    return Response.json(result as AuthResponse, { status: statusCode });

  } catch (error) {
    console.error('Registration error:', error);
    return Response.json({
      success: false,
      message: '服务器内部错误'
    } as AuthResponse, { status: 500 });
  }
}