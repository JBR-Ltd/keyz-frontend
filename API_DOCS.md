# 📖 Keyz REST API — Developer Integration Reference

This is the comprehensive API specification for the **Keyz Real Estate Platform**. Use this reference to integrate the frontend applications (web or mobile) with the backend services.

---

## 📋 Table of Contents
1. [Global Integration Standards](#-global-integration-standards)
2. [Interactive Documentation via Swagger UI](#-interactive-documentation-via-swagger-ui)
3. [Endpoint Catalog](#-endpoint-catalog)
   - [1. Authentication (`/api/auth`)](#1-authentication-apiauth)
   - [2. Properties (`/api/properties`)](#2-properties-apiproperties)
   - [3. Bookings (`/api/bookings`)](#3-bookings-apibookings)
   - [4. Offers (`/api/offers`)](#4-offers-apioffers)
   - [5. Reviews (`/api/reviews`)](#5-reviews-apireviews)
   - [6. KYC & Verifications (`/api/verification`)](#6-kyc--verifications-apiverification)
   - [7. Virtual 3D & Video Tours (`/api/tours`)](#7-virtual-3d--video-tours-apitours)
   - [8. Zero-Knowledge Marketplace Chat Relay (`/api/chat`)](#8-zero-knowledge-marketplace-chat-relay-apichat)
   - [9. System Health (`/api/health`)](#9-system-health-apihealth)
4. [Standardized Error Codes](#-standardized-error-codes)

---

## 🌐 Global Integration Standards

### Base URLs

| Environment | Base URL | Description |
|---|---|---|
| **Local Development** | `http://localhost:8080` | Running on a local developer system |
| **Production API** | `https://keyz-backend-7ukk.onrender.com` | Hosted cloud environment on Render |

### Global Headers

Every API request should supply these standard headers where applicable:

| Header Name | Type | Requirement | Description |
|---|---|---|---|
| **`Content-Type`** | `String` | Required for `POST`/`PUT`/`PATCH` | Must be `application/json` (except for video uploads) |
| **`Authorization`** | `String` | Required on secure routes | Must contain the Bearer JWT token: `Bearer <token>` |
| **`X-Device-Fingerprint`**| `String` | Required on Register & Login | Browser fingerprint hash for secure login detection |
| **`User-Agent`** | `String` | Automatically sent | Sent by browser; logged for security and device context |

### Standard Response Envelope
All API responses share the same JSON envelope to guarantee predictable client-side parsing.

#### Successful Response (`200 OK`)
```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": { }
}
```

#### Validation Error Response (`400 Bad Request`)
```json
{
  "success": false,
  "message": "Validation failed",
  "data": {
    "email": "must be a valid email address",
    "password": "size must be between 8 and 32"
  }
}
```

#### Error/Failure Response
```json
{
  "success": false,
  "message": "Resource with ID 5 was not found",
  "data": null
}
```

---

## 🚀 Interactive Documentation via Swagger UI

The backend is fully configured with **OpenAPI 3 / Swagger**. It automatically parses controller signatures and models to render an interactive web playground.

*   **Access Link:** [http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html)
*   **Production Link:** [https://keyz-backend-7ukk.onrender.com/swagger-ui/index.html](https://keyz-backend-7ukk.onrender.com/swagger-ui/index.html)

### How to Authenticate & Test in Swagger
1. Submit a login request to `/api/auth/login` to obtain a JWT token.
2. Click the green **`Authorize`** button at the top right of the Swagger UI page.
3. In the dialog, paste the JWT token (just the raw token, without the `Bearer ` prefix).
4. Click **`Authorize`**. Now, all subsequent "Try it out" requests from the browser will automatically inject the `Authorization: Bearer <token>` header!

---

## 🛠️ Endpoint Catalog

### 1. Authentication (`/api/auth`)
*Endpoints in this group do not require any Authorization token.*

#### A. User Registration
`POST /api/auth/register`

Creates a new user profile on the system.

*   **Headers:**
    *   `X-Device-Fingerprint`: `<fingerprint-hash>`
*   **Request Body:**
    ```json
    {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com",
      "password": "SecurePassword123!",
      "role": "TENANT"
    }
    ```
    *(Note: role must be one of `"LANDLORD"`, `"AGENT"`, or `"TENANT"`)*
*   **Response (`200 OK` - New Registration):**
    ```json
    {
      "success": true,
      "message": "User registered successfully",
      "data": null
    }
    ```
*   **Response (`200 OK` - Pre-existing Registration):**
    ```json
    {
      "success": true,
      "message": "You have registered already",
      "data": null
    }
    ```

#### B. User Login
`POST /api/auth/login`

Authenticates credentials and registers the client's device fingerprint.

*   **Headers:**
    *   `X-Device-Fingerprint`: `<fingerprint-hash>`
*   **Request Body:**
    ```json
    {
      "email": "john@example.com",
      "password": "SecurePassword123!"
    }
    ```
*   **Response (`200 OK`):**
    ```json
    {
      "message": "Login successful",
      "data": {
        "accessToken": "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJqb2hu...",
        "role": "TENANT",
        "userId": 1,
        "email": "john@example.com",
        "firstName": "John",
        "lastName": "Doe"
      }
    }
    ```

#### C. Email Verification Onboarding
`POST /api/auth/verify-email`

Consumes the 6-digit numeric verification OTP sent to the user's email upon registration to activate their account.

*   **Query Parameters:**
    *   `email` (String): The registered email address (e.g. `john@example.com`).
    *   `token` (String): The 6-digit verification OTP (e.g. `482915`).
*   **Response (`200 OK`):**
    ```json
    {
      "success": true,
      "message": "Email verified successfully! You can now log in.",
      "data": null
    }
    ```

#### D. Forgot Password OTP Request
`POST /api/auth/forgot-password`

Triggers password recovery. Sends a 6-digit verification OTP code via Resend.

*   **Request Body:**
    ```json
    {
      "email": "john@example.com"
    }
    ```
*   **Response (`200 OK`):**
    ```json
    {
      "success": true,
      "message": "If the email exists, a reset link has been sent.",
      "data": null
    }
    ```

#### E. Password Reset
`POST /api/auth/reset-password`

Applies the password changes using the 6-digit OTP code received in the email.

*   **Request Body:**
    ```json
    {
      "token": "482915",
      "newPassword": "NewSecurePassword456!"
    }
    ```
*   **Response (`200 OK`):**
    ```json
    {
      "success": true,
      "message": "Password reset successfully",
      "data": null
    }
    ```

---

### 2. Properties (`/api/properties`)

#### A. Fetch All Verified Properties
`GET /api/properties/all`

Returns a list of all verified properties in the database.

*   **Authorization:** None (Public endpoint)
*   **Response (`200 OK`):**
    ```json
    {
      "success": true,
      "message": "Fetched all properties",
      "data": [
        {
          "id": 1,
          "title": "Modern 3-Bedroom Lekki Apartment",
          "description": "Luxurious smart apartment",
          "address": "12 Admiralty Way, Lekki",
          "price": 250000.00,
          "bedrooms": 3,
          "bathrooms": 3,
          "squareFootage": 2100.0,
          "status": "FOR_SALE",
          "verified": true,
          "virtualTourUrl": "https://matterport.com/...",
          "videoWalkthroughUrl": "https://s3.amazonaws.com/...",
          "seller": {
            "id": 5,
            "firstName": "Jane",
            "lastName": "Doe",
            "email": "jane@seller.com"
          }
        }
      ]
    }
    ```

#### B. Fetch Properties For Sale
`GET /api/properties/sale`

*   **Authorization:** None (Public)
*   **Response (`200 OK`):** Returns only properties where `status` is `"FOR_SALE"`.

#### C. Fetch Properties For Rent
`GET /api/properties/rent`

*   **Authorization:** None (Public)
*   **Response (`200 OK`):** Returns only properties where `status` is `"FOR_RENT"`.

#### D. Create Property Listing
`POST /api/properties/create`

Creates a new property listing. The property starts as **unverified** (`isVerified = false`) and will not be returned in public fetch queries until a property ownership document is submitted and approved.

*   **Authorization:** Bearer JWT required (Must have the `LANDLORD` or `AGENT` role, and the user must be verified).
*   **Listing Domain Restrictions:**
    *   `LANDLORD` users can only post listings where `status` is `"FOR_RENT"`.
    *   `AGENT` users can only post listings where `status` is `"FOR_SALE"`.
*   **Request Body:**
    ```json
    {
      "title": "Stunning Ikoyi Duplex",
      "description": "Exquisite luxury duplex",
      "address": "4 Waterfront Road, Ikoyi",
      "price": 600000.00,
      "bedrooms": 5,
      "bathrooms": 6,
      "squareFootage": 4500.0,
      "status": "FOR_SALE",
      "seller": {
        "id": 5
      }
    }
    ```
*   **Response (`200 OK`):**
    ```json
    {
      "success": true,
      "message": "Property created successfully",
      "data": {
        "id": 2,
        "title": "Stunning Ikoyi Duplex",
        "description": "Exquisite luxury duplex",
        "address": "4 Waterfront Road, Ikoyi",
        "price": 600000.00,
        "bedrooms": 5,
        "bathrooms": 6,
        "squareFootage": 4500.0,
        "status": "FOR_SALE",
        "virtualTourUrl": null,
        "videoWalkthroughUrl": null,
        "seller": {
          "id": 5,
          "firstName": "John",
          "lastName": "Doe",
          "email": "john@example.com",
          "role": "AGENT",
          "sellerRating": 0.0,
          "isEmailVerified": true
        },
        "latitude": null,
        "longitude": null,
        "proofLatitude": null,
        "proofLongitude": null,
        "imageUrl": null,
        "imageHash": null,
        "verified": false,
        "flaggedAsDuplicate": false
      }
    }
    ```

#### E. Upload Property Photo (Duplicate & Geofence Verification)
`POST /api/properties/{id}/upload-image`

Uploads a property listing photo, processes its EXIF metadata for geofence validation, generates an Average Perceptual Hash (aHash) for visual fingerprint scanning, checks for stolen/duplicate listings in the database, and saves the image to S3.

*   **Authorization:** Bearer JWT required (Must have the `LANDLORD` or `AGENT` role)
*   **Path Parameters:**
    *   `id` (Long): The target property listing ID.
*   **Content-Type:** `multipart/form-data`
*   **Request Body (Form Data):**
    *   `image` (File Binary): The property image file (e.g. `house_front.jpg`).
*   **Response (`200 OK` - Success, Clean Visual Fingerprint):**
    ```json
    {
      "success": true,
      "message": "Property listing photograph uploaded and verified successfully! No duplicate footprints found.",
      "data": {
        "id": 2,
        "title": "Stunning Ikoyi Duplex",
        "description": "Exquisite luxury duplex",
        "address": "4 Waterfront Road, Ikoyi",
        "price": 600000.00,
        "bedrooms": 5,
        "bathrooms": 6,
        "squareFootage": 4500.0,
        "status": "FOR_SALE",
        "virtualTourUrl": null,
        "videoWalkthroughUrl": null,
        "seller": {
          "id": 5,
          "firstName": "John",
          "lastName": "Doe",
          "email": "john@example.com",
          "role": "AGENT",
          "sellerRating": 0.0,
          "isEmailVerified": true
        },
        "latitude": null,
        "longitude": null,
        "proofLatitude": null,
        "proofLongitude": null,
        "imageUrl": "https://keyz-walkthroughs.s3.amazonaws.com/properties/photos_2",
        "imageHash": "a1b2c3d4e5f6g7h8",
        "verified": false,
        "flaggedAsDuplicate": false
      }
    }
    ```
*   **Response (`400 Bad Request` - Warning, Stolen/Duplicate Photo Flagged):**
    ```json
    {
      "success": false,
      "message": "Security Alert: This listing photograph matches an existing verified property listing (Property ID: 1) by a different host. Listing flagged and deactivated.",
      "data": null
    }
    ```

#### F. Retrieve Real-Time Real Estate Portfolio
`GET /api/properties/portfolio`

Returns a real-time, analytical breakdown of the logged-in user's real estate portfolio. This endpoint is highly dynamic and automatically adjusts its response payload depending on the caller's role:
1.  **For HOSTS (`LANDLORD` or `AGENT`):** Returns their listed assets portfolio, showing uploaded properties, total sale value, expected monthly rental income streams, and pending buyer offers.
2.  **For BUYERS (`TENANT`):** Returns their **Purchased Properties Portfolio**, showing all properties they have successfully purchased (where their offer has been `ACCEPTED`) and the sum of their total transaction investments.

*   **Authorization:** Bearer JWT required (Must have the `LANDLORD`, `AGENT`, or `TENANT` role)
*   **Response (`200 OK` - Host Listing Portfolio Example):**
    ```json
    {
      "success": true,
      "message": "Real-time portfolio metrics retrieved successfully",
      "data": {
        "totalPropertiesCount": 4,
        "activeListingsCount": 3,
        "totalValueForSale": 85000000.00,
        "expectedMonthlyRentalIncome": 1200000.00,
        "pendingOffersCount": 2,
        "properties": [
          {
            "id": 2,
            "title": "Stunning Ikoyi Duplex",
            "price": 60000000.00,
            "status": "FOR_SALE",
            "verified": true
          },
          {
            "id": 5,
            "title": "Modern 3-Bedroom Lekki Apartment",
            "price": 25000000.00,
            "status": "FOR_SALE",
            "verified": true
          }
        ]
      }
    }
    ```
*   **Response (`200 OK` - Tenant Purchased Portfolio Example):**
    ```json
    {
      "success": true,
      "message": "Real-time portfolio metrics retrieved successfully",
      "data": {
        "totalPropertiesCount": 2,
        "activeListingsCount": 2,
        "totalValueForSale": 110000000.00,
        "expectedMonthlyRentalIncome": 0.0,
        "pendingOffersCount": 0,
        "properties": [
          {
            "id": 2,
            "title": "Stunning Ikoyi Duplex",
            "price": 60000000.00,
            "status": "FOR_SALE",
            "verified": true
          },
          {
            "id": 5,
            "title": "Modern 3-Bedroom Lekki Apartment",
            "price": 50000000.00,
            "status": "FOR_SALE",
            "verified": true
          }
        ]
      }
    }
    ```

---

### 3. Bookings (`/api/bookings`)

#### A. Place a Rental Booking
`POST /api/bookings`

Places a reservation booking on a `FOR_RENT` property listing.

*   **Authorization:** Bearer JWT required
*   **Query Parameters:**
    *   `buyerId` (Long): The ID of the authenticated user submitting the booking
*   **Request Body:**
    ```json
    {
      "propertyId": 1,
      "startDate": "2026-06-01",
      "endDate": "2026-06-15"
    }
    ```
*   **Response (`200 OK`):**
    ```json
    {
      "success": true,
      "message": "Booking created successfully",
      "data": {
        "id": 10,
        "startDate": "2026-06-01",
        "endDate": "2026-06-15",
        "totalPrice": 3750000.00,
        "status": "PENDING"
      }
    }
    ```

---

### 4. Offers (`/api/offers`)

#### A. Submit a Purchase Offer
`POST /api/offers`

Submits a financial purchasing bid on a `FOR_SALE` property listing.

*   **Authorization:** Bearer JWT required
*   **Query Parameters:**
    *   `buyerId` (Long): The ID of the authenticated user submitting the offer
*   **Request Body:**
    ```json
    {
      "propertyId": 2,
      "offerAmount": 580000.00
    }
    ```
*   **Response (`200 OK`):**
    ```json
    {
      "success": true,
      "message": "Offer submitted successfully",
      "data": {
        "id": 14,
        "offerAmount": 580000.00,
        "status": "PENDING"
      }
    }
    ```

---

### 5. Reviews (`/api/reviews`)

#### A. Submit a Property Review
`POST /api/reviews`

Submits a rating and comment. 

> [!WARNING]
> This endpoint enforces strict business logic. The user *must* have an existing booking on this property marked as `COMPLETED` in the database. Failing this condition triggers a `403 Forbidden` response to block review spamming.

*   **Authorization:** Bearer JWT required
*   **Query Parameters:**
    *   `reviewerId` (Long): The ID of the reviewer
*   **Request Body:**
    ```json
    {
      "propertyId": 1,
      "rating": 5,
      "comment": "Exemplary experience! Highly recommended."
    }
    ```
    *(Note: `rating` must be between `1` and `5`)*
*   **Response (`200 OK`):**
    ```json
    {
      "success": true,
      "message": "Review submitted successfully",
      "data": {
        "id": 8,
        "rating": 5,
        "comment": "Exemplary experience! Highly recommended."
      }
    }
    ```

---

### 6. KYC & Verifications (`/api/verification`)

#### A. Submit Landlord KYB (Know Your Business) Document
`POST /api/verification/kyb`

Landlords call this endpoint to upload legal identity/business documents. They must be verified by an Admin before posting properties.

*   **Authorization:** Bearer JWT required (Must have `LANDLORD` role)
*   **Request Body:**
    ```json
    {
      "user": {
        "id": 5
      },
      "documentUrl": "https://s3.amazonaws.com/kyz-kyb/docs/id.pdf"
    }
    ```
*   **Response (`200 OK`):**
    ```json
    {
      "success": true,
      "message": "KYB submitted successfully",
      "data": {
        "id": 1,
        "status": "PENDING",
        "documentUrl": "https://s3.amazonaws.com/kyz-kyb/docs/id.pdf"
      }
    }
    ```

#### B. Standalone Smile ID NIN Verification
`POST /api/verification/smileid/nin`

Verifies a National Identification Number (NIN) against the official database using Smile Identity.

*   **Authorization:** Bearer JWT required
*   **Query Parameters:**
    *   `nin` (String): The 11-digit National Identification Number.
    *   `userId` (Long): The authenticated user ID.
*   **Response (`200 OK`):**
    ```json
    {
      "success": true,
      "message": "NIN successfully verified via Smile Identity",
      "data": {
        "success": true,
        "status": "VERIFIED",
        "message": "NIN successfully verified via Nimc government portal lookup",
        "smileTxId": "sm_tx_9b1deb4d3a1b",
        "fullName": "JOHN DOE",
        "dob": "1995-08-12",
        "databaseMatched": "NIN"
      }
    }
    ```

#### C. Standalone Smile ID BVN Verification
`POST /api/verification/smileid/bvn`

Verifies a Bank Verification Number (BVN) against core banking records using Smile Identity.

*   **Authorization:** Bearer JWT required
*   **Query Parameters:**
    *   `bvn` (String): The 11-digit Bank Verification Number.
    *   `userId` (Long): The authenticated user ID.
*   **Response (`200 OK`):**
    ```json
    {
      "success": true,
      "message": "BVN successfully verified via Smile Identity",
      "data": {
        "success": true,
        "status": "VERIFIED",
        "message": "BVN successfully verified via Nibss core banking records matching",
        "smileTxId": "sm_tx_7a3cef2c8b",
        "fullName": "JOHN DOE",
        "dob": "1995-08-12",
        "databaseMatched": "BVN"
      }
    }
    ```

#### D. Standalone Smile ID Selfie Liveness Check
`POST /api/verification/smileid/selfie`

Analyzes a captured live selfie for physical liveness (anti-spoofing) via Smile Identity.

*   **Authorization:** Bearer JWT required
*   **Content-Type:** `multipart/form-data`
*   **Request Body (Form Data):**
    *   `selfie` (File Binary): The captured selfie image.
    *   `userId` (Long): The authenticated user ID.
*   **Response (`200 OK`):**
    ```json
    {
      "success": true,
      "message": "Selfie liveness check succeeded via Smile Identity",
      "data": {
        "success": true,
        "status": "VERIFIED",
        "message": "Liveness check succeeded (Confidence score: 98.4%). User verified as real physical person.",
        "smileTxId": "sm_tx_2b9ff9b8c2d1",
        "livenessScore": 0.984,
        "fullName": "JOHN DOE",
        "databaseMatched": "SELFIE"
      }
    }
    ```

#### E. Submit Agent Verification (Compound Biometric Check)
`POST /api/verification/agent`

A unified compound endpoint for users registered with the `AGENT` role. It runs Standalone NIN verification, BVN verification, and a Selfie Liveness check. If all succeed, it uploads the selfie to S3 and registers an approved `AgentVerification` entry.

*   **Authorization:** Bearer JWT required (Must have `AGENT` role)
*   **Content-Type:** `multipart/form-data`
*   **Request Body (Form Data):**
    *   `selfie` (File Binary): The agent's live selfie image.
    *   `nin` (String): The agent's 11-digit NIN.
    *   `bvn` (String): The agent's 11-digit BVN.
    *   `userId` (Long): The authenticated user ID.
    *   `latitude` (Double, optional): The agent's physical latitude location.
    *   `longitude` (Double, optional): The agent's physical longitude location.
*   **Response (`200 OK`):**
    ```json
    {
      "success": true,
      "message": "Agent identity checks passed. Verification successfully auto-approved via Smile ID biometric trust.",
      "data": {
        "id": 1,
        "user": {
          "id": 6,
          "firstName": "Alice",
          "lastName": "Agent",
          "email": "alice@agent.com",
          "role": "AGENT",
          "sellerRating": 0.0,
          "isEmailVerified": true
        },
        "nin": "12345678901",
        "bvn": "98765432109",
        "selfieUrl": "https://bucket.s3.region.amazonaws.com/selfies/agent_6",
        "smileTxId": "sm_tx_4c8efa7a",
        "status": "APPROVED",
        "latitude": null,
        "longitude": null
      }
    }
    ```

#### F. Submit Property Ownership Document
`POST /api/verification/property`

Landlords or Agents call this to verify a specific property listing by providing a legal land deed or proof of ownership. Once approved by an Admin, the property listing goes live.

*   **Authorization:** Bearer JWT required (Must have `LANDLORD` or `AGENT` role)
*   **Request Body:**
    ```json
    {
      "property": {
        "id": 2
      },
      "proofOfOwnershipUrl": "https://s3.amazonaws.com/kyz-deeds/deed_prop_2.pdf"
    }
    ```
*   **Response (`200 OK`):**
    ```json
    {
      "success": true,
      "message": "Property verification submitted successfully",
      "data": {
        "id": 3,
        "status": "PENDING",
        "proofOfOwnershipUrl": "https://s3.amazonaws.com/kyz-deeds/deed_prop_2.pdf"
      }
    }
    ```

#### G. Geofenced Property Proof-of-Presence Check
`POST /api/verification/property/verify`

Performs an on-site check using GPS EXIF metadata of the uploaded property photograph to ensure the listing agent/landlord is physically within 20 meters of the property location.

*   **Authorization:** Bearer JWT required (Must have `LANDLORD` or `AGENT` role)
*   **Content-Type:** `multipart/form-data`
*   **Request Body (Form Data):**
    *   `propertyId` (Long): The target property ID.
    *   `proofImage` (File Binary): A live photograph of the property front containing EXIF GPS metadata.
*   **Response (`200 OK` - Within Geofence):**
    ```json
    {
      "success": true,
      "message": "Property successfully verified! GPS location matches within safe trust radius (12.45 meters). Listing is now live.",
      "data": {
        "id": 3,
        "status": "APPROVED",
        "proofOfOwnershipUrl": "https://keyz-walkthroughs.s3.amazonaws.com/properties/proof_3",
        "latitude": 6.4281,
        "longitude": 3.4219
      }
    }
    ```

#### H. Verify Property via Utility Bill OCR
`POST /api/verification/property/verify-bill`

Scans an uploaded utility statement using AWS Textract, performing fuzzy name and address audits to auto-verify the listing.

*   **Authorization:** Bearer JWT required (Must have the `LANDLORD` or `AGENT` role)
*   **Content-Type:** `multipart/form-data`
*   **Request Body (Form Data):**
    *   `utilityBill` (File Binary): The utility bill statement (e.g. `electricity_bill.pdf`).
    *   `propertyId` (Long): The target property ID.
*   **Response (`200 OK`):**
    ```json
    {
      "success": true,
      "message": "Property listing auto-verified and published successfully! AWS Textract OCR successfully processed bill. Utility physical billing address matched listing address at 82.4% confidence. Listing is now officially verified!",
      "data": {
        "id": 3,
        "status": "APPROVED",
        "proofOfOwnershipUrl": "https://keyz-walkthroughs.s3.amazonaws.com/properties/bills_3"
      }
    }
    ```

#### I. Setup Bank Payout Profile (Micro-Deposits Trigger)
`POST /api/verification/payout/setup`

Registers a banking payout account, auditing that the beneficiary name matches the verified Smile ID legal name, and triggers two random micro-deposits.

*   **Authorization:** Bearer JWT required
*   **Query/Form Parameters:**
    *   `userId` (Long): The authenticated user ID.
    *   `bankCode` (String): The bank's unique routing code (e.g. `011`).
    *   `accountNumber` (String): The 10-digit bank account number.
    *   `accountName` (String): The name registered on the bank account.
*   **Response (`200 OK`):**
    ```json
    {
      "success": true,
      "message": "Payout bank account registered! Two micro-deposits have been dispatched to your bank account. Check your statement and verify the exact deposit values.",
      "data": {
        "id": 1,
        "bankCode": "011",
        "accountNumber": "0123456789",
        "accountName": "John Doe",
        "status": "PENDING",
        "verified": false
      }
    }
    ```

#### J. Confirm Micro-Deposits Payout Activation
`POST /api/verification/payout/confirm`

Consumes the two micro-deposit values in an order-independent manner to activate payout routing.

*   **Authorization:** Bearer JWT required
*   **Query/Form Parameters:**
    *   `payoutId` (Long): The payout verification record ID.
    *   `deposit1` (Double): The first micro-deposit value.
    *   `deposit2` (Double): The second micro-deposit value.
*   **Response (`200 OK`):**
    ```json
    {
      "success": true,
      "message": "Micro-deposits successfully verified! Payout bank account activated for payouts.",
      "data": {
        "id": 1,
        "bankCode": "011",
        "accountNumber": "0123456789",
        "accountName": "John Doe",
        "status": "APPROVED",
        "verified": true
      }
    }
    ```

---

### 7. Virtual 3D & Video Tours (`/api/tours`)

#### A. Generate Live Jitsi Tour Room
`POST /api/tours/jitsi/{propertyId}`

Generates private JWT credentials to access an authorized live video conference call on Jitsi JaaS.

*   **Authorization:** Bearer JWT required
*   **Path Parameters:**
    *   `propertyId` (Long): The target property ID
*   **Response (`200 OK`):**
    ```json
    {
      "success": true,
      "message": "Virtual tour room ready",
      "data": {
        "roomName": "keyz-property-1",
        "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6...",
        "serverUrl": "https://8x8.vc"
      }
    }
    ```

#### B. Upload Property Video Walkthrough
`POST /api/tours/upload/{propertyId}`

Uploads an MP4/MOV video walkthrough of the property directly to S3 and attaches the URL to the property model.

*   **Authorization:** Bearer JWT required (Must have the `LANDLORD` or `AGENT` role)
*   **Path Parameters:**
*   `propertyId` (Long): The target property ID
*   **Content-Type:** `multipart/form-data`
*   **Request Body (Form Data):**
    *   `file` (File Binary): The video walkthrough file (e.g. `walkthrough.mp4`)
*   **Response (`200 OK`):**
    ```json
    {
      "success": true,
      "message": "Video walkthrough uploaded successfully",
      "data": "https://keyz-walkthroughs.s3.eu-west-1.amazonaws.com/walkthroughs/prop_1_video.mp4"
    }
    ```

#### C. Set Matterport 3D Tour Link
`PATCH /api/tours/matterport/{propertyId}`

Binds an interactive Matterport 3D virtual tour link to the property.

*   **Authorization:** Bearer JWT required (Must have the `LANDLORD` or `AGENT` role)
*   **Path Parameters:**
    *   `propertyId` (Long): The target property ID
*   **Query Parameters:**
    *   `url` (String): The Matterport showcase URL
*   **Response (`200 OK`):**
    ```json
    {
      "success": true,
      "message": "3D virtual tour URL saved",
      "data": "https://my.matterport.com/show/?m=xxx"
    }
    ```

---

### 8. Zero-Knowledge Marketplace Chat Relay (`/api/chat`)

Keyz utilizes a **Zero-Knowledge privacy-first messaging architecture** (similar to WhatsApp and Signal). 

*   **Zero Server Storage:** Messages are **never** persisted to any central server database. 
*   **Device-Only Cache:** All historical conversation logs, participant profiles, and active threads are cached and queried **100% locally on the users' physical devices** (using SQLite, Hive, or Realm).
*   **The Postman Relay:** The backend acts strictly as an in-memory relayer. When a message is sent, it is placed in a secure, encrypted transit mailbox in RAM. The moment the recipient's phone fetches their mail, **the messages are permanently purged from server memory**.

#### A. Send a Message
`POST /api/chat/send`

Dispatches a message into the in-memory queue for the recipient.

*   **Authorization:** Bearer JWT required
*   **Request Body:**
    ```json
    {
      "receiverId": 7,
      "content": "Hello, is this property still available for viewing?"
    }
    ```
*   **Response (`200 OK`):**
    ```json
    {
      "success": true,
      "message": "Message dispatched in transit queue successfully",
      "data": {
        "id": 1,
        "senderId": 3,
        "senderName": "Tenant Bob",
        "receiverId": 7,
        "receiverName": "Agent Alice",
        "content": "Hello, is this property still available for viewing?",
        "timestamp": "2026-05-28T01:32:00",
        "isRead": false
      }
    }
    ```

#### B. Consume Pending Messages (Receive & Wipe)
`GET /api/chat/receive`

Fetches all incoming messages waiting for the authenticated user, and **instantly deletes them from the server RAM**. The phone app must immediately write these messages to its local database cache upon retrieval.

*   **Authorization:** Bearer JWT required
*   **Response (`200 OK`):**
    ```json
    {
      "success": true,
      "message": "Pending messages consumed and cleared from server",
      "data": [
        {
          "id": 1,
          "senderId": 3,
          "senderName": "Tenant Bob",
          "receiverId": 7,
          "receiverName": "Agent Alice",
          "content": "Hello, is this property still available for viewing?",
          "timestamp": "2026-05-28T01:32:00",
          "isRead": false
        }
      ]
    }
    ```

#### C. Get Pending Queue Count
`GET /api/chat/pending`

Returns the count of pending offline messages waiting in the user's transit mailbox.

*   **Authorization:** Bearer JWT required
*   **Response (`200 OK`):**
    ```json
    {
      "success": true,
      "message": "Pending offline messages count retrieved successfully",
      "data": 1
    }
    ```

---

### 9. System Health (`/api/health`)

Endpoints in this group do not require any Authorization token and are designed for uptime monitors and keep-alive cronjobs.

#### A. Health Check
`GET /api/health`

Returns the active server health status.

*   **Authorization:** None (Public)
*   **Response (`200 OK`):**
    ```json
    {
      "success": true,
      "message": "System is running",
      "data": {
        "status": "UP"
      }
    }
    ```

---

## 🛑 Standardized Error Codes

Keyz employs HTTP semantic status codes along with detailed error responses:

| Code | Meaning | Typical Trigger Scenario |
|---|---|---|
| **`200`** | **OK** | Success of any normal request. |
| **`400`** | **Bad Request** | Invalid parameter fields, JSON formatting mistakes, or failing Spring validations. |
| **`401`** | **Unauthorized** | Missing JWT Token in authorization header, or expired token signatures. |
| **`403`** | **Forbidden** | A role access mismatch, e.g. a Buyer attempting to post a property listing or a Seller uploading a review without a completed booking. |
| **`404`** | **Not Found** | Querying a non-existent property ID or user ID. |
| **`409`** | **Conflict** | Resource state conflicts, such as submitting a purchase offer or booking on an unverified or unavailable property, or invalid booking dates. |
| **`429`** | **Too Many Requests** | Exceeding the standard 100 requests per minute IP rate limit. |
| **`500`** | **Internal Server Error** | Unexpected backend server issues. |