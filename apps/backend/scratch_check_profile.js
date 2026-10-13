const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function checkProfile() {
  const userId = 'aea22971-e6b9-4670-a3d6-6b59532783d8';
  console.log('Querying profile for userId:', userId);

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId);

  console.log('Profile Data:', data);
  console.log('Profile Error:', error);

  // If profile doesn't exist or doesn't have super_admin role, let's insert or update it
  if (!data || data.length === 0) {
    console.log('Inserting profile into public.profiles...');
    const { data: inserted, error: insErr } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: 'admin@homechef.com',
        name: 'Super Admin',
        role: 'super_admin',
        status: 'active'
      })
      .select();
    console.log('Inserted profile:', inserted);
    console.log('Insert error:', insErr);
  }
}

checkProfile();
