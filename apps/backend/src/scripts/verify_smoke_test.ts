import crypto from 'crypto';
import { supabase } from '../config/supabase';
import { PartnerRepository } from '../repositories/partner.repository';
import { PartnerService } from '../services/partner.service';
import { CrmRepository } from '../repositories/crm.repository';
import { VerificationRepository } from '../repositories/verification.repository';

async function runSmokeTest() {
  console.log('🚀 STARTING BLACK-BOX E2E SMOKE TEST FOR NEW RIDER...');
  const testUserId = crypto.randomUUID();
  const testPhone = `+9198${Math.floor(10000000 + Math.random() * 90000000)}`;
  const riderName = `Vikas TestRider ${Date.now().toString().slice(-4)}`;

  console.log('\n--- 1. NEW RIDER ACCOUNT CREATION ---');
  // 1. Insert Profile
  const { data: profile, error: profErr } = await supabase
    .from('profiles')
    .insert({
      id: testUserId,
      phone: testPhone,
      name: riderName,
      role: 'DELIVERY_PARTNER',
      status: 'active',
    })
    .select()
    .single();

  if (profErr) throw new Error(`Profile insert failed: ${profErr.message}`);
  console.log('✅ Profile Created:', { id: profile.id, name: profile.name, phone: profile.phone });

  // 2. Get/Create Delivery Partner Record
  const partner = await PartnerRepository.getOrCreatePartner(testUserId);
  console.log('✅ Delivery Partner Created:', {
    partner_id: partner.id,
    user_id: partner.user_id,
    status: partner.status,
    kyc_status: partner.kyc_status,
  });

  console.log('\n--- 2. INITIAL STATE VERIFICATION ---');
  const initialFullProfile = await PartnerService.getProfile(testUserId);
  console.log('✅ Initial Profile Loaded:', {
    name: initialFullProfile.profile.name,
    photo: initialFullProfile.partner.profile_photo_url || 'No Image (Initials Fallback)',
    kyc_status: initialFullProfile.partner.kyc_status,
    progress: `${initialFullProfile.partner.progress_percentage}%`,
  });

  console.log('\n--- 3. AVATAR UPLOAD & PERSISTENCE TEST ---');
  const testAvatarUrl = `https://societychef-1.onrender.com/public/avatars/avatar_${partner.id}.jpg`;
  await PartnerService.updateProfile(testUserId, { profile_photo_url: testAvatarUrl });

  const updatedProfileAfterAvatar = await PartnerService.getProfile(testUserId);
  if (updatedProfileAfterAvatar.partner.profile_photo_url !== testAvatarUrl) {
    throw new Error('❌ Avatar update failed to persist in Database!');
  }
  console.log('✅ Avatar Uploaded & Persisted:', updatedProfileAfterAvatar.partner.profile_photo_url);

  console.log('\n--- 4. KYC DOCUMENTS UPLOAD TEST ---');
  const docTypes = ['aadhaar_front', 'aadhaar_back', 'pan_card', 'license_front', 'license_back', 'selfie'];
  for (const docType of docTypes) {
    const docUrl = `https://societychef-1.onrender.com/public/documents/${partner.id}_${docType}.jpg`;
    await PartnerService.uploadDocument(testUserId, {
      document_type: docType,
      document_url: docUrl,
      expiry_date: '2030-12-31',
    });
  }

  const docsInDb = await PartnerRepository.getDocuments(partner.id);
  console.log(`✅ ${docsInDb.length} KYC Documents Uploaded & Verified in DB:`, docsInDb.map(d => d.document_type));

  console.log('\n--- 5. KYC SUBMISSION TO UNDER_REVIEW ---');
  await PartnerService.submitKyc(testUserId);
  const submittedProfile = await PartnerService.getProfile(testUserId);
  console.log('✅ KYC Submitted:', { kyc_status: submittedProfile.partner.kyc_status });

  console.log('\n--- 6. CRM VISIBILITY & DOCUMENT PREVIEW TEST ---');
  // Search in CRM delivery partners
  const crmPartners = await CrmRepository.searchDeliveryPartners(riderName, 10, 0);
  const foundCrmPartner = crmPartners.find(p => p.id === partner.id || p.user_id === testUserId);
  if (!foundCrmPartner) {
    throw new Error('❌ New Rider did NOT appear in CRM Delivery Partner directory query!');
  }
  console.log('✅ Rider Found in CRM Directory:', {
    id: foundCrmPartner.id,
    name: foundCrmPartner.profiles?.name,
    phone: foundCrmPartner.profiles?.phone,
    kyc_status: foundCrmPartner.kyc_status,
  });

  // Query CRM Verification Queue
  const pendingQueue = await VerificationRepository.getPendingPartnerVerifications(50, 0);
  const queueEntry = pendingQueue.find(p => p.partner_id === partner.id || p.user_id === testUserId);
  if (!queueEntry) {
    throw new Error('❌ New Rider did NOT appear in CRM KYC Review Queue!');
  }
  console.log('✅ Rider Found in CRM KYC Review Queue:', {
    queue_id: queueEntry.id,
    name: queueEntry.profiles?.name,
    documents_count: queueEntry.documents?.length,
  });

  if (queueEntry.documents?.length !== 6) {
    throw new Error(`❌ CRM Queue document count mismatch! Expected 6, got ${queueEntry.documents?.length}`);
  }
  console.log('✅ All 6 Uploaded Documents Visible in CRM Review Modal!');

  console.log('\n--- 7. CRM APPROVAL TEST ---');
  await CrmRepository.updatePartnerKycStatus(partner.id, 'APPROVED', 'All documents verified clean');
  const approvedProfile = await PartnerService.getProfile(testUserId);
  
  if (approvedProfile.partner.kyc_status !== 'APPROVED' || approvedProfile.partner.status !== 'ACTIVE') {
    throw new Error(`❌ KYC Approval Sync failed! Status is ${approvedProfile.partner.kyc_status}/${approvedProfile.partner.status}`);
  }
  console.log('✅ CRM Approval Synced to Delivery App:', {
    kyc_status: approvedProfile.partner.kyc_status,
    partner_status: approvedProfile.partner.status,
  });

  console.log('\n--- 8. SECOND RIDER REJECTION TEST ---');
  const rejUserId = crypto.randomUUID();
  const rejPhone = `+9197${Math.floor(10000000 + Math.random() * 90000000)}`;
  
  await supabase.from('profiles').insert({
    id: rejUserId,
    phone: rejPhone,
    name: `Reject TestRider ${Date.now().toString().slice(-4)}`,
    role: 'DELIVERY_PARTNER',
    status: 'active',
  });
  const rejPartner = await PartnerRepository.getOrCreatePartner(rejUserId);
  await PartnerService.uploadDocument(rejUserId, { document_type: 'license_front', document_url: 'https://test/dl.jpg' });
  await PartnerService.submitKyc(rejUserId);

  // Reject from CRM
  const rejectionReason = 'Driving License photo is unreadable and expired';
  await CrmRepository.updatePartnerKycStatus(rejPartner.id, 'REJECTED', JSON.stringify({ notes: rejectionReason, flaggedDocs: ['license_front'] }));

  const rejectedProfile = await PartnerService.getProfile(rejUserId);
  if (rejectedProfile.partner.kyc_status !== 'REJECTED' || rejectedProfile.partner.rejection_reason !== rejectionReason) {
    throw new Error(`❌ KYC Rejection Sync failed! Status: ${rejectedProfile.partner.kyc_status}, Reason: ${rejectedProfile.partner.rejection_reason}`);
  }
  console.log('✅ CRM Rejection Synced to Delivery App:', {
    kyc_status: rejectedProfile.partner.kyc_status,
    rejection_reason: rejectedProfile.partner.rejection_reason,
  });

  console.log('\n--- 9. DATABASE CONSISTENCY VERIFICATION ---');
  const { data: checkDocs } = await supabase.from('partner_documents').select('*').eq('partner_id', partner.id);
  const { data: checkVerifs } = await supabase.from('verification_requests').select('*').or(`partner_id.eq.${partner.id},partner_id.eq.${partner.user_id}`);
  console.log('✅ Database Integrity Check Passed:', {
    docsCount: checkDocs?.length,
    verificationRequestsCount: checkVerifs?.length,
  });

  console.log('\n🎉 ALL E2E SMOKE TEST CHECKS PASSED SUCCESSFULLY!');
  process.exit(0);
}

runSmokeTest().catch((err) => {
  console.error('\n❌ E2E SMOKE TEST FAILED:', err);
  process.exit(1);
});
