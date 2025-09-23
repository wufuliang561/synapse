import { SupabaseClient } from '@supabase/supabase-js';
import { BaseRepository } from './base.repository.js';
import type {
  Database,
  UserDB,
  DatabaseResult,
  CreateUserRequest,
  UpdateUserRequest
} from '../types.js';

/**
 * User repository implementing user-specific database operations
 * Extends BaseRepository for common CRUD operations
 */
export class UserRepository extends BaseRepository<UserDB, Database['public']['Tables']['users']['Insert'], Database['public']['Tables']['users']['Update']> {
  constructor(supabase: SupabaseClient<Database>) {
    super(supabase, 'users');
  }

  /**
   * Find user by email address
   */
  async findByEmail(email: string): Promise<DatabaseResult<UserDB>> {
    return this.findOne('email', email);
  }

  /**
   * Find user by username
   */
  async findByUsername(username: string): Promise<DatabaseResult<UserDB>> {
    return this.findOne('username', username);
  }

  /**
   * Check if email already exists (excluding soft deleted)
   */
  async emailExists(email: string): Promise<DatabaseResult<boolean>> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('id')
        .eq('email', email)
        .is('deleted_at', null)
        .single();

      if (error) {
        // PGRST116 means no rows returned
        if (error.code === 'PGRST116') {
          return {
            data: false,
            error: null
          };
        }

        return {
          data: false,
          error: this.mapError(error)
        };
      }

      return {
        data: !!data,
        error: null
      };
    } catch (error) {
      return {
        data: false,
        error: this.mapError(error)
      };
    }
  }

  /**
   * Check if username already exists (excluding soft deleted)
   */
  async usernameExists(username: string): Promise<DatabaseResult<boolean>> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('id')
        .eq('username', username)
        .is('deleted_at', null)
        .single();

      if (error) {
        // PGRST116 means no rows returned
        if (error.code === 'PGRST116') {
          return {
            data: false,
            error: null
          };
        }

        return {
          data: false,
          error: this.mapError(error)
        };
      }

      return {
        data: !!data,
        error: null
      };
    } catch (error) {
      return {
        data: false,
        error: this.mapError(error)
      };
    }
  }

  /**
   * Create a new user with password hash
   */
  async createUser(userData: CreateUserRequest, passwordHash: string): Promise<DatabaseResult<UserDB>> {
    const insertData: Database['public']['Tables']['users']['Insert'] = {
      email: userData.email,
      username: userData.username,
      password_hash: passwordHash
    };

    return this.create(insertData);
  }

  /**
   * Update user password
   */
  async updatePassword(userId: number, newPasswordHash: string): Promise<DatabaseResult<UserDB>> {
    const updateData: Database['public']['Tables']['users']['Update'] = {
      password_hash: newPasswordHash
    };

    return this.update(userId, updateData);
  }

  /**
   * Update user profile (email and/or username)
   */
  async updateProfile(userId: number, profileData: Partial<Pick<UserDB, 'email' | 'username'>>): Promise<DatabaseResult<UserDB>> {
    const updateData: Database['public']['Tables']['users']['Update'] = {};

    if (profileData.email !== undefined) {
      updateData.email = profileData.email;
    }
    if (profileData.username !== undefined) {
      updateData.username = profileData.username;
    }

    return this.update(userId, updateData);
  }

  /**
   * Find users by partial username (for search/autocomplete, excluding soft deleted)
   */
  async searchByUsername(partialUsername: string, limit: number = 10): Promise<DatabaseResult<UserDB[]>> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('id, email, username, deleted_at, created_at, updated_at')
        .ilike('username', `%${partialUsername}%`)
        .is('deleted_at', null)
        .limit(limit)
        .order('username');

      if (error) {
        return {
          data: null,
          error: this.mapError(error)
        };
      }

      return {
        data: data as UserDB[],
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: this.mapError(error)
      };
    }
  }

  /**
   * Get user statistics (excluding soft deleted)
   */
  async getUserStats(): Promise<DatabaseResult<{ totalUsers: number; recentUsers: number; deletedUsers: number }>> {
    try {
      const oneDayAgo = new Date();
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      const [totalResult, recentResult, deletedResult] = await Promise.all([
        this.supabase
          .from(this.tableName)
          .select('*', { count: 'exact', head: true })
          .is('deleted_at', null),
        this.supabase
          .from(this.tableName)
          .select('*', { count: 'exact', head: true })
          .is('deleted_at', null)
          .gte('created_at', oneDayAgo.toISOString()),
        this.supabase
          .from(this.tableName)
          .select('*', { count: 'exact', head: true })
          .not('deleted_at', 'is', null)
      ]);

      if (totalResult.error || recentResult.error || deletedResult.error) {
        return {
          data: null,
          error: this.mapError(totalResult.error || recentResult.error || deletedResult.error)
        };
      }

      return {
        data: {
          totalUsers: totalResult.count || 0,
          recentUsers: recentResult.count || 0,
          deletedUsers: deletedResult.count || 0
        },
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: this.mapError(error)
      };
    }
  }
}