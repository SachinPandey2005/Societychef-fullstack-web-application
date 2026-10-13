import { supabase } from '../config/supabase';

export async function clearAllMockData() {
  console.log('🚀 Starting Complete CRM Mock Data Wipe in Supabase Database...');

  // Deletion sequence respecting foreign key dependencies
  const tables = [
    'dispute_cases',
    'financial_adjustments',
    'tickets',
    'chat_messages',
    'chat_threads',
    'notifications',
    'wallet_transactions',
    'wallets',
    'settlements',
    'refunds',
    'reviews',
    'order_items',
    'orders',
    'coupons',
    'dishes',
    'kitchens',
    'delivery_partners',
    'addresses',
    'societies',
    'profiles',
  ];

  for (const table of tables) {
    console.log(`  🧹 Purging table '${table}'...`);
    const { error, count } = await supabase
      .from(table)
      .delete()
      .gte('created_at', '1970-01-01T00:00:00Z');

    if (error) {
      // Fallback: try deleting with neq filter if created_at is missing on some schema variations
      const { error: err2 } = await supabase
        .from(table)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (err2) {
        console.error(`  ❌ Error clearing table '${table}':`, err2.message);
      } else {
        console.log(`  ✔ Cleared table '${table}'`);
      }
    } else {
      console.log(`  ✔ Cleared table '${table}'`);
    }
  }

  console.log('✅ ALL Mock Data in Supabase Database Purged Successfully!');
}

if (require.main === module) {
  clearAllMockData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Wipe failed:', err);
      process.exit(1);
    });
}
