/**
 * Database schema types for Supabase
 */

export interface UserDB {
  id: number;
  email: string;
  username: string;
  password_hash: string;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: UserDB;
        Insert: Omit<UserDB, 'id' | 'created_at' | 'updated_at'> & {
          id?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<UserDB, 'id' | 'created_at'>> & {
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

/**
 * Generic repository interface for CRUD operations
 */
export interface BaseEntity {
  id: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DatabaseError {
  message: string;
  code?: string;
  details?: any;
}

export interface DatabaseResult<T> {
  data: T | null;
  error: DatabaseError | null;
}

export interface DatabaseListResult<T> {
  data: T[];
  error: DatabaseError | null;
  count?: number;
}

/**
 * Query options for list operations
 */
export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

/**
 * User-specific types for business logic
 */
export interface CreateUserRequest {
  email: string;
  username: string;
  password: string;
}

export interface UpdateUserRequest {
  email?: string;
  username?: string;
  password?: string;
}