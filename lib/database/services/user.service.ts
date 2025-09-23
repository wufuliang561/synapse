import bcrypt from 'bcrypt';
import { validateRegistration, validateLogin } from '../../auth/validators.js';
import { generateAccessToken, generateRefreshToken } from '../../auth/jwt.js';
import { getSupabaseServerClient } from '../client.js';
import { UserRepository } from '../repositories/user.repository.js';
import type { User, RegisterRequest, LoginRequest, AuthResponse } from '../../auth/types.js';
import type { DatabaseResult, CreateUserRequest } from '../types.js';

/**
 * User service layer handling business logic for user operations
 * Integrates authentication logic with database operations
 */
export class UserService {
  private userRepository: UserRepository;

  constructor() {
    const supabase = getSupabaseServerClient();
    this.userRepository = new UserRepository(supabase);
  }

  /**
   * Register a new user
   */
  async register(registerData: RegisterRequest): Promise<AuthResponse> {
    try {
      const { email, username, password } = registerData;

      // Validate input
      const validation = validateRegistration(email, username, password);
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.errors.join(', ')
        };
      }

      // Check if email already exists
      const emailExistsResult = await this.userRepository.emailExists(email);
      if (emailExistsResult.error) {
        console.error('Error checking email existence:', emailExistsResult.error);
        return {
          success: false,
          message: '服务器内部错误'
        };
      }

      if (emailExistsResult.data) {
        return {
          success: false,
          message: '该邮箱已被注册'
        };
      }

      // Check if username already exists
      const usernameExistsResult = await this.userRepository.usernameExists(username);
      if (usernameExistsResult.error) {
        console.error('Error checking username existence:', usernameExistsResult.error);
        return {
          success: false,
          message: '服务器内部错误'
        };
      }

      if (usernameExistsResult.data) {
        return {
          success: false,
          message: '该用户名已被使用'
        };
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const createUserRequest: CreateUserRequest = {
        email,
        username,
        password
      };

      const createResult = await this.userRepository.createUser(createUserRequest, passwordHash);
      if (createResult.error || !createResult.data) {
        console.error('Error creating user:', createResult.error);
        return {
          success: false,
          message: '用户创建失败'
        };
      }

      // Convert database user to API user format
      const user: User = {
        id: createResult.data.id.toString(),
        email: createResult.data.email,
        username: createResult.data.username,
        createdAt: createResult.data.created_at,
        updatedAt: createResult.data.updated_at
      };

      // Generate JWT tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user.id);

      return {
        success: true,
        user,
        accessToken,
        refreshToken,
        message: '注册成功'
      };

    } catch (error) {
      console.error('Registration service error:', error);
      return {
        success: false,
        message: '服务器内部错误'
      };
    }
  }

  /**
   * Login user
   */
  async login(loginData: LoginRequest): Promise<AuthResponse> {
    try {
      const { email, password } = loginData;

      // Validate input
      const validation = validateLogin(email, password);
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.errors.join(', ')
        };
      }

      // Find user by email
      const userResult = await this.userRepository.findByEmail(email);
      if (userResult.error) {
        console.error('Error finding user by email:', userResult.error);
        return {
          success: false,
          message: '服务器内部错误'
        };
      }

      if (!userResult.data) {
        return {
          success: false,
          message: '邮箱或密码错误'
        };
      }

      const dbUser = userResult.data;

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, dbUser.password_hash);
      if (!isPasswordValid) {
        return {
          success: false,
          message: '邮箱或密码错误'
        };
      }

      // Convert database user to API user format
      const user: User = {
        id: dbUser.id.toString(),
        email: dbUser.email,
        username: dbUser.username,
        createdAt: dbUser.created_at,
        updatedAt: dbUser.updated_at
      };

      // Generate JWT tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user.id);

      return {
        success: true,
        user,
        accessToken,
        refreshToken,
        message: '登录成功'
      };

    } catch (error) {
      console.error('Login service error:', error);
      return {
        success: false,
        message: '服务器内部错误'
      };
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<DatabaseResult<User>> {
    try {
      const numericUserId = parseInt(userId, 10);
      if (isNaN(numericUserId)) {
        return {
          data: null,
          error: {
            message: '无效的用户ID格式'
          }
        };
      }

      const result = await this.userRepository.findById(numericUserId);

      if (result.error || !result.data) {
        return {
          data: null,
          error: result.error
        };
      }

      // Convert database user to API user format
      const user: User = {
        id: result.data.id.toString(),
        email: result.data.email,
        username: result.data.username,
        createdAt: result.data.created_at,
        updatedAt: result.data.updated_at
      };

      return {
        data: user,
        error: null
      };

    } catch (error) {
      console.error('Get user by ID service error:', error);
      return {
        data: null,
        error: {
          message: '获取用户信息失败',
          details: error
        }
      };
    }
  }

  /**
   * Update user password
   */
  async updatePassword(userId: string, currentPassword: string, newPassword: string): Promise<AuthResponse> {
    try {
      const numericUserId = parseInt(userId, 10);
      if (isNaN(numericUserId)) {
        return {
          success: false,
          message: '无效的用户ID格式'
        };
      }

      // Get current user
      const userResult = await this.userRepository.findById(numericUserId);
      if (userResult.error || !userResult.data) {
        return {
          success: false,
          message: '用户不存在'
        };
      }

      const dbUser = userResult.data;

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, dbUser.password_hash);
      if (!isCurrentPasswordValid) {
        return {
          success: false,
          message: '当前密码错误'
        };
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      // Update password
      const updateResult = await this.userRepository.updatePassword(numericUserId, newPasswordHash);
      if (updateResult.error || !updateResult.data) {
        console.error('Error updating password:', updateResult.error);
        return {
          success: false,
          message: '密码更新失败'
        };
      }

      return {
        success: true,
        message: '密码更新成功'
      };

    } catch (error) {
      console.error('Update password service error:', error);
      return {
        success: false,
        message: '服务器内部错误'
      };
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, profileData: { email?: string; username?: string }): Promise<AuthResponse> {
    try {
      const numericUserId = parseInt(userId, 10);
      if (isNaN(numericUserId)) {
        return {
          success: false,
          message: '无效的用户ID格式'
        };
      }

      // Check if email is being changed and already exists
      if (profileData.email) {
        const emailExistsResult = await this.userRepository.emailExists(profileData.email);
        if (emailExistsResult.error) {
          console.error('Error checking email existence:', emailExistsResult.error);
          return {
            success: false,
            message: '服务器内部错误'
          };
        }

        if (emailExistsResult.data) {
          return {
            success: false,
            message: '该邮箱已被使用'
          };
        }
      }

      // Check if username is being changed and already exists
      if (profileData.username) {
        const usernameExistsResult = await this.userRepository.usernameExists(profileData.username);
        if (usernameExistsResult.error) {
          console.error('Error checking username existence:', usernameExistsResult.error);
          return {
            success: false,
            message: '服务器内部错误'
          };
        }

        if (usernameExistsResult.data) {
          return {
            success: false,
            message: '该用户名已被使用'
          };
        }
      }

      // Update profile
      const updateResult = await this.userRepository.updateProfile(numericUserId, profileData);
      if (updateResult.error || !updateResult.data) {
        console.error('Error updating profile:', updateResult.error);
        return {
          success: false,
          message: '资料更新失败'
        };
      }

      // Convert updated user to API format
      const user: User = {
        id: updateResult.data.id.toString(),
        email: updateResult.data.email,
        username: updateResult.data.username,
        createdAt: updateResult.data.created_at,
        updatedAt: updateResult.data.updated_at
      };

      return {
        success: true,
        user,
        message: '资料更新成功'
      };

    } catch (error) {
      console.error('Update profile service error:', error);
      return {
        success: false,
        message: '服务器内部错误'
      };
    }
  }

  /**
   * Delete user (soft delete)
   */
  async deleteUser(userId: string): Promise<AuthResponse> {
    try {
      const numericUserId = parseInt(userId, 10);
      if (isNaN(numericUserId)) {
        return {
          success: false,
          message: '无效的用户ID格式'
        };
      }

      const deleteResult = await this.userRepository.delete(numericUserId);
      if (deleteResult.error || !deleteResult.data) {
        console.error('Error deleting user:', deleteResult.error);
        return {
          success: false,
          message: '用户删除失败'
        };
      }

      return {
        success: true,
        message: '用户删除成功'
      };

    } catch (error) {
      console.error('Delete user service error:', error);
      return {
        success: false,
        message: '服务器内部错误'
      };
    }
  }

  /**
   * Restore deleted user
   */
  async restoreUser(userId: string): Promise<AuthResponse> {
    try {
      const numericUserId = parseInt(userId, 10);
      if (isNaN(numericUserId)) {
        return {
          success: false,
          message: '无效的用户ID格式'
        };
      }

      const restoreResult = await this.userRepository.restore(numericUserId);
      if (restoreResult.error || !restoreResult.data) {
        console.error('Error restoring user:', restoreResult.error);
        return {
          success: false,
          message: '用户恢复失败'
        };
      }

      return {
        success: true,
        message: '用户恢复成功'
      };

    } catch (error) {
      console.error('Restore user service error:', error);
      return {
        success: false,
        message: '服务器内部错误'
      };
    }
  }

  /**
   * Permanently delete user (hard delete)
   */
  async permanentlyDeleteUser(userId: string): Promise<AuthResponse> {
    try {
      const numericUserId = parseInt(userId, 10);
      if (isNaN(numericUserId)) {
        return {
          success: false,
          message: '无效的用户ID格式'
        };
      }

      const deleteResult = await this.userRepository.hardDelete(numericUserId);
      if (deleteResult.error || !deleteResult.data) {
        console.error('Error permanently deleting user:', deleteResult.error);
        return {
          success: false,
          message: '用户永久删除失败'
        };
      }

      return {
        success: true,
        message: '用户永久删除成功'
      };

    } catch (error) {
      console.error('Permanently delete user service error:', error);
      return {
        success: false,
        message: '服务器内部错误'
      };
    }
  }

  /**
   * OAuth login/registration
   */
  async loginWithOAuth(oauthData: {
    provider: 'google' | 'github';
    oauthId: string;
    email: string;
    username: string;
    avatar?: string;
  }): Promise<AuthResponse> {
    try {
      const { provider, oauthId, email, username, avatar } = oauthData;

      // Check if user exists by email
      const existingUserResult = await this.userRepository.findByEmail(email);
      if (existingUserResult.error) {
        console.error('Error finding user by email for OAuth:', existingUserResult.error);
        return {
          success: false,
          message: '服务器内部错误'
        };
      }

      let user: User;

      if (existingUserResult.data) {
        // User exists, update OAuth info if needed
        const dbUser = existingUserResult.data;

        // Convert to API format
        user = {
          id: dbUser.id.toString(),
          email: dbUser.email,
          username: dbUser.username,
          createdAt: dbUser.created_at,
          updatedAt: dbUser.updated_at,
          oauthProvider: provider,
          oauthId,
          avatar
        };

        // Update OAuth info in database (assuming we add these fields to the user table)
        // For now, we'll just proceed with the existing user
      } else {
        // User doesn't exist, create new user
        let uniqueUsername = username;
        let counter = 1;

        // Check if username already exists and generate unique one
        while (true) {
          const usernameExistsResult = await this.userRepository.usernameExists(uniqueUsername);
          if (usernameExistsResult.error) {
            console.error('Error checking username existence for OAuth:', usernameExistsResult.error);
            return {
              success: false,
              message: '服务器内部错误'
            };
          }

          if (!usernameExistsResult.data) {
            break; // Username is available
          }

          uniqueUsername = `${username}${counter}`;
          counter++;
        }

        // Create user with OAuth data
        const createUserRequest: CreateUserRequest = {
          email,
          username: uniqueUsername,
          password: '' // No password for OAuth users
        };

        // Generate a random password hash for OAuth users (they won't use it)
        const randomPasswordHash = await bcrypt.hash(crypto.randomUUID(), 10);

        const createResult = await this.userRepository.createUser(createUserRequest, randomPasswordHash);
        if (createResult.error || !createResult.data) {
          console.error('Error creating OAuth user:', createResult.error);
          return {
            success: false,
            message: 'OAuth用户创建失败'
          };
        }

        // Convert database user to API user format
        user = {
          id: createResult.data.id.toString(),
          email: createResult.data.email,
          username: createResult.data.username,
          createdAt: createResult.data.created_at,
          updatedAt: createResult.data.updated_at,
          oauthProvider: provider,
          oauthId,
          avatar
        };
      }

      // Generate JWT tokens
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user.id);

      return {
        success: true,
        user,
        accessToken,
        refreshToken,
        message: 'OAuth登录成功'
      };

    } catch (error) {
      console.error('OAuth login service error:', error);
      return {
        success: false,
        message: '服务器内部错误'
      };
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats() {
    return this.userRepository.getUserStats();
  }
}