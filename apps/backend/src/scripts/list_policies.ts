import { supabase } from '../config/supabase';

async function run() {
  console.log('Querying partner documents...');
  const partnerId = '7852b4ca-c993-4e4a-b9d3-ccb989f2183f';
  const { data, error } = await supabase
    .from('partner_documents')
    .select('*')
    .eq('partner_id', partnerId);

  console.log('Documents list:', data || error);
}

run();
