import { PartnerRepository } from '../repositories/partner.repository';
import { AuthRepository } from '../repositories/auth.repository';
import { supabase } from '../config/supabase';

export class PartnerService {
  static async getProfile(userId: string): Promise<any> {
    let profile = await AuthRepository.findProfileById(userId);
    if (!profile) {
      profile = await AuthRepository.createProfile({
        id: userId,
        phone: `+91 ${userId.slice(-10)}`,
        name: `Rider ${userId.slice(-4)}`,
        role: 'DELIVERY_PARTNER',
        status: 'ACTIVE',
      });
    }

    const partner = await PartnerRepository.getOrCreatePartner(userId);
    const documents = await PartnerRepository.getDocuments(partner.id);
    const vehicle = await PartnerRepository.getVehicle(partner.id);
    const bank = await PartnerRepository.getBank(partner.id);
    const emergencyContact = await PartnerRepository.getEmergencyContact(partner.id);
    const society = await PartnerRepository.getSocietyAssignment(partner.id);

    // Calculate onboarding progress percentage
    let completedSteps = 0;
    const totalSteps = 7;

    if (profile.name && partner.gender && partner.date_of_birth) completedSteps++; // step 1: personal
    if (partner.current_address && partner.permanent_address) completedSteps++;    // step 2: address
    if (vehicle) completedSteps++;                                                  // step 3: vehicle
    if (documents.some(d => d.document_type.startsWith('aadhaar')) && documents.some(d => d.document_type === 'pan_card')) completedSteps++; // step 4: ID docs
    if (bank) completedSteps++;                                                     // step 5: bank
    if (emergencyContact) completedSteps++;                                         // step 6: emergency
    if (partner.kyc_status !== 'PENDING') completedSteps++;                         // step 7: submitted

    const progressPercentage = Math.round((completedSteps / totalSteps) * 100);

    return {
      profile: {
        id: profile.id,
        phone: profile.phone,
        email: profile.email,
        name: profile.name,
        role: profile.role,
        status: profile.status,
      },
      partner: {
        id: partner.id,
        vehicle_type: partner.vehicle_type,
        status: partner.status,
        gender: partner.gender,
        date_of_birth: partner.date_of_birth,
        blood_group: partner.blood_group,
        preferred_language: partner.preferred_language,
        profile_photo_url: partner.profile_photo_url,
        permanent_address: partner.permanent_address,
        current_address: partner.current_address,
        city: partner.city,
        state: partner.state,
        pincode: partner.pincode,
        landmark: partner.landmark,
        kyc_status: partner.kyc_status,
        rejection_reason: partner.rejection_reason,
        progress_percentage: progressPercentage,
      },
      documents,
      vehicle,
      bank,
      emergencyContact,
      society,
    };
  }

  static async updateProfile(userId: string, body: any): Promise<any> {
    const partner = await PartnerRepository.getOrCreatePartner(userId);

    // Split fields for profiles table vs delivery_partners table
    const profileUpdates: any = {};
    if (body.name !== undefined) profileUpdates.name = body.name;
    if (body.email !== undefined) profileUpdates.email = body.email;

    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileErr } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', userId);
      if (profileErr) throw profileErr;
    }

    const partnerUpdates: any = {};
    const partnerFields = [
      'gender', 'date_of_birth', 'blood_group', 'preferred_language', 
      'profile_photo_url', 'permanent_address', 'current_address', 
      'city', 'state', 'pincode', 'landmark'
    ];

    for (const field of partnerFields) {
      if (body[field] !== undefined) {
        partnerUpdates[field] = body[field];
      }
    }

    if (Object.keys(partnerUpdates).length > 0) {
      await PartnerRepository.updatePartner(partner.id, partnerUpdates);
    }

    // Handle emergency contacts updates if passed
    const contactUpdates: any = {};
    const contactFields = [
      'primary_name', 'primary_phone', 'primary_relationship',
      'secondary_name', 'secondary_phone', 'secondary_relationship'
    ];

    for (const field of contactFields) {
      if (body[field] !== undefined) {
        contactUpdates[field] = body[field];
      }
    }

    if (contactUpdates.primary_name && contactUpdates.primary_phone) {
      await PartnerRepository.upsertEmergencyContact(partner.id, contactUpdates);
    }

    return this.getProfile(userId);
  }

  static async uploadDocument(userId: string, body: any): Promise<any> {
    const partner = await PartnerRepository.getOrCreatePartner(userId);
    const doc = await PartnerRepository.upsertDocument(partner.id, body);
    
    // Auto trigger KYC under review check if all major docs are uploaded
    try {
      await this.evaluateKycAutoTransition(partner.id);
    } catch (err: any) {
      console.warn('[PartnerService] evaluateKycAutoTransition warning:', err?.message || err);
    }
    
    return doc;
  }

  static async updateVehicle(userId: string, body: any): Promise<any> {
    const partner = await PartnerRepository.getOrCreatePartner(userId);
    const vehicle = await PartnerRepository.upsertVehicle(partner.id, body);
    
    // Also update base vehicle type on delivery partners
    await PartnerRepository.updatePartner(partner.id, { vehicle_type: body.vehicle_type });
    return vehicle;
  }

  static async updateBank(userId: string, body: any): Promise<any> {
    const partner = await PartnerRepository.getOrCreatePartner(userId);
    return PartnerRepository.upsertBank(partner.id, body);
  }

  static async submitKyc(userId: string): Promise<any> {
    const partner = await PartnerRepository.getOrCreatePartner(userId);
    
    // Set status to UNDER_REVIEW
    const updatedPartner = await PartnerRepository.updatePartner(partner.id, {
      kyc_status: 'UNDER_REVIEW',
      rejection_reason: null,
    });

    // Write audit log entry
    await PartnerRepository.insertVerificationLog(partner.id, 'SUBMITTED');

    // Create or update pending verification request in the queue table
    await PartnerRepository.createOrUpdateVerificationRequest(partner.id);

    return updatedPartner;
  }

  static async getSocietyAssignment(userId: string): Promise<any> {
    const partner = await PartnerRepository.getOrCreatePartner(userId);
    return PartnerRepository.getSocietyAssignment(partner.id);
  }

  private static async evaluateKycAutoTransition(partnerId: string): Promise<void> {
    const documents = await PartnerRepository.getDocuments(partnerId);
    const requiredDocs = ['aadhaar_front', 'aadhaar_back', 'pan_card', 'license_front', 'license_back', 'selfie'];
    const uploadedTypes = documents.map(d => d.document_type);

    // If rider has uploaded at least 1 document, make sure a verification request exists for CRM visibility
    if (documents.length > 0) {
      await PartnerRepository.createOrUpdateVerificationRequest(partnerId);
    }

    const hasAllRequired = requiredDocs.every(type => uploadedTypes.includes(type));
    if (hasAllRequired) {
      const partner = await PartnerRepository.updatePartner(partnerId, {});
      if (partner.kyc_status === 'PENDING') {
        await PartnerRepository.updatePartner(partnerId, { kyc_status: 'UNDER_REVIEW' });
        await PartnerRepository.insertVerificationLog(partnerId, 'SUBMITTED');
        await PartnerRepository.createOrUpdateVerificationRequest(partnerId);
      }
    }
  }
}
