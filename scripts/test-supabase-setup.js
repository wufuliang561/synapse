// Test script to verify Supabase database setup
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Load environment variables from .env.local
function loadEnvFile() {
  try {
    const envContent = readFileSync('.env.local', 'utf8');
    const envVars = {};

    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        envVars[key.trim()] = value.trim();
      }
    });

    return envVars;
  } catch (error) {
    console.error('Could not load .env.local file:', error.message);
    return {};
  }
}

const env = loadEnvFile();
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseServiceKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  console.log('Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDatabaseSetup() {
  console.log('🔄 Testing Supabase database setup...\n');

  try {
    // Test 1: Check if tables exist
    console.log('1. Checking if tables exist...');

    const tables = ['users', 'topics', 'branches', 'messages', 'user_preferences'];
    const tableResults = {};

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error) {
          tableResults[table] = `❌ Error: ${error.message}`;
        } else {
          tableResults[table] = `✅ Exists (${data?.length || 0} rows)`;
        }
      } catch (err) {
        tableResults[table] = `❌ Exception: ${err.message}`;
      }
    }

    console.log('Table status:');
    Object.entries(tableResults).forEach(([table, status]) => {
      console.log(`  ${table}: ${status}`);
    });
    console.log();

    // Test 2: Test creating a mock user (simulating auth trigger)
    console.log('2. Testing user creation...');

    try {
      // First, try to create a test user directly (this would normally be done by auth trigger)
      const testUserId = crypto.randomUUID();
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          id: testUserId,
          email: 'test@example.com',
          display_name: 'Test User',
          auth_provider: 'email',
          email_verified: true
        })
        .select()
        .single();

      if (userError) {
        console.log(`  ❌ User creation failed: ${userError.message}`);
      } else {
        console.log(`  ✅ User created successfully: ${userData.email}`);

        // Test 3: Check if user_preferences was auto-created
        console.log('3. Testing auto-created user preferences...');

        const { data: prefsData, error: prefsError } = await supabase
          .from('user_preferences')
          .select('*')
          .eq('user_id', testUserId)
          .single();

        if (prefsError) {
          console.log(`  ❌ User preferences not auto-created: ${prefsError.message}`);
        } else {
          console.log(`  ✅ User preferences auto-created: theme=${prefsData.ui_theme}, layout=${prefsData.canvas_layout}`);
        }

        // Test 4: Test creating a topic
        console.log('4. Testing topic creation...');

        const { data: topicData, error: topicError } = await supabase
          .from('topics')
          .insert({
            user_id: testUserId,
            name: 'Test Topic',
            description: 'A test topic'
          })
          .select()
          .single();

        if (topicError) {
          console.log(`  ❌ Topic creation failed: ${topicError.message}`);
        } else {
          console.log(`  ✅ Topic created successfully: ${topicData.name}`);

          // Test 5: Test creating a branch
          console.log('5. Testing branch creation...');

          const { data: branchData, error: branchError } = await supabase
            .from('branches')
            .insert({
              topic_id: topicData.id,
              name: 'Main Branch',
              system_prompt: 'You are a helpful assistant',
              position: { x: 100, y: 200 }
            })
            .select()
            .single();

          if (branchError) {
            console.log(`  ❌ Branch creation failed: ${branchError.message}`);
          } else {
            console.log(`  ✅ Branch created successfully: ${branchData.name}`);

            // Test 6: Test creating a message
            console.log('6. Testing message creation...');

            const { data: messageData, error: messageError } = await supabase
              .from('messages')
              .insert({
                branch_id: branchData.id,
                author: 'user',
                content: 'Hello, this is a test message!'
              })
              .select()
              .single();

            if (messageError) {
              console.log(`  ❌ Message creation failed: ${messageError.message}`);
            } else {
              console.log(`  ✅ Message created successfully: ${messageData.content}`);
            }
          }
        }

        // Cleanup: Delete test data
        console.log('7. Cleaning up test data...');

        const { error: deleteError } = await supabase
          .from('users')
          .delete()
          .eq('id', testUserId);

        if (deleteError) {
          console.log(`  ⚠️  Cleanup warning: ${deleteError.message}`);
        } else {
          console.log(`  ✅ Test data cleaned up successfully`);
        }
      }
    } catch (err) {
      console.log(`  ❌ Unexpected error during user test: ${err.message}`);
    }

    console.log('\n🎉 Database setup test completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testDatabaseSetup();