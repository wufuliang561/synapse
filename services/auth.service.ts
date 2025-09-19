import { supabase } from '../lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

export interface AuthResponse {
  user: User | null;
  session: Session | null;
  error: Error | null;
}

class AuthService {
  async signUp(email: string, password: string, displayName?: string): Promise<AuthResponse> {
    try {
      console.log('Attempting to sign up user:', email);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: undefined,
          data: {
            display_name: displayName || email.split('@')[0]
          }
        }
      });

      console.log('Sign up response:', { data, error });

      return {
        user: data.user,
        session: data.session,
        error: error ? new Error(error.message) : null
      };
    } catch (error) {
      console.error('Sign up exception:', error);
      return {
        user: null,
        session: null,
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      console.log('Attempting to sign in with email:', email);

      // Check if we're in production (deployed) environment
      const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

      if (isProduction) {
        // Use API endpoint in production
        console.log('Using API endpoint for authentication');
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (!response.ok) {
          return {
            user: null,
            session: null,
            error: new Error(data.error || 'Authentication failed')
          };
        }

        // Set the session in Supabase client
        if (data.session) {
          await supabase.auth.setSession(data.session);
        }

        return {
          user: data.user,
          session: data.session,
          error: null
        };
      } else {
        // Use direct Supabase client in development
        console.log('Using direct Supabase client for authentication');

        // First try to sign in
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        console.log('Sign in result:', { data: !!signInData?.user, error: signInError?.message });

        if (signInData?.user && signInData?.session) {
          // User exists and signed in successfully
          console.log('Sign in successful');
          return {
            user: signInData.user,
            session: signInData.session,
            error: null
          };
        }

        // If sign in failed, try to create new user (auto-registration)
        if (signInError) {
          console.log('Sign in failed, attempting to create new user. Error:', signInError.message);

          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: undefined, // Disable email confirmation
              data: {
                display_name: email.split('@')[0]
              }
            }
          });

          console.log('Sign up result:', { data: !!signUpData?.user, error: signUpError?.message });

          if (signUpError) {
            console.error('Sign up failed:', signUpError);
            return {
              user: null,
              session: null,
              error: new Error(`Registration failed: ${signUpError.message}`)
            };
          }

          if (signUpData?.user) {
            console.log('User created successfully:', signUpData.user.id);

            // If we have a session, return it
            if (signUpData.session) {
              return {
                user: signUpData.user,
                session: signUpData.session,
                error: null
              };
            }

            // If no session (email confirmation required), try to sign in
            console.log('No session from signup, attempting to sign in...');
            const { data: newSignInData, error: newSignInError } = await supabase.auth.signInWithPassword({
              email,
              password
            });

            if (newSignInError) {
              console.error('Sign in after registration failed:', newSignInError);
              return {
                user: signUpData.user,
                session: null,
                error: new Error('Account created successfully. Please check your email for verification or try signing in again.')
              };
            }

            return {
              user: newSignInData.user,
              session: newSignInData.session,
              error: null
            };
          }
        }

        // Other sign in errors
        return {
          user: null,
          session: null,
          error: new Error(signInError?.message || 'Authentication failed')
        };
      }

    } catch (error) {
      console.error('Authentication error:', error);
      return {
        user: null,
        session: null,
        error: error instanceof Error ? error : new Error('Network error')
      };
    }
  }


  async signOut(): Promise<{ error: Error | null }> {
    try {
      // Check if we're in production environment
      const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

      if (isProduction) {
        // Use API endpoint in production
        try {
          await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          });
        } catch (error) {
          console.warn('Logout API call failed, continuing with local logout:', error);
        }
      }

      // Always sign out locally
      const { error } = await supabase.auth.signOut();
      return {
        error: error ? new Error(error.message) : null
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async getCurrentSession(): Promise<Session | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    } catch (error) {
      console.error('Error getting current session:', error);
      return null;
    }
  }

  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }

  async resetPassword(email: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      return {
        error: error ? new Error(error.message) : null
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }
}

export const authService = new AuthService();