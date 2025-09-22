import { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcrypt';
import { validateRegistration } from '../../lib/auth/validators';
import { generateAccessToken, generateRefreshToken } from '../../lib/auth/jwt';
import { LocalStorage } from '../../lib/auth/storage';
import type { RegisterRequest, AuthResponse, User } from '../../lib/auth/types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    } as AuthResponse);
  }

  try {
    const { email, username, password }: RegisterRequest = req.body;

    const validation = validateRegistration(email, username, password);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errors.join(', ')
      } as AuthResponse);
    }

    if (LocalStorage.emailExists(email)) {
      return res.status(409).json({
        success: false,
        message: '该邮箱已被注册'
      } as AuthResponse);
    }

    if (LocalStorage.usernameExists(username)) {
      return res.status(409).json({
        success: false,
        message: '该用户名已被使用'
      } as AuthResponse);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();

    const user: User = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email,
      username,
      createdAt: now,
      updatedAt: now,
    };

    LocalStorage.saveUser({
      ...user,
      password: hashedPassword,
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user.id);

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