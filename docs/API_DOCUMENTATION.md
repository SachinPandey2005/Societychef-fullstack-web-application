# HomeChef Platform API Documentation
## Backend Services & Endpoints Catalog

This document details the core REST API endpoints available on the HomeChef backend, including authentication schemas, request bodies, response models, and error behaviors.

---

## 1. Authentication & Security
All protected endpoints require a JWT token passed in the `Authorization` header as:
`Authorization: Bearer <JWT_TOKEN>`

### 1.1 Refresh JWT Token
* **Endpoint:** `POST /api/v1/auth/refresh`
* **Access:** Public
* **Request Body:**
```json
{
  "refresh_token": "string"
}
```
* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "session": {
      "access_token": "eyJhbG...",
      "refresh_token": "def456...",
      "expires_in": 3600
    }
  }
}
```

---

## 2. Delivery Partner Operations
All endpoints below are prefixed with `/api/v1/crm/delivery-partners` (Ops Admin role required) or `/api/v1/delivery` (Rider role required).

### 2.1 Search & Filter Riders
* **Endpoint:** `GET /api/v1/crm/delivery-partners`
* **Access:** Admin / Ops
* **Query Parameters:**
  - `query` (string, optional) - matches name or phone
  - `page` (number, optional, default: 1)
  - `limit` (number, optional, default: 10)
  - `status` (string, optional) - filter by status (`ONLINE`, `OFFLINE`, `BUSY`, `SUSPENDED`)
* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Delivery partners retrieved",
  "data": [
    {
      "id": "e8e19c96-...",
      "status": "AVAILABLE",
      "kyc_status": "APPROVED",
      "vehicle_type": "MOTORCYCLE",
      "profiles": {
        "name": "Ramesh Kumar",
        "phone": "+919876543210"
      }
    }
  ]
}
```

### 2.2 Rejection & Flag KYC Submit
* **Endpoint:** `POST /api/v1/crm/delivery-partners/:id/kyc/reject`
* **Access:** Admin / Ops
* **Request Body:**
```json
{
  "reason": "PAN card signature does not match profile name",
  "flaggedDocs": ["PAN Card"]
}
```
* **Response (200 OK):**
```json
{
  "success": true,
  "message": "KYC rejected successfully",
  "data": {
    "id": "e8e19c96-...",
    "kyc_status": "REJECTED",
    "rejection_reason": "PAN card signature does not match profile name"
  }
}
```

---

## 3. Order Lifecycle Dispatching
Riders transition assignments through state machine gates.

### 3.1 Push GPS coordinate
* **Endpoint:** `POST /api/v1/delivery/assignments/:id/tracking`
* **Access:** Delivery Partner
* **Request Body:**
```json
{
  "lat": 12.9716,
  "lng": 77.5946
}
```
* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Tracking updated"
}
```
Writes location coordinates synchronously to both `delivery_tracking` and the hardened `delivery_partner_location` table.
