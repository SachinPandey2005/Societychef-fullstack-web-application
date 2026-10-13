const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function testLogin() {
  console.log('Testing signInWithPassword with admin@homechef.com...');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@homechef.com',
    password: 'admin123'
  });

  console.log('SignIn Data:', data);
  console.log('SignIn Error:', error);
}

testLogin();
