import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  model?: string;
}

// Available models
export const AVAILABLE_MODELS = {
  'openai/gpt-5-chat': 'GPT-5 Chat',
  'anthropic/claude-3.5-sonnet': 'Claude 3.5 Sonnet',
  'google/gemini-2.0-flash-exp': 'Gemini 2.0 Flash',
  'deepseek/deepseek-chat-v3.1': 'DeepSeek Chat v3.1 (Free)',
  'deepseek/deepseek-r1-0528': 'DeepSeek R1 (Free)'
} as const;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required. Missing or invalid Authorization header.' });
    }

    const token = authHeader.substring(7);

    // Create Supabase client for token verification
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Missing Supabase environment variables:', {
        supabaseUrl: !!supabaseUrl,
        supabaseServiceKey: !!supabaseServiceKey
      });
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the JWT token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Token verification failed:', authError?.message);
      return res.status(401).json({ error: 'Invalid or expired authentication token' });
    }

    console.log('Authenticated user:', user.id, user.email);

    const { messages, model = 'deepseek/deepseek-chat-v3.1' }: ChatRequest = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'OPENROUTER_API_KEY not configured' });
    }

    const openai = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: apiKey,
      defaultHeaders: {
        'HTTP-Referer': 'https://synapse-ai.vercel.app',
        'X-Title': 'Synapse AI',
      },
    });

    // Convert messages to OpenAI format
    const openaiMessages = messages.map((msg: ChatMessage) => ({
      role: msg.role,
      content: msg.content,
    }));

    const completion = await openai.chat.completions.create({
      model: model,
      messages: openaiMessages,
      temperature: 0.7,
      max_tokens: 4000,
    });

    const responseMessage = completion.choices[0]?.message?.content;

    if (!responseMessage) {
      throw new Error('No response content received');
    }

    return res.status(200).json({
      message: responseMessage,
      success: true,
      model: model,
      user_id: user.id
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return res.status(500).json({
      error: 'Failed to generate response',
      success: false
    });
  }
}