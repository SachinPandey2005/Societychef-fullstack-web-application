import { supabase } from './config/supabase';

async function main() {
  console.log('--- Delivery Partners ---');
  const { data: partners, error: pErr } = await supabase.from('delivery_partners').select('*, profiles(*)');
  console.log('Partners:', JSON.stringify(partners, null, 2), 'Error:', pErr);

  console.log('\n--- Verification Requests ---');
  const { data: reqs, error: rErr } = await supabase.from('verification_requests').select('*');
  console.log('Verification Requests:', JSON.stringify(reqs, null, 2), 'Error:', rErr);

  process.exit(0);
}

main().catch(console.error);
