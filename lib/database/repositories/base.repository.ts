import { SupabaseClient } from '@supabase/supabase-js';
import type {
  Database,
  BaseEntity,
  DatabaseResult,
  DatabaseListResult,
  DatabaseError,
  QueryOptions
} from '../types.js';

/**
 * Base repository class providing common CRUD operations
 * Designed to be extended by specific entity repositories
 */
export abstract class BaseRepository<TEntity extends BaseEntity, TInsert = Omit<TEntity, 'id' | 'created_at' | 'updated_at'>, TUpdate = Partial<Omit<TEntity, 'id' | 'created_at'>>> {
  protected supabase: SupabaseClient<Database>;
  protected tableName: string;

  constructor(supabase: SupabaseClient<Database>, tableName: string) {
    this.supabase = supabase;
    this.tableName = tableName;
  }

  /**
   * Create a new entity
   */
  async create(data: TInsert): Promise<DatabaseResult<TEntity>> {
    try {
      const { data: result, error } = await this.supabase
        .from(this.tableName)
        .insert(data as any)
        .select()
        .single();

      if (error) {
        return {
          data: null,
          error: this.mapError(error)
        };
      }

      return {
        data: result as TEntity,
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
   * Find entity by ID (excluding soft deleted)
   */
  async findById(id: number): Promise<DatabaseResult<TEntity>> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      if (error) {
        return {
          data: null,
          error: this.mapError(error)
        };
      }

      return {
        data: data as TEntity,
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
   * Find single entity by condition (excluding soft deleted)
   */
  async findOne(column: string, value: any): Promise<DatabaseResult<TEntity>> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('*')
        .eq(column, value)
        .is('deleted_at', null)
        .single();

      if (error) {
        return {
          data: null,
          error: this.mapError(error)
        };
      }

      return {
        data: data as TEntity,
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
   * Find multiple entities with optional filtering and pagination (excluding soft deleted)
   */
  async findMany(
    filters?: Record<string, any>,
    options?: QueryOptions
  ): Promise<DatabaseListResult<TEntity>> {
    try {
      let query = this.supabase.from(this.tableName).select('*', { count: 'exact' });

      // Exclude soft deleted records
      query = query.is('deleted_at', null);

      // Apply filters
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      // Apply ordering
      if (options?.orderBy) {
        query = query.order(options.orderBy, {
          ascending: options.orderDirection === 'asc'
        });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      // Apply pagination
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      if (options?.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error, count } = await query;

      if (error) {
        return {
          data: [],
          error: this.mapError(error),
          count: 0
        };
      }

      return {
        data: (data as TEntity[]) || [],
        error: null,
        count: count || 0
      };
    } catch (error) {
      return {
        data: [],
        error: this.mapError(error),
        count: 0
      };
    }
  }

  /**
   * Update entity by ID
   */
  async update(id: number, data: TUpdate): Promise<DatabaseResult<TEntity>> {
    try {
      const updateData = {
        ...data,
        updated_at: new Date().toISOString()
      };

      const { data: result, error } = await this.supabase
        .from(this.tableName)
        .update(updateData as any)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return {
          data: null,
          error: this.mapError(error)
        };
      }

      return {
        data: result as TEntity,
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
   * Soft delete entity by ID
   */
  async delete(id: number): Promise<DatabaseResult<boolean>> {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .update({
          deleted_at: new Date().toISOString()
        } as any)
        .eq('id', id)
        .is('deleted_at', null); // Only delete if not already deleted

      if (error) {
        return {
          data: false,
          error: this.mapError(error)
        };
      }

      return {
        data: true,
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
   * Hard delete entity by ID (permanent deletion)
   */
  async hardDelete(id: number): Promise<DatabaseResult<boolean>> {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .delete()
        .eq('id', id);

      if (error) {
        return {
          data: false,
          error: this.mapError(error)
        };
      }

      return {
        data: true,
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
   * Restore soft deleted entity by ID
   */
  async restore(id: number): Promise<DatabaseResult<boolean>> {
    try {
      const { error } = await this.supabase
        .from(this.tableName)
        .update({
          deleted_at: null,
          updated_at: new Date().toISOString()
        } as any)
        .eq('id', id)
        .not('deleted_at', 'is', null); // Only restore if actually deleted

      if (error) {
        return {
          data: false,
          error: this.mapError(error)
        };
      }

      return {
        data: true,
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
   * Check if entity exists by ID (excluding soft deleted)
   */
  async exists(id: number): Promise<DatabaseResult<boolean>> {
    try {
      const { data, error } = await this.supabase
        .from(this.tableName)
        .select('id')
        .eq('id', id)
        .is('deleted_at', null)
        .single();

      if (error) {
        // PGRST116 means no rows returned, which is not an error for exists check
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
   * Count entities with optional filters (excluding soft deleted)
   */
  async count(filters?: Record<string, any>): Promise<DatabaseResult<number>> {
    try {
      let query = this.supabase.from(this.tableName).select('*', {
        count: 'exact',
        head: true
      });

      // Exclude soft deleted records
      query = query.is('deleted_at', null);

      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      const { count, error } = await query;

      if (error) {
        return {
          data: 0,
          error: this.mapError(error)
        };
      }

      return {
        data: count || 0,
        error: null
      };
    } catch (error) {
      return {
        data: 0,
        error: this.mapError(error)
      };
    }
  }

  /**
   * Map Supabase errors to our DatabaseError format
   */
  protected mapError(error: any): DatabaseError {
    return {
      message: error?.message || 'Unknown database error',
      code: error?.code,
      details: error?.details || error
    };
  }
}