# Delivery Rider KYC CRM Verification Integration Architecture

## 1. Purpose & Overview
This document specifies the technical architecture, data flows, database schemas, storage path resolutions, and CRM approval workflows for Delivery Rider KYC Document verification in Society Chef.

## 2. End-to-End KYC Architecture Flow

```
DELIVERY APP
  │
  ├─► Upload Documents (Aadhaar, PAN, DL, Selfie)
  │      │
  │      ▼
  │  SUPABASE STORAGE (`partner-documents` bucket)
  │      │
  │      ▼
  │  DATABASE RECORDS (`partner_documents` table)
  │      │
  │      ▼
  │  KYC STATUS UPDATED (`delivery_partners.kyc_status = 'UNDER_REVIEW'`)
  │
  ▼
CRM REVIEW QUEUE (`GET /api/v1/crm/verification`)
  │
  ▼
CRM FLEET ADMIN (`Delivery Fleet → KYC Review Queue`)
  │
  ▼
INSPECT & REVIEW RIDER (`KycReviewModal`)
  │
  ├─► Zoom & View 6 Documents from Supabase Storage
  │
  ├─► [APPROVE KYC]
  │      │
  │      ▼
  │  `POST /api/v1/crm/delivery-partners/:id/kyc/approve`
  │      │
  │      ├─► `delivery_partners.kyc_status = 'APPROVED'` & `status = 'ACTIVE'`
  │      ├─► `partner_documents.status = 'APPROVED'`
  │      └─► `notifications` record created (`type: 'KYC_STATUS'`)
  │
  └─► [REJECT KYC]
         │
         ▼
     `POST /api/v1/crm/delivery-partners/:id/kyc/reject`
         │
         ├─► `delivery_partners.kyc_status = 'REJECTED'` & `status = 'SUSPENDED'`
         ├─► Flagged `partner_documents.status = 'REJECTED'`
         └─► `notifications` record created with rejection reason
```

## 3. Database Schema & Relationships

### Core Entities
1. `profiles`: `id`, `full_name`, `phone`, `role`.
2. `delivery_partners`: `id`, `user_id`, `vehicle_type`, `kyc_status`, `status`, `rejection_reason`.
3. `partner_documents`: `id`, `partner_id`, `document_type`, `document_number`, `document_url`, `status`, `rejection_reason`.
4. `verification_requests`: `id`, `partner_id`, `status`, `notes`, `created_at`.
5. `notifications`: `id`, `user_id`, `title`, `message`, `type = 'KYC_STATUS'`.

### Document Types Enum
- `aadhaar_front`: Aadhaar Card Front
- `aadhaar_back`: Aadhaar Card Back
- `pan_card`: PAN Card Details
- `license_front`: Driving License Front
- `license_back`: Driving License Back
- `selfie`: Live Selfie Portrait Verification

## 4. Status Alignment Model
```
Delivery App Status:  UNDER_REVIEW  ──► APPROVED / REJECTED
Database Status:      UNDER_REVIEW  ──► APPROVED / REJECTED
CRM Status Badge:     UNDER_REVIEW  ──► APPROVED / REJECTED
```

## 5. Security & Access Policy
- **CRM RBAC**: Only authorized CRM roles (`OPERATIONS`, `SUPPORT_AGENT`, `admin`, `SUPER_ADMIN`) can access `GET /crm/verification` and trigger approval/rejection endpoints.
- **Rider Duty Guard**: Backend returns `HTTP 403 Forbidden` (`"Complete identity verification before accepting deliveries."`) when an unverified rider attempts to toggle duty status to `ONLINE`.
