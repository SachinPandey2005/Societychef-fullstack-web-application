# Delivery Rider Optional Onboarding Architecture

## 1. Purpose & Overview
This document specifies the technical architecture and implementation for the Delivery Rider Onboarding System in Society Chef. Riders can create a basic profile and enter the Main Delivery App immediately without being forced to upload identity documents, vehicle registrations, or bank details during initial sign-up.

## 2. Onboarding Flow Comparison

### Previous Flow (Blocking)
```
LOGIN ──► ONBOARDING STEPPER ──► UPLOAD ALL DOCUMENTS ──► SUBMIT KYC ──► UNDER REVIEW ──► BLOCKED
```

### New Flow (Optional & Immediate Access)
```
LOGIN
  │
  ▼
BASIC RIDER PROFILE (Name, Email, Language)
  │
  ▼
SAVE PROFILE & SYNC TO BACKEND/CRM
  │
  ▼
MAIN DELIVERY APP (Dashboard, Profile, Orders, Wallet, Support)
  │
  ├─► PROFILE → COMPLETE SETUP
  │      ├─► Optional Identity Verification (Aadhaar, PAN, DL, Selfie)
  │      ├─► Optional Vehicle Details (Plate #, RC, Insurance)
  │      └─► Optional Bank & Payout Details (Account #, IFSC, Cheque)
  │
  └─► OPERATIONAL RESTRICTIONS (Backend Enforced)
         └─► Going Online for Deliveries ──► KYC Check ──► 403 Forbidden if Unverified
```

## 3. Required vs. Optional Fields

### Required for Basic Rider Account
- **Authentication**: Supabase Auth Session (Phone/OTP or Email).
- **Basic Rider Profile**: Full Name, Email, Preferred Language.
- **Role Assignment**: `DELIVERY_PARTNER` in RBAC.
- **Database Records**: `profiles` row + `delivery_partners` row.

### Optional (Complete Later)
- **Identity Documents**: Aadhaar Front & Back, PAN Card, Driving License.
- **Selfie Verification**: Live portrait image.
- **Vehicle Details**: Vehicle Type, Plate Number, RC Document, Insurance, PUC.
- **Bank / Payout Details**: Account Holder Name, Bank Name, Account Number, IFSC, Cancelled Cheque.
- **Emergency Contacts**: Primary and Secondary contact details.

## 4. State Model Architecture

The onboarding state is decoupled into independent entity states rather than a single global `onboardingCompleted` boolean:

```
PROFILE:
  - COMPLETED (Basic Name, Phone, Email saved)

DOCUMENTS:
  - NOT_SUBMITTED (Initial / Skipped)
  - PENDING_REVIEW (Uploaded & waiting CRM review)
  - VERIFIED (Approved by Operations)
  - REJECTED (Rejected with reason)

SELFIE:
  - NOT_SUBMITTED
  - PENDING_REVIEW
  - VERIFIED
  - REJECTED

VEHICLE:
  - NOT_COMPLETED
  - SUBMITTED
  - VERIFIED
  - REJECTED

PAYOUT:
  - NOT_CONFIGURED
  - PENDING
  - VERIFIED
  - REJECTED

KYC_STATUS:
  - PENDING (Initial / Basic Profile created)
  - UNDER_REVIEW (Submitted for audit)
  - APPROVED (Full operational access)
  - REJECTED (Application rejected)
```

## 5. Backend API & Database Flow

### Profile Creation & CRM Sync
1. Rider saves Basic Profile in Delivery App.
2. App calls `PUT /api/v1/partner/profile`.
3. Backend updates `profiles` table and `delivery_partners` table (`PartnerRepository.getOrCreatePartner`).
4. Rider immediately appears in CRM under `GET /api/v1/crm/delivery-partners` with:
   - **Name**: `John Doe`
   - **Status**: `Profile Created`
   - **KYC Status**: `Not Submitted` (`PENDING`)
   - **Documents**: `Not Submitted`
   - **Vehicle**: `Not Completed`
   - **Payout**: `Not Configured`

### Operational Restrictions
1. Rider attempts to toggle online duty status (`POST /api/v1/delivery/status` or `POST /api/v1/partner/status`).
2. Controller verifies `partner.kyc_status === 'APPROVED'`.
3. If `kyc_status !== 'APPROVED'`, backend returns `HTTP 403 Forbidden`:
   ```json
   {
     "success": false,
     "message": "Complete identity verification before accepting deliveries."
   }
   ```
4. Delivery App displays helper toast guiding rider to **Profile → Complete Setup**.

## 6. Security, RBAC & RLS Policies
- **Role Enforcement**: Basic profile creation automatically assigns `role = 'DELIVERY_PARTNER'`.
- **No Faked Verification**: Skipping optional steps never modifies `kyc_status` to `APPROVED` or generates fake document records.
- **Document Access Control**: Delivery riders can only access their own documents; CRM users require `OPERATIONS`, `SUPPORT_AGENT`, or `admin` role to review documents.

## 7. Production API Configuration
- Production Base URL: `https://societychef-1.onrender.com`
- Client configured via `process.env.EXPO_PUBLIC_API_URL`.
