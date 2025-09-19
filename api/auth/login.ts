import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables:', {
    supabaseUrl: !!supabaseUrl,
    supabaseServiceKey: !!supabaseServiceKey
  });
  throw new Error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Debug environment variables
  console.log('Environment check:', {
    NODE_ENV: process.env.NODE_ENV,
    hasSupabaseUrl: !!supabaseUrl,
    hasSupabaseServiceKey: !!supabaseServiceKey,
    availableEnvKeys: Object.keys(process.env).filter(key =>
      key.includes('SUPABASE') || key.includes('OPENROUTER')
    )
  });

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    console.log('Login attempt for:', email);

    // Create anon client for user operations
    const anonClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

    // First try to sign in
    const { data: signInData, error: signInError } = await anonClient.auth.signInWithPassword({
      email,
      password
    });

    console.log('Sign in result:', { data: !!signInData?.user, error: signInError?.message });

    if (signInData?.user && signInData?.session) {
      // User exists and signed in successfully
      return res.status(200).json({
        user: signInData.user,
        session: signInData.session,
        message: 'Signed in successfully'
      });
    }

    // If sign in failed, try to create new user (auto-registration)
    if (signInError) {
      console.log('Sign in failed, attempting registration...');

      const { data: signUpData, error: signUpError } = await anonClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: email.split('@')[0]
          }
        }
      });

      console.log('Sign up result:', { data: !!signUpData?.user, error: signUpError?.message });

      if (signUpError) {
        return res.status(400).json({ error: `Registration failed: ${signUpError.message}` });
      }

      if (signUpData?.user) {
        // If we got a session immediately, return it
        if (signUpData.session) {
          return res.status(201).json({
            user: signUpData.user,
            session: signUpData.session,
            message: 'Account created and signed in successfully'
          });
        }

        // Try to sign in the newly created user
        const { data: newSignInData, error: newSignInError } = await anonClient.auth.signInWithPassword({
          email,
          password
        });

        if (newSignInError || !newSignInData?.session) {
          return res.status(201).json({
            user: signUpData.user,
            session: null,
            message: 'Account created successfully. Please check your email or try signing in again.'
          });
        }

        return res.status(201).json({
          user: newSignInData.user,
          session: newSignInData.session,
          message: 'Account created and signed in successfully'
        });
      }
    }

    // Other sign in errors
    return res.status(400).json({ error: signInError?.message || 'Authentication failed' });

  } catch (error) {
    console.error('Login API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}