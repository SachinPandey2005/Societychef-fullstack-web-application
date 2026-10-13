const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function setSuperAdminRole() {
  const userId = 'aea22971-e6b9-4670-a3d6-6b59532783d8';
  console.log('Updating profile role to super_admin for userId:', userId);

  const { data, error } = await supabase
    .from('profiles')
    .update({
      role: 'super_admin',
      roles: ['super_admin'],
      active_role: 'super_admin'
    })
    .eq('id', userId)
    .select();

  console.log('Updated Profile:', data);
  console.log('Update Error:', error);
}

setSuperAdminRole();
