import jwt from 'jsonwebtoken';
import type { TokenPayload, RefreshTokenData, User } from './types';

const JWT_SECRET = process.env.JWT_SECRET || 'synapse-dev-secret-key-change-in-production';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'synapse-refresh-secret-key-change-in-production';

export const JWT_CONFIG = {
  ACCESS_TOKEN_EXPIRES_IN: '15m',
  REFRESH_TOKEN_EXPIRES_IN: '7d',
};

export function generateAccessToken(user: User): string {
  const payload: Omit<TokenPayload, 'iat' | 'exp'> = {
    userId: user.id,
    email: user.email,
    username: user.username,
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRES_IN,
  });
}

export function generateRefreshToken(userId: string): string {
  const tokenId = `refresh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const payload: Omit<RefreshTokenData, 'iat' | 'exp'> = {
    userId,
    tokenId,
  };

  return jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: JWT_CONFIG.REFRESH_TOKEN_EXPIRES_IN,
  });
}

export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    console.error('Invalid access token:', error);
    return null;
  }
}

export function verifyRefreshToken(token: string): RefreshTokenData | null {
  try {
    const decoded = jwt.verify(token, REFRESH_SECRET) as RefreshTokenData;
    return decoded;
  } catch (error) {
    console.error('Invalid refresh token:', error);
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  try {
    const decoded = jwt.decode(token) as any;
    if (!decoded || !decoded.exp) return true;

    const currentTime = Math.floor(Date.now() / 1000);
    return decoded.exp < currentTime;
  } catch {
    return true;
  }
}

export function decodeToken(token: string): any {
  try {
    return jwt.decode(token);
  } catch {
    return null;
  }
}

export function extractUserFromToken(token: string): User | null {
  const payload = verifyAccessToken(token);
  if (!payload) return null;

  return {
    id: payload.userId,
    email: payload.email,
    username: payload.username,
    createdAt: '',
    updatedAt: '',
  };
}