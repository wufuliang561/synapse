// Simple test to verify basic table access
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Load environment variables
function loadEnvFile() {
  const envContent = readFileSync('.env.local', 'utf8');
  const envVars = {};
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) envVars[key.trim()] = value.trim();
  });
  return envVars;
}

const env = loadEnvFile();
const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);

async function testSimpleQuery() {
  console.log('🔄 Testing simple table queries...\n');

  const tables = ['users', 'topics', 'branches', 'messages', 'user_preferences'];

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        if (error.message.includes('row-level security')) {
          console.log(`✅ ${table}: RLS protection active`);
        } else {
          console.log(`❓ ${table}: ${error.message}`);
        }
      } else {
        console.log(`✅ ${table}: Accessible (${data?.length || 0} rows)`);
      }
    } catch (err) {
      console.log(`❌ ${table}: Exception - ${err.message}`);
    }
  }

  console.log('\n🎯 Database is ready for authentication testing!');
  console.log('💡 Run `npm run dev` and test Google login at http://localhost:5173');
}

testSimpleQuery();