export interface User {
  id: string;
  email: string;
  username: string;
  createdAt: string;
  updatedAt: string;
  avatar?: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}


export interface AuthResponse {
  success: boolean;
  user?: User;
  accessToken?: string;
  refreshToken?: string;
  message?: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
  username: string;
  iat: number;
  exp: number;
}

export interface RefreshTokenData {
  userId: string;
  tokenId: string;
  iat: number;
  exp: number;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, username: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  lastError: string | null;
  clearError: () => void;
}

