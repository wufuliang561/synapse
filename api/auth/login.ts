import { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcrypt';
import { validateLogin } from '../../lib/auth/validators';
import { generateAccessToken, generateRefreshToken } from '../../lib/auth/jwt';
import { LocalStorage } from '../../lib/auth/storage';
import type { LoginRequest, AuthResponse } from '../../lib/auth/types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Method not allowed'
    } as AuthResponse);
  }

  try {
    const { email, password }: LoginRequest = req.body;

    const validation = validateLogin(email, password);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errors.join(', ')
      } as AuthResponse);
    }

    const storedUser = LocalStorage.findUserByEmail(email);
    if (!storedUser) {
      return res.status(401).json({
        success: false,
        message: '邮箱或密码错误'
      } as AuthResponse);
    }

    const isPasswordValid = await bcrypt.compare(password, storedUser.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '邮箱或密码错误'
      } as AuthResponse);
    }

    const user = {
      id: storedUser.id,
      email: storedUser.email,
      username: storedUser.username,
      createdAt: storedUser.createdAt,
      updatedAt: storedUser.updatedAt,
    };

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user.id);

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