const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createAdminUser() {
  console.log('Creating or updating admin user in Supabase auth...');

  const email = 'admin@homechef.com';
  const password = 'admin123';

  // 1. Create user using Admin API (service role key)
  const { data: userData, error: createError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: 'Super Admin' }
  });

  let userId;

  if (createError) {
    console.log('createUser error or user exists:', createError.message);
    // If user already exists, let's find user by listing users
    const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.error('Failed to list users:', listError);
      return;
    }
    const existingUser = usersData.users.find(u => u.email === email);
    if (existingUser) {
      userId = existingUser.id;
      console.log('Found existing user ID:', userId);
      // Update password to admin123 to be 100% sure
      const { error: updateError } = await supabase.auth.admin.updateUserById(userId, { password });
      if (updateError) console.error('Failed to update password:', updateError);
      else console.log('Successfully updated password to admin123!');
    } else {
      console.error('Could not find user and creation failed.');
      return;
    }
  } else {
    userId = userData.user.id;
    console.log('User created successfully with ID:', userId);
  }

  // 2. Ensure profile exists in public.profiles table with role 'super_admin'
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (!existingProfile) {
    const { data: newProfile, error: profileErr } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email: email,
        name: 'Super Admin',
        role: 'super_admin',
        status: 'active'
      })
      .select()
      .single();

    if (profileErr) {
      console.error('Failed to insert profile:', profileErr);
    } else {
      console.log('Profile created successfully:', newProfile);
    }
  } else {
    const { data: updatedProfile, error: updateProfErr } = await supabase
      .from('profiles')
      .update({ role: 'super_admin', status: 'active' })
      .eq('id', userId)
      .select()
      .single();

    if (updateProfErr) {
      console.error('Failed to update profile:', updateProfErr);
    } else {
      console.log('Profile updated to super_admin:', updatedProfile);
    }
  }

  // 3. Verify login
  console.log('\nTesting login now...');
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (loginError) {
    console.error('Login test failed:', loginError);
  } else {
    console.log('🎉 LOGIN TEST SUCCESSFUL! Session token generated for admin@homechef.com.');
  }
}

createAdminUser();
