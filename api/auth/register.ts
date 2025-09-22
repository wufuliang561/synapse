import { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcrypt';
import { validateRegistration } from '../../lib/auth/validators';
import { generateAccessToken, generateRefreshToken } from '../../lib/auth/jwt';
import { LocalStorage } from '../../lib/auth/storage';
import type { RegisterRequest, AuthResponse, User } from '../../lib/auth/types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('Register API called!');
  console.log('Method:', req.method);
  console.log('Body:', req.body);

  if (req.method !== 'POST') {
    console.log('Method not allowed');
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    } as AuthResponse);
  }

  try {
    const { email, username, password }: RegisterRequest = req.body;
    console.log('Register attempt:', { email, username, password: '***' });

    // 验证输入
    console.log('Validating input...');
    const validation = validateRegistration(email, username, password);
    if (!validation.isValid) {
      console.log('Validation failed:', validation.errors);
      return res.status(400).json({
        success: false,
        message: validation.errors.join(', ')
      } as AuthResponse);
    }
    console.log('✅ Input validation passed');

    // Mock: 检查邮箱是否存在 (总是返回不存在)
    console.log('Mock: Checking if email exists...', email);
    const emailExists = false; // Mock: 总是通过
    if (emailExists) {
      return res.status(409).json({
        success: false,
        message: '该邮箱已被注册'
      } as AuthResponse);
    }
    console.log('✅ Mock: Email check passed');

    // Mock: 检查用户名是否存在 (总是返回不存在)
    console.log('Mock: Checking if username exists...', username);
    const usernameExists = false; // Mock: 总是通过
    if (usernameExists) {
      return res.status(409).json({
        success: false,
        message: '该用户名已被使用'
      } as AuthResponse);
    }
    console.log('✅ Mock: Username check passed');

    // 加密密码
    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('✅ Password hashed successfully');

    const now = new Date().toISOString();
    const user: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email,
      username,
      createdAt: now,
      updatedAt: now,
    };
    console.log('Created user object:', user);

    // Mock: 保存用户 (只打印，不实际保存)
    console.log('Mock: Saving user to database...', {
      ...user,
      hashedPassword: hashedPassword.substring(0, 10) + '...'
    });
    console.log('✅ Mock: User saved successfully!');

    // 生成JWT Token
    console.log('Generating JWT tokens...');
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user.id);
    console.log('✅ JWT tokens generated successfully');

    console.log('Registration completed for user:', user.email);

    res.status(201).json({
      success: true,
      user,
      accessToken,
      refreshToken,
      message: '注册成功'
    } as AuthResponse);

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    } as AuthResponse);
  }
}