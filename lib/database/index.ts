/**
 * Database layer exports for easy importing
 */

// Client configuration
export { getSupabaseClient, getSupabaseServerClient, resetSupabaseClient } from './client.js';

// Types
export type {
  Database,
  UserDB,
  BaseEntity,
  DatabaseError,
  DatabaseResult,
  DatabaseListResult,
  QueryOptions,
  CreateUserRequest,
  UpdateUserRequest
} from './types.js';

// Repositories
export { BaseRepository } from './repositories/base.repository.js';
export { UserRepository } from './repositories/user.repository.js';

// Services
export { UserService } from './services/user.service.js';