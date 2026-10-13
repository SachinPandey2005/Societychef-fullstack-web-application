const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function signupAdmin() {
  const email = 'admin@homechef.com';
  const password = 'admin123';

  console.log('Attempting signUp with standard auth API...');

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: 'Super Admin'
      }
    }
  });

  if (error) {
    console.error('SignUp Error:', error.message, error);
  } else {
    console.log('SignUp Data:', data);
    console.log('User created/signed up:', data.user?.email, 'ID:', data.user?.id);
  }

  // Also test signInWithPassword right after
  console.log('\nTesting signInWithPassword...');
  const { data: loginData, error: loginErr } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (loginErr) {
    console.error('Login error:', loginErr.message);
  } else {
    console.log('🎉 SUCCESSFUL LOGIN! User ID:', loginData.user.id);
  }
}

signupAdmin();
