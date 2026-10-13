import { supabase } from './config/supabase';

async function main() {
  console.log('--- Cleaning up duplicate verification_requests ---');
  // Update pending request for sds to APPROVED or delete duplicate
  const { error } = await supabase
    .from('verification_requests')
    .update({ status: 'APPROVED' })
    .eq('id', 'a4f98309-a9c7-4d77-8547-f1839adf0194');

  if (error) {
    console.log('Update error (expected constraint):', error.message);
    // Delete the duplicate row
    const { error: delErr } = await supabase
      .from('verification_requests')
      .delete()
      .eq('id', 'a4f98309-a9c7-4d77-8547-f1839adf0194');
    console.log('Delete status:', delErr ? delErr.message : 'Deleted pending duplicate successfully');
  } else {
    console.log('Updated successfully');
  }

  process.exit(0);
}

main().catch(console.error);
