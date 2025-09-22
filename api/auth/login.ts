import { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcrypt';
import { validateLogin } from '../../lib/auth/validators';
import { generateAccessToken, generateRefreshToken } from '../../lib/auth/jwt';
import { LocalStorage } from '../../lib/auth/storage';
import type { LoginRequest, AuthResponse } from '../../lib/auth/types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('Login API called!');
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
    const { email, password }: LoginRequest = req.body;
    console.log('Login attempt:', { email, password: '***' });

    // 验证输入
    console.log('Validating input...');
    const validation = validateLogin(email, password);
    if (!validation.isValid) {
      console.log('Validation failed:', validation.errors);
      return res.status(400).json({
        success: false,
        message: validation.errors.join(', ')
      } as AuthResponse);
    }
    console.log('✅ Input validation passed');

    // Mock: 查找用户 (总是找到用户)
    console.log('Mock: Finding user by email...', email);
    const mockStoredUser = {
      id: `user_${Date.now()}`,
      email: email,
      username: email.split('@')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      password: '$2b$10$mockhashedpassword' // Mock密码
    };
    console.log('✅ Mock: User found:', { ...mockStoredUser, password: '***' });

    // Mock: 验证密码 (总是通过)
    console.log('Mock: Verifying password...');
    const isPasswordValid = true; // Mock: 总是通过
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '邮箱或密码错误'
      } as AuthResponse);
    }
    console.log('✅ Mock: Password verification passed');

    const user = {
      id: mockStoredUser.id,
      email: mockStoredUser.email,
      username: mockStoredUser.username,
      createdAt: mockStoredUser.createdAt,
      updatedAt: mockStoredUser.updatedAt,
    };
    console.log('Created response user object:', user);

    // 生成真实的JWT Token
    console.log('Generating JWT tokens...');
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user.id);
    console.log('✅ JWT tokens generated successfully');

    console.log('Login completed for user:', user.email);

    res.status(200).json({
      success: true,
      user,
      accessToken,
      refreshToken,
      message: '登录成功'
    } as AuthResponse);

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    } as AuthResponse);
  }
}