const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('SUPABASE_URL:', process.env.SUPABASE_URL);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function test() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'admin@homechef.com',
    password: 'admin123',
  });

  if (error) {
    console.error('Supabase signInWithPassword ERROR:', error.message, error);
  } else {
    console.log('Sign in SUCCESS! User ID:', data.user.id);
    
    // Check profile table
    const { data: profile, error: profErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();
      
    console.log('Profile query result:', profile);
    console.log('Profile query error:', profErr);
  }
}

test();
