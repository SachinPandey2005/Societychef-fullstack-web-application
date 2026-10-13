# SocietyChef Production Launch: Paid APIs & Cloud Infrastructure Requirements

**Prepared for:** Team Lead / Technical Lead / Project Manager  
**Modules Covered:** Customer & Homechef Mobile App, Delivery Partner App, Ops-Web CRM, and Backend API Gateway  

---

## Executive Summary

To complete end-to-end integration and launch **SocietyChef** in production, the following paid third-party APIs, cloud services, and developer accounts are required. These cover critical real-time functionality including **SMS OTP Authentication**, **Live Map Tracking & Geofencing**, **Payment Collection & Instant Settlements**, **Push Notifications**, and **Cloud Database & Media Storage**.

---

## 1. Authentication & SMS Services

| Service / Feature | Recommended Provider | Purpose | Estimated Cost / Pricing Model | Priority |
| :--- | :--- | :--- | :--- | :---: |
| **SMS OTP Gateway** | **MSG91** / **Fast2SMS** / **Twilio** | Real-time 6-digit OTP verification for Customer, Chef, and Delivery Partner phone logins. | ~₹0.15 to ₹0.25 per SMS (DLT Registration required in India) | 🔴 **CRITICAL** |
| **TRAI DLT Entity Registration** | Telecom Portal (Jio / Airtel DLT) | Required by Govt of India to send transactional OTP messages to Indian mobile numbers. | One-time ₹5,900 DLT fee | 🔴 **CRITICAL** |

---

## 2. Maps, Location & Navigation APIs

| Service / Feature | Provider | Purpose | Estimated Cost / Pricing Model | Priority |
| :--- | :--- | :--- | :--- | :---: |
| **Google Maps Platform** | Google Cloud Console | Enables interactive maps, address search autocomplete, distance matrix calculations, and real-time delivery rider tracking. | $200 free monthly credit; pay-as-you-go thereafter | 🔴 **CRITICAL** |
| - *Places API* | Google Maps | Address search and society lookup. | ~$17 per 1,000 requests | 🔴 **CRITICAL** |
| - *Directions / Distance Matrix API* | Google Maps | Accurate delivery ETA and distance (km) pricing between kitchen and customer. | ~$5 to $10 per 1,000 requests | 🔴 **CRITICAL** |
| - *Geocoding API* | Google Maps | Converts latitude/longitude to readable street address. | ~$5 per 1,000 requests | 🟠 **HIGH** |

---

## 3. Payment Gateway & Merchant Payout API

| Service / Feature | Provider | Purpose | Estimated Cost / Pricing Model | Priority |
| :--- | :--- | :--- | :--- | :---: |
| **Payment Gateway (PG)** | **Razorpay** / **Cashfree** / **PhonePe** | Collects customer payments via UPI, Credit/Debit Cards, Netbanking, and Wallets. | 2% per transaction (+ GST) | 🔴 **CRITICAL** |
| **Automated Payouts API** | **RazorpayX** / **Cashfree Payouts** | Enables 1-click or automated daily/weekly earnings transfers directly to Chef & Delivery Partner bank accounts. | ~₹2 to ₹5 per IMPS payout transaction | 🔴 **CRITICAL** |

---

## 4. Cloud Infrastructure, Database & Storage

| Service / Feature | Provider | Purpose | Estimated Cost / Pricing Model | Priority |
| :--- | :--- | :--- | :--- | :---: |
| **Database & Realtime Sockets** | **Supabase Pro** / **AWS RDS** | Managed PostgreSQL database, row-level security (RLS), and live WebSocket subscriptions for instant Ops CRM updates. | $25 / month | 🔴 **CRITICAL** |
| **Cloud File & Document Storage** | **Supabase Storage** / **AWS S3** | High-capacity cloud storage for food dish photos, rider KYC documents (Aadhaar, Driving License, RC), and avatars. | ~$5 to $15 / month (based on GB usage) | 🔴 **CRITICAL** |
| **Backend API Server Hosting** | **Render** / **AWS ECS** / **DigitalOcean** | Hosts Express.js backend server (`apps/backend`) with auto-scaling and 99.9% uptime. | ~$7 to $25 / month | 🔴 **CRITICAL** |
| **Ops Web CRM Hosting** | **Vercel Pro** / **Netlify** | Fast global CDN hosting for Ops CRM admin portal (`apps/ops-web`). | Free tier available / $20 / month for Pro | 🟢 **NORMAL** |

---

## 5. Push Notifications & Messaging Alerts

| Service / Feature | Provider | Purpose | Estimated Cost / Pricing Model | Priority |
| :--- | :--- | :--- | :--- | :---: |
| **Push Notification Server** | **Expo Push Notifications** / **Firebase Cloud Messaging (FCM)** | Loud instant notifications to Chefs when an order is placed, and to Riders when a delivery is assigned. | Free (FCM) / Included in Expo | 🔴 **CRITICAL** |
| **WhatsApp Notifications (Optional)** | **WATI** / **Gupshup** / **Interakt** | Automated WhatsApp messages for order confirmation and delivery status updates to customers. | ~₹0.30 to ₹0.80 per WhatsApp template message | 🟢 **OPTIONAL** |

---

## 6. App Store Developer Accounts & Publishing

| Account / Service | Provider | Purpose | One-Time / Recurring Fee | Priority |
| :--- | :--- | :--- | :--- | :---: |
| **Google Play Developer Account** | Google Play Console | Required to publish Android APK/AAB apps for **SocietyChef Mobile** and **SocietyChef Delivery**. | $25 (One-time fee) | 🔴 **CRITICAL** |
| **Apple Developer Program** *(If iOS targeted)* | Apple Developer | Required to build and publish iOS versions on the Apple App Store. | $99 / year | 🟠 **HIGH** |
| **Custom Domain & SSL** | **Cloudflare** / **GoDaddy** | Custom production domain (e.g. `societychef.in` or `api.societychef.com`) with HTTPS SSL security certificate. | ~$10 to $15 / year | 🔴 **CRITICAL** |

---

## Recommended Action Plan for Team Lead

1. **Immediate Setup (Day 1)**:
   - Create a Google Cloud Billing account & generate **Google Maps API Keys**.
   - Create a **Razorpay / Cashfree Merchant Account** & complete business KYC for Payment + Payout API keys.
2. **SMS & Telecom Setup (2-3 Days)**:
   - Submit DLT Entity Registration for SMS OTP delivery in India.
3. **App Store Publishing (Before Launch)**:
   - Ensure Google Play Console developer account ($25) is active for uploading Android release builds (`.aab`).
