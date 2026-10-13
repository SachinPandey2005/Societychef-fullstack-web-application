# Google Play Store Release Audit & Compliance Report

**Apps Audited:**
- **SocietyChef Consumer & Homechef App**: `com.societychef.app` (`apps/mobile`)
- **SocietyChef Delivery Partner App**: `com.societychef.delivery` (`apps/delivery`)

---

## 1. Executive Summary & Status Overview

| Category | Policy / Guideline Requirement | `com.societychef.app` | `com.societychef.delivery` | Action Required / Status |
| :--- | :--- | :---: | :---: | :--- |
| **App Bundle (AAB)** | Play Store requires `.aab` format for all release uploads | ✅ Configured | ✅ Configured | Ready for build via EAS (`eas build --platform android --profile production`) |
| **Package Name** | Unique reverse domain syntax | `com.societychef.app` | `com.societychef.delivery` | Compliant |
| **Target SDK Version** | Must target API 34+ (Android 14) | ✅ API 34 (SDK 52) | ✅ API 34 (SDK 52) | Compliant |
| **Account Deletion** | In-app deletion + Web URL option required by Play Policy | ⚠️ Needs UI Check | ⚠️ Needs UI Check | Add explicit "Delete Account" action & endpoint in Profile |
| **Permissions Audit** | Unused dangerous permissions dropped; just sensitive permissions declared | ✅ Minimal | ⚠️ Background Location | Requires Play Console Background Location Declaration Video & In-App Prominent Disclosure |
| **Data Safety & Privacy** | Public HTTPS Privacy Policy + Data Safety questionnaire matching data collected | ⚠️ Needs Web URL | ⚠️ Needs Web URL | Host Privacy Policy & Terms of Service on HTTPS domain |
| **Release Signing** | Upload Keystore configured in EAS or local `key.properties` | ✅ EAS Managed | ✅ EAS Managed | Opt-in to Play App Signing in Play Console |

---

## 2. Deep Dive: Code & Configuration Audit

### A. Package Identifiers & Namespaces
- **`apps/mobile/app.json`**:
  ```json
  "android": {
    "package": "com.societychef.app",
    "adaptiveIcon": { "backgroundColor": "#f3f1ea" }
  }
  ```
- **`apps/delivery/app.json`**:
  ```json
  "android": {
    "package": "com.societychef.delivery",
    "adaptiveIcon": { "backgroundColor": "#F7F9FC" }
  }
  ```
  *Verdict*: **COMPLIANT**. Valid package namespaces.

---

### B. Permissions & Background Location Policy (Crucial for `com.societychef.delivery`)

`apps/delivery/app.json` requests:
- `ACCESS_FINE_LOCATION` & `ACCESS_COARSE_LOCATION`
- `ACCESS_BACKGROUND_LOCATION`
- `FOREGROUND_SERVICE_LOCATION`

> [!WARNING]
> **Google Play Background Location Policy Mandate**:
> Google Play enforces strict auditing for `ACCESS_BACKGROUND_LOCATION`. If rejected, your app submission will be blocked.

**Mandatory Steps for Background Location Compliance**:
1. **In-App Prominent Disclosure Modal**:
   Before prompting the system permission dialog for background location in `apps/delivery`, show a custom modal dialog clearly stating:
   *"SocietyChef Delivery collects location data in the background to enable real-time order tracking for customers and assign nearby delivery jobs even when the app is closed or not in use."*
2. **Play Console Declaration**:
   Submit a 30-60 second video demonstration showing:
   - The prominent disclosure modal popping up.
   - The user accepting the disclosure.
   - Background location tracking active in the notification drawer while the screen is locked or app is in the background.

---

### C. In-App Account Deletion Requirement (Play Policy 2024 Mandate)

Google Play Developer Policy requires:
1. An **In-App Account Deletion** flow accessible inside the app (e.g. Profile → Security / Settings → Delete Account).
2. A **Web Request Form / Page** where users can request account deletion without needing the app installed.

#### Code Implementation added to Backend API:
- `DELETE /api/v1/auth/account` / `POST /api/v1/partners/delete-account`:
  - Removes or anonymizes PII (Name, Phone, Email, Avatar, Documents).
  - Retains historical transaction records (Orders, Earnings) marked as `ANONYMIZED` for tax/dispute compliance.

---

### D. Production EAS Build & Release Signing Configuration

In `apps/delivery/eas.json` and root `eas.json`:
```json
{
  "build": {
    "production": {
      "distribution": "store",
      "android": {
        "buildType": "app-bundle"
      },
      "autoIncrement": true
    }
  }
}
```

- Build command for Play Store submission:
  ```bash
  eas build --platform android --profile production
  ```
- Submits directly to Play Console via EAS Submit:
  ```bash
  eas submit --platform android
  ```

---

## 3. Play Console Pre-Submission Checklist

- [ ] **Developer Account Registration**: Active Google Play Console account ($25 one-time fee).
- [ ] **Closed Testing Requirement (New Accounts)**:
  - If your Play Console account was created after Nov 2023, Google requires **12+ opt-in testers for 14 continuous days** before production access is enabled.
- [ ] **Store Listing Assets**:
  - **App Icon**: 512×512 32-bit PNG (no transparency alpha).
  - **Feature Graphic**: 1024×500 PNG/JPEG.
  - **Screenshots**: Minimum 2 screenshots for Phone (16:9 or 18:9 aspect ratio).
- [ ] **Data Safety Form Questionnaire**:
  - **Location**: Collected & Shared (for real-time order delivery tracking).
  - **Personal Info**: Name, Phone Number, Address (App functionality, account management).
  - **Financial Info**: Bank Account Number, IFSC, UPI ID (for rider payout settlement).
- [ ] **Content Rating (IARC)**: Complete questionnaire (select Food Delivery / Marketplace category).
- [ ] **Privacy Policy HTTPS URLs**:
  - Host live privacy policy at `https://societychef.com/privacy-policy` and point Play Console's Privacy Policy field to this link.
- [ ] **Reviewer Test Credentials**:
  - Provide test phone numbers and OTP in **App Content → Reviewer Access**:
    - Test Customer: `9876543210` (OTP `123456`)
    - Test Rider Partner: `9999988888` (OTP `123456`)

---

## 4. Required Action Items & Code Adjustments

1. **Host Legal & Privacy Policy**:
   Publish privacy policy and account deletion policy web page on your HTTPS domain or Firebase Hosting.
2. **Background Location Video Recording**:
   Record a short 45-second screen capture of `apps/delivery` showing background tracking and location disclosure dialog.
3. **Build AAB Files**:
   Run `eas build --platform android --profile production` for both `com.societychef.app` and `com.societychef.delivery`.
