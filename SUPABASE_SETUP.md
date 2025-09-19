# Supabase Database Setup

## 1. Database Schema Setup

You need to run the SQL schema in your Supabase project to create the necessary tables.

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `/supabase/schema.sql`
4. Run the SQL script

This will create:
- `users` table with authentication integration
- `topics` table for conversation workspaces
- `branches` table for conversation branches
- `messages` table for chat messages
- `user_preferences` table for user settings
- All necessary indexes and RLS policies

## 2. Authentication Setup

### Email Authentication Configuration

The application uses email-based authentication with automatic user registration. No external OAuth setup is required.

#### How it works:

1. User enters email and password
2. If the account exists, user is signed in
3. If the account doesn't exist, it's created automatically
4. No email verification is required

#### Supabase Configuration

**Critical Steps for Email Authentication:**

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Navigate to Authentication > Settings**
3. **Disable Email Confirmation**:
   - Uncheck "Enable email confirmations"
   - This allows users to sign in immediately without email verification
4. **Configure Auth Settings**:
   - Set "Minimum password length" to your preference (e.g., 6)
   - Enable "Allow new users to sign up"
5. **Site URL Configuration**:
   - Add your development URL: `http://localhost:5174`
   - Add your production URL when deploying

**If you get 500 errors during signup:**
- Check that your Supabase project is active and not paused
- Verify that the database schema has been properly applied
- Ensure RLS policies are correctly configured

#### API Endpoints

The following API endpoints handle authentication:
- `/api/auth/login` - Handles login and auto-registration
- `/api/auth/logout` - Handles user logout

## 3. Environment Variables

### For Local Development (.env.local)

```
GEMINI_API_KEY=your_gemini_api_key
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### For Production Deployment (Vercel Environment Variables)

In your Vercel dashboard, add these environment variables:

```
GEMINI_API_KEY=your_gemini_api_key
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Important Notes:**
- `SUPABASE_SERVICE_ROLE_KEY` is only needed for production API endpoints
- Local development uses direct Supabase client authentication
- Production deployment uses Vercel API endpoints (`/api/auth/`) for authentication

## 4. Testing the Integration

1. Run `npm run dev`
2. Visit http://localhost:5175
3. You should see the email login form
4. Enter any email and password to create a new account automatically
5. Test creating topics and sending messages

## 5. Next Steps

- The AI integration is currently a placeholder
- You'll need to implement OpenAI API integration
- Consider adding file upload functionality using Supabase Storage
- Add real-time collaboration features