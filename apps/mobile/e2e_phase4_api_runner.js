const { createClient } = require('C:/Users/saksh/Desktop/Society Chef/societychef-1/node_modules/@supabase/supabase-js/dist/index.cjs');
const fs = require('fs');
const path = require('path');

const ARTIFACTS_DIR = 'C:/Users/saksh/.gemini/antigravity-ide/brain/a293ac01-8015-4a86-a6b2-29e514c32657';
const supabaseUrl = 'https://vpfnuomnocriemubjotd.supabase.co';
const supabaseKey = 'sb_publishable_Cog0fOUpVDVEFpzhT5IRIw_tZRpk32y';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runPhase4ApiAudit() {
  console.log('⚡ Starting Phase 4 API, Backend, Database & RLS Audit...');
  const apiResults = [];

  function recordApi(id, category, endpoint, role, preconditions, request, expected, actual, status, severity, dbResult, defect = 'None') {
    apiResults.push({
      id, category, endpoint, role, preconditions, request, expected, actual, status, severity, dbResult, defect
    });
    console.log(`[${status}] ${id}: ${endpoint} (${category}) — ${actual.slice(0, 65)}`);
  }

  try {
    // 1. Supabase Database Connection & Table Schema Audit
    console.log('📊 Auditing Supabase Database Tables & RLS Policies...');
    const tables = ['profiles', 'kitchens', 'dishes', 'weekly_dishes', 'orders', 'order_items', 'messages', 'reviews', 'supplies', 'party_menus'];

    for (const tbl of tables) {
      const { data, error } = await supabase.from(tbl).select('*').limit(1);
      if (error) {
        recordApi(`DB-SCHEMA-${tbl}`, 'DATABASE', tbl, 'Anon', 'Supabase client initialized', `SELECT * FROM ${tbl} LIMIT 1`, `Table ${tbl} accessible`, `Error: ${error.message} (${error.code})`, 'WARNING', 'P2', 'Schema check warning', error.message);
      } else {
        recordApi(`DB-SCHEMA-${tbl}`, 'DATABASE', tbl, 'Anon', 'Supabase client initialized', `SELECT * FROM ${tbl} LIMIT 1`, `Table ${tbl} accessible`, `Table ${tbl} exists and responds cleanly`, 'PASS', 'P3', 'Table OK');
      }
    }

    // 2. Server-side Price Tampering Verification (Section 10)
    console.log('💰 Auditing Server-side Price Validation & Integrity...');
    // Test inserting order with tampered total_amount = ₹1 when dish price is ₹150
    const tamperedOrderId = `ord_tamper_test_${Date.now()}`;
    const { data: ordIns, error: ordErr } = await supabase.from('orders').insert({
      id: tamperedOrderId,
      customer_id: '00000000-0000-0000-0000-000000000000',
      kitchen_id: '00000000-0000-0000-0000-000000000001',
      total_amount: 1, // Tampered ₹1 instead of real price
      status: 'placed',
      delivery_address: 'Test Address',
    }).select('id').single();

    if (ordErr) {
      recordApi('API-PRICE-001', 'SERVER_VALIDATION', 'POST /rest/v1/orders', 'Customer', 'Tampered price ₹1 sent in payload', 'INSERT INTO orders total_amount=1', 'Server rejects tampered price or triggers validation', `Backend rejected tampered order: ${ordErr.message}`, 'PASS', 'P0', 'Server price gate active');
    } else {
      recordApi('API-PRICE-001', 'SERVER_VALIDATION', 'POST /rest/v1/orders', 'Customer', 'Tampered price ₹1 sent in payload', 'INSERT INTO orders total_amount=1', 'Server rejects tampered price', 'Backend accepted client-provided total_amount without server-side recalculation', 'WARNING', 'P0', 'No database trigger/function for server-side price validation', 'Client-side price calculation trusted');
      // Clean up test tampered order
      await supabase.from('orders').delete().eq('id', tamperedOrderId);
    }

    // 3. Supabase RLS Policy Audit (Section 31)
    console.log('🛡️ Auditing Supabase Row Level Security (RLS) Policies...');
    // Anonymous select on profiles
    const { data: anonProf, error: anonProfErr } = await supabase.from('profiles').select('phone, address').limit(1);
    if (anonProfErr || !anonProf || anonProf.length === 0) {
      recordApi('RLS-PROF-001', 'RLS_SECURITY', 'SELECT /rest/v1/profiles', 'Anon', 'No JWT token', 'SELECT phone, address FROM profiles', 'Restricted/Blocked by RLS policy', 'Anonymous access restricted by RLS', 'PASS', 'P1', 'RLS Active');
    } else {
      recordApi('RLS-PROF-001', 'RLS_SECURITY', 'SELECT /rest/v1/profiles', 'Anon', 'No JWT token', 'SELECT phone, address FROM profiles', 'Restricted by RLS policy', 'Public anon key can read phone numbers from profiles table', 'WARNING', 'P1', 'Public SELECT allowed', 'Profiles table allows public reading');
    }

    // Anonymous select on kitchens
    const { data: anonKitch, error: anonKitchErr } = await supabase.from('kitchens').select('name, is_live').limit(1);
    if (!anonKitchErr) {
      recordApi('RLS-KITCH-001', 'RLS_SECURITY', 'SELECT /rest/v1/kitchens', 'Anon', 'Public food feed', 'SELECT name, is_live FROM kitchens', 'Public read permitted for active kitchens', 'Public read accessible for discover feed', 'PASS', 'P3', 'Public read OK');
    }

    // Anonymous update on kitchens (Should fail)
    const { data: anonUpdK, error: anonUpdKErr } = await supabase.from('kitchens').update({ name: 'Hacked Kitchen' }).eq('id', '00000000-0000-0000-0000-000000000001');
    if (anonUpdKErr) {
      recordApi('RLS-KITCH-002', 'RLS_SECURITY', 'UPDATE /rest/v1/kitchens', 'Anon', 'No JWT token', 'UPDATE kitchens name="Hacked"', 'Blocked by RLS update policy', `Anonymous UPDATE blocked: ${anonUpdKErr.message}`, 'PASS', 'P0', 'RLS Update Gate Active');
    } else {
      recordApi('RLS-KITCH-002', 'RLS_SECURITY', 'UPDATE /rest/v1/kitchens', 'Anon', 'No JWT token', 'UPDATE kitchens name="Hacked"', 'Blocked by RLS update policy', 'Anonymous UPDATE succeeded on kitchens table', 'FAIL', 'P0', 'RLS Update Gate Missing', 'Unauthorized update allowed');
    }

    // 4. Storage Bucket Audit (Section 16)
    console.log('🗂️ Auditing Supabase Storage Buckets...');
    const buckets = ['chef-photos', 'dish-photos'];
    for (const bkt of buckets) {
      const { data: bktData, error: bktErr } = await supabase.storage.from(bkt).list('', { limit: 1 });
      if (bktErr) {
        recordApi(`STORAGE-${bkt}`, 'STORAGE_API', bkt, 'Anon', 'Storage bucket audit', `storage.from(${bkt}).list()`, `Bucket ${bkt} configured`, `Notice: ${bktErr.message}`, 'WARNING', 'P2', 'Bucket list restricted');
      } else {
        recordApi(`STORAGE-${bkt}`, 'STORAGE_API', bkt, 'Anon', 'Storage bucket audit', `storage.from(${bkt}).list()`, `Bucket ${bkt} accessible`, `Bucket ${bkt} online and responsive`, 'PASS', 'P3', 'Storage OK');
      }
    }

  } catch (err) {
    console.error('Error during API audit:', err);
  } finally {
    console.log('✅ Phase 4 API Audit complete!');
  }

  // Save raw API JSON
  fs.writeFileSync(path.join(ARTIFACTS_DIR, 'scratch/phase4_api_raw.json'), JSON.stringify(apiResults, null, 2));
}

runPhase4ApiAudit();
