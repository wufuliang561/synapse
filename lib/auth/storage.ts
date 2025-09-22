import type { User } from './types';

interface StoredUser extends User {
  password: string;
}

const STORAGE_KEYS = {
  USERS: 'synapse_users',
  ACCESS_TOKEN: 'synapse_access_token',
  REFRESH_TOKEN: 'synapse_refresh_token',
  CURRENT_USER: 'synapse_current_user',
} as const;

export class LocalStorage {
  static getUsers(): StoredUser[] {
    try {
      const users = localStorage.getItem(STORAGE_KEYS.USERS);
      return users ? JSON.parse(users) : [];
    } catch {
      return [];
    }
  }

  static saveUser(user: StoredUser): void {
    const users = this.getUsers();
    const existingIndex = users.findIndex(u => u.id === user.id);

    if (existingIndex >= 0) {
      users[existingIndex] = user;
    } else {
      users.push(user);
    }

    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }

  static findUserByEmail(email: string): StoredUser | null {
    const users = this.getUsers();
    return users.find(user => user.email === email) || null;
  }

  static findUserById(id: string): StoredUser | null {
    const users = this.getUsers();
    return users.find(user => user.id === id) || null;
  }

  static emailExists(email: string): boolean {
    return this.findUserByEmail(email) !== null;
  }

  static usernameExists(username: string): boolean {
    const users = this.getUsers();
    return users.some(user => user.username === username);
  }

  static setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  }

  static getAccessToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  static setCurrentUser(user: User): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  }

  static getCurrentUser(): User | null {
    try {
      const user = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  }

  static clearAuth(): void {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }

  static clearAll(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }
}