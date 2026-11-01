# Mocked Screens Backend API Requirements

This document defines the backend work required to replace mocked or local-only data in the Rello frontend. It compares the current frontend `feat/add-dashboards-2` branch with the backend `founder1` branch.

It intentionally separates three cases:

1. A backend endpoint is missing and must be implemented.
2. An endpoint exists, but its contract must be expanded.
3. A screen is mocked, but existing endpoints already provide its data.

This distinction prevents duplicate backend work.

## API conventions

### Base URL

```text
Local backend: http://localhost:8080
```

The frontend normally calls its local `/api` proxy. Client code should therefore use paths such as `/api/users/me`.

### Authentication

Protected endpoints require:

```http
Authorization: Bearer <accessToken>
```

### Response envelope

Success:

```json
{
  "success": true,
  "message": "Operation completed",
  "data": {}
}
```

Failure:

```json
{
  "success": false,
  "message": "Human-readable fallback",
  "code": "STABLE_ERROR_CODE",
  "data": null
}
```

The frontend should use `code` for application logic. The message is a display fallback.

### Dates and money

- Date-only values use ISO `YYYY-MM-DD`.
- Timestamps use ISO 8601 with a timezone or UTC offset.
- Money remains numeric in JSON.
- Currency is returned separately using an ISO code such as `NGN`.
- Display formatting belongs to the frontend.

## Audit summary

| Frontend area | Current state | Backend conclusion |
| --- | --- | --- |
| Landlord Dashboard | Fully mocked | Existing endpoints provide the current data. A new endpoint is optional. |
| Agent Dashboard | Fully mocked | Most data exists. Scheduled viewings and a combined activity feed are missing. |
| Agent Tenancies | Fully mocked | Existing booking endpoints provide the current tenancy data and actions. |
| Tenant My Home | Partially connected | Bookings and chat exist. Lease documents, rent schedules, receipts, and maintenance are missing. |
| Tenant Browse activity | Mocked | Rental data can be derived. A unified activity feed is missing. |
| Property details | Mock fallback | The property endpoint exists, but galleries and amenities are missing from its contract. |
| Host listing drafts | Stored in IndexedDB | Server-side draft endpoints are missing. |
| Profile | Partially connected | Reading exists. Editing phone, location, name, and avatar is missing. |
| Notification settings | Local state | Preference endpoints are missing. |
| Privacy settings | Local state | Preference and data-export endpoints are missing. |
| Security settings | Partially connected | Password and deletion exist. Two-factor authentication, sessions, and deactivation are missing. |
| Tenant payment settings | Mocked | Saved payment-method support is missing. Escrow already covers real tenancy transactions. |
| Host payout settings | Mocked | One payout account can be set up. Listing, removing, or supporting multiple accounts is missing. |
| Admin settings statistics | Mocked | Existing admin metrics can replace the mock. No new endpoint is needed. |
| Admin Bookings | Placeholder | Admin booking search and moderation endpoint is missing. |
| Admin Escrow | Placeholder | Admin escrow list and search endpoint is missing. |
| Admin Ratings | Placeholder | Admin review moderation endpoints are missing. |
| Chat and calls | Connected or supported | Backend endpoints exist. No new core endpoint is required. |
| Identity verification | Connected or supported | Tenant, landlord, agent, KYB, property, and payout verification endpoints exist. |

# Required missing endpoints

## 1. Profile management

Affected screens:

- `/tenant/profile`
- `/landlord/profile`
- `/agent/profile`
- Shared profile section previously displayed under settings

Existing support:

```http
GET /api/users/me
```

The read endpoint exists, but the frontend currently saves edited fields only in component state.

### Update the current profile

```http
PATCH /api/users/me
```

Authorization: Any authenticated user.

Request:

```json
{
  "firstName": "Chinedu",
  "lastName": "Okafor",
  "phone": "+2348095550126",
  "location": "Abuja, Nigeria"
}
```

Rules:

- All fields are optional, but at least one field must be supplied.
- Names are trimmed and cannot be blank.
- Phone numbers should be stored in E.164 format.
- Changing a name after identity verification requires a product decision. The safe default is to reject the change or mark identity verification for review.
- Email changes should use a separate verified-email flow and should not be supported by this endpoint.

Response:

```json
{
  "success": true,
  "message": "Profile updated",
  "data": {
    "id": 41,
    "firstName": "Chinedu",
    "lastName": "Okafor",
    "email": "chinedu@example.com",
    "phone": "+2348095550126",
    "location": "Abuja, Nigeria",
    "avatarUrl": null,
    "role": "LANDLORD",
    "identityVerified": true
  }
}
```

Required error codes:

```text
VALIDATION_FAILED
IDENTITY_NAME_CHANGE_RESTRICTED
SESSION_EXPIRED
```

### Upload a profile image

```http
PUT /api/users/me/avatar
Content-Type: multipart/form-data
```

Form field:

```text
avatar: JPEG, PNG, or WebP image
```

Rules:

- Maximum file size: 5 MB.
- Store the image in private application-controlled storage.
- Replace the previous avatar and remove or expire the old object.
- Return only the public or signed display URL.

Response:

```json
{
  "success": true,
  "message": "Profile image updated",
  "data": {
    "avatarUrl": "https://example.com/avatar.jpg"
  }
}
```

### Remove a profile image

```http
DELETE /api/users/me/avatar
```

Response data may be `null`.

## 2. Notification preferences

Affected screens:

- Tenant settings notifications
- Landlord settings notifications
- Agent settings notifications
- Admin settings notifications

The current switches are local-only and reset after navigation or reload.

### Read notification preferences

```http
GET /api/users/me/notification-preferences
```

Authorization: Any authenticated user.

Response:

```json
{
  "success": true,
  "message": "Notification preferences retrieved",
  "data": {
    "preferences": {
      "PROPERTY_RECOMMENDATIONS": true,
      "VIEWING_REMINDERS": true,
      "TENANCY_UPDATES": true,
      "LISTING_PERFORMANCE": true,
      "PAYOUT_UPDATES": true,
      "EDITORIAL": false
    },
    "mandatory": [
      "SECURITY_ALERTS",
      "ACCOUNT_ALERTS"
    ]
  }
}
```

The backend may return only preferences relevant to the current role.

### Update notification preferences

```http
PATCH /api/users/me/notification-preferences
```

Request:

```json
{
  "preferences": {
    "VIEWING_REMINDERS": false,
    "EDITORIAL": true
  }
}
```

Rules:

- Partial updates are supported.
- Unknown preference keys return `VALIDATION_FAILED`.
- Mandatory security and account notices cannot be disabled.

Response returns the complete saved preference object.

## 3. Privacy controls

Affected screens:

- Tenant settings privacy
- Landlord settings privacy
- Agent settings privacy
- Admin settings privacy

The current controls are local-only.

### Read privacy preferences

```http
GET /api/users/me/privacy-preferences
```

Response:

```json
{
  "success": true,
  "message": "Privacy preferences retrieved",
  "data": {
    "profileDiscoverable": true,
    "activityPersonalisation": true,
    "productAnalytics": false
  }
}
```

### Update privacy preferences

```http
PATCH /api/users/me/privacy-preferences
```

Request:

```json
{
  "profileDiscoverable": false,
  "activityPersonalisation": true,
  "productAnalytics": false
}
```

Partial updates should be supported.

### Request a data export

```http
POST /api/users/me/data-exports
```

Response status: `202 Accepted`.

```json
{
  "success": true,
  "message": "Your data export is being prepared",
  "data": {
    "id": "export_01J8ZK3H",
    "status": "QUEUED",
    "requestedAt": "2026-09-08T12:00:00Z",
    "expiresAt": null,
    "downloadUrl": null
  }
}
```

### Check a data export

```http
GET /api/users/me/data-exports/{exportId}
```

Statuses:

```text
QUEUED
PROCESSING
READY
FAILED
EXPIRED
```

When ready, return a short-lived signed `downloadUrl` and its expiry time. The export must never expose another user's data.

## 4. Account deactivation

Affected screen: Security settings danger zone.

Existing support:

```http
DELETE /api/auth/account
```

Permanent account deletion already exists. Temporary deactivation does not.

### Deactivate account

```http
POST /api/auth/deactivate
```

Request:

```json
{
  "confirmation": "DEACTIVATE"
}
```

Behavior:

- Mark the account inactive without deleting its records.
- Hide public host profiles and listings as required by the product policy.
- Invalidate the current JWT and other active sessions.
- Define whether the next successful login automatically reactivates the account.

Response:

```json
{
  "success": true,
  "message": "Account deactivated",
  "data": null
}
```

## 5. Two-factor authentication

Affected screen: Security settings.

Two-factor authentication is currently represented by a local toggle. Implementing it requires both settings endpoints and an authentication challenge flow.

### Begin TOTP setup

```http
POST /api/auth/2fa/totp/setup
```

Response:

```json
{
  "success": true,
  "message": "Authenticator setup started",
  "data": {
    "secret": "BASE32_SECRET",
    "otpauthUri": "otpauth://totp/Rello:user@example.com?...",
    "recoveryCodes": ["A1B2-C3D4", "E5F6-G7H8"]
  }
}
```

The secret and recovery codes must be shown only during setup and must not be returned by later status requests.

### Confirm TOTP setup

```http
POST /api/auth/2fa/totp/confirm
```

Request:

```json
{
  "code": "123456"
}
```

### Disable TOTP

```http
DELETE /api/auth/2fa/totp
```

Request:

```json
{
  "password": "CurrentPassword",
  "code": "123456"
}
```

Google-only accounts need a recent-login check instead of a password requirement.

### Complete a login challenge

```http
POST /api/auth/2fa/challenge
```

When two-factor authentication is enabled, login should return a short-lived challenge instead of an access token:

```json
{
  "success": true,
  "message": "Two-factor authentication required",
  "data": {
    "requiresTwoFactor": true,
    "challengeToken": "short-lived-token"
  }
}
```

Challenge request:

```json
{
  "challengeToken": "short-lived-token",
  "code": "123456"
}
```

The successful response returns the normal `AuthResponse` session.

## 6. Login session management

Affected screen: Security settings.

The backend records device fingerprints, but it does not expose manageable login sessions.

### List sessions

```http
GET /api/auth/sessions
```

Response:

```json
{
  "success": true,
  "message": "Sessions retrieved",
  "data": [
    {
      "id": "session_01J8ZK3H",
      "current": true,
      "deviceName": "Chrome on Linux",
      "ipAddress": "197.210.xxx.xxx",
      "location": "Lagos, Nigeria",
      "createdAt": "2026-09-01T08:30:00Z",
      "lastSeenAt": "2026-09-08T11:58:00Z"
    }
  ]
}
```

### Revoke one session

```http
DELETE /api/auth/sessions/{sessionId}
```

### Revoke other sessions

```http
DELETE /api/auth/sessions?exceptCurrent=true
```

Architecture requirement: session revocation needs server-tracked JWT identifiers, session records, or refresh-token records. Device fingerprints alone are not sufficient to revoke stateless access tokens.

## 7. Server-side listing drafts

Affected screens:

- `/landlord/listings/create`
- `/agent/listings/create`
- Landlord My Listings
- Agent My Listings

Drafts currently live only in IndexedDB. They do not follow a user across devices and disappear if browser storage is cleared.

### Create a draft

```http
POST /api/property-drafts
```

Authorization: `LANDLORD` or `AGENT`.

Request:

```json
{
  "title": "GRA Family Duplex",
  "description": "A family-ready rental home.",
  "price": 950000,
  "city": "Port Harcourt",
  "area": "GRA",
  "address": "12 Example Street",
  "bedrooms": 4,
  "bathrooms": 3,
  "squareFootage": 3100,
  "listingType": "FOR_RENT",
  "amenities": ["PARKING", "SECURITY", "GENERATOR"]
}
```

Draft fields may be incomplete. Publishing rules must not be applied while saving a draft.

Response:

```json
{
  "success": true,
  "message": "Draft saved",
  "data": {
    "id": 82,
    "status": "DRAFT",
    "completionPercent": 75,
    "createdAt": "2026-09-08T10:00:00Z",
    "updatedAt": "2026-09-08T12:00:00Z"
  }
}
```

### List drafts

```http
GET /api/property-drafts?page=0&size=20
```

Return only drafts owned by the authenticated host.

### Get one draft

```http
GET /api/property-drafts/{draftId}
```

### Update a draft

```http
PATCH /api/property-drafts/{draftId}
```

The request accepts the same optional fields as draft creation.

### Delete a draft

```http
DELETE /api/property-drafts/{draftId}
```

### Publish a draft

```http
POST /api/property-drafts/{draftId}/publish
```

Publishing should:

- Validate every required listing field.
- Require a verified host identity.
- Create an unverified property.
- Preserve uploaded draft media.
- Return `PropertySummaryResponse`.

## 8. Property gallery and amenities

Affected screens:

- Create Listing
- Edit Listing
- My Listings
- Property details
- Browse Listings cards

Existing support:

```http
POST /api/properties/{id}/upload-image
GET  /api/properties/{id}
```

The backend currently stores one `imageUrl` and does not store the amenities selected by the listing form.

### Upload a gallery image

```http
POST /api/properties/{propertyId}/images
Content-Type: multipart/form-data
```

Form fields:

```text
image: required image file
caption: optional string
```

Response:

```json
{
  "success": true,
  "message": "Property image uploaded",
  "data": {
    "id": 301,
    "url": "https://example.com/property-image.jpg",
    "caption": null,
    "position": 2,
    "cover": false
  }
}
```

Rules:

- Owner only.
- JPEG, PNG, or WebP.
- Maximum 10 MB per image.
- Keep the existing duplicate-image check.
- Define a maximum gallery size, recommended as 20 images.

### Reorder the gallery

```http
PATCH /api/properties/{propertyId}/images/order
```

Request:

```json
{
  "imageIds": [301, 298, 299]
}
```

The first image becomes the cover image unless a separate cover field is supplied.

### Delete a gallery image

```http
DELETE /api/properties/{propertyId}/images/{imageId}
```

### Required property contract expansion

This is an existing endpoint that needs a larger response, not a new route:

```http
GET /api/properties/{propertyId}
```

Add:

```json
{
  "city": "Lagos",
  "area": "Lekki Phase 1",
  "amenities": ["WIFI", "PARKING", "SECURITY"],
  "images": [
    {
      "id": 301,
      "url": "https://example.com/property-image.jpg",
      "caption": null,
      "position": 0,
      "cover": true
    }
  ]
}
```

The create and update property contracts must also accept `city`, `area`, and `amenities`.

## 9. Viewing requests and scheduling

Affected screens:

- Property details `Request a live tour`
- Agent Dashboard `Coming up`
- Notification preference for viewing reminders

Existing support:

```http
POST /api/tours/jitsi/{propertyId}
```

The Jitsi endpoint creates room credentials. It does not create a viewing request, schedule a date, or let a host approve the request.

### Request a viewing

```http
POST /api/viewings
```

Authorization: Verified tenant.

Request:

```json
{
  "propertyId": 201,
  "type": "VIRTUAL",
  "proposedStartAt": "2026-09-16T15:00:00+01:00",
  "note": "An afternoon viewing works best for me."
}
```

Types:

```text
VIRTUAL
IN_PERSON
```

Statuses:

```text
PENDING
CONFIRMED
DECLINED
CANCELLED
COMPLETED
```

### List tenant viewings

```http
GET /api/viewings/mine?status=CONFIRMED&page=0&size=20
```

### List host viewings

```http
GET /api/viewings/host?status=PENDING&page=0&size=20
```

Authorization: `LANDLORD` or `AGENT`.

### Respond to a viewing

```http
PATCH /api/viewings/{viewingId}/status
```

Request:

```json
{
  "status": "CONFIRMED",
  "scheduledStartAt": "2026-09-16T15:00:00+01:00"
}
```

### Join a confirmed virtual viewing

The existing Jitsi route can remain the room-credential endpoint, but it should receive or validate a confirmed viewing ID before issuing access.

Recommended contract:

```http
POST /api/viewings/{viewingId}/join
```

Response:

```json
{
  "success": true,
  "message": "Virtual viewing room ready",
  "data": {
    "roomName": "property-201-viewing-901",
    "token": "jitsi-token",
    "joinUrl": "https://meet.keyz.ng/property-201-viewing-901"
  }
}
```

This endpoint can internally reuse the existing Jitsi service.

## 10. Lease documents

Affected screen: Tenant My Home.

The screen currently displays an unavailable notice because bookings contain dates and prices but no agreement documents.

### List tenancy documents

```http
GET /api/bookings/{bookingId}/documents
```

Authorization: Tenant or host participating in the tenancy.

Response:

```json
{
  "success": true,
  "message": "Tenancy documents retrieved",
  "data": [
    {
      "id": 501,
      "type": "LEASE_AGREEMENT",
      "name": "Lease agreement.pdf",
      "status": "AVAILABLE",
      "uploadedBy": "LANDLORD",
      "createdAt": "2026-09-10T09:00:00Z",
      "downloadUrl": "https://example.com/signed-document-url"
    }
  ]
}
```

Document types:

```text
LEASE_AGREEMENT
INVENTORY_REPORT
MOVE_IN_REPORT
MOVE_OUT_REPORT
RECEIPT
OTHER
```

### Upload a tenancy document

```http
POST /api/bookings/{bookingId}/documents
Content-Type: multipart/form-data
```

Authorization: Landlord or agent participating in the booking.

Form fields:

```text
file: required PDF or image
type: required document type
name: optional display name
```

### Delete a tenancy document

```http
DELETE /api/bookings/{bookingId}/documents/{documentId}
```

Only the uploader or an admin should be able to delete a document. Documents tied to completed financial records may need retention instead of deletion.

## 11. Rent schedule and receipts

Affected screens:

- Tenant My Home payment overview
- Tenant payment settings
- Host payment history

Existing support:

```http
GET /api/escrow/mine
```

Escrow provides one transaction for the current booking flow. It does not provide recurring rent periods, due dates, invoices, or receipts.

### Get a tenancy payment schedule

```http
GET /api/bookings/{bookingId}/payment-schedule
```

Response:

```json
{
  "success": true,
  "message": "Payment schedule retrieved",
  "data": {
    "bookingId": 301,
    "currency": "NGN",
    "frequency": "MONTHLY",
    "nextPaymentDueAt": "2026-10-01",
    "instalments": [
      {
        "id": 601,
        "periodStart": "2026-09-01",
        "periodEnd": "2026-09-30",
        "dueAt": "2026-09-01",
        "amount": 750000,
        "status": "PAID",
        "paidAt": "2026-08-29T08:05:00Z",
        "receiptId": 901
      }
    ]
  }
}
```

Instalment statuses:

```text
UPCOMING
DUE
PAID
OVERDUE
WAIVED
REFUNDED
```

### List payment receipts

```http
GET /api/bookings/{bookingId}/receipts
```

### Download a receipt

```http
GET /api/bookings/{bookingId}/receipts/{receiptId}
```

The response may be a PDF or a short-lived signed URL.

## 12. Maintenance requests

Affected screens:

- Tenant My Home maintenance panel
- Future landlord and agent tenancy management

### Create a maintenance request

```http
POST /api/maintenance-requests
```

Authorization: Tenant with a confirmed or active tenancy booking.

Request:

```json
{
  "bookingId": 301,
  "category": "PLUMBING",
  "priority": "NORMAL",
  "title": "Kitchen tap is leaking",
  "description": "The tap started leaking this morning."
}
```

Categories:

```text
PLUMBING
ELECTRICAL
APPLIANCE
SECURITY
STRUCTURAL
OTHER
```

Priorities:

```text
LOW
NORMAL
URGENT
EMERGENCY
```

Statuses:

```text
OPEN
ACKNOWLEDGED
IN_PROGRESS
RESOLVED
CLOSED
CANCELLED
```

Response:

```json
{
  "success": true,
  "message": "Maintenance request submitted",
  "data": {
    "id": 701,
    "bookingId": 301,
    "propertyId": 201,
    "category": "PLUMBING",
    "priority": "NORMAL",
    "title": "Kitchen tap is leaking",
    "description": "The tap started leaking this morning.",
    "status": "OPEN",
    "createdAt": "2026-09-08T12:00:00Z",
    "updatedAt": "2026-09-08T12:00:00Z"
  }
}
```

### List tenant requests

```http
GET /api/maintenance-requests/mine?bookingId=301&page=0&size=20
```

### List host requests

```http
GET /api/maintenance-requests/host?status=OPEN&page=0&size=20
```

Authorization: `LANDLORD` or `AGENT`.

### Update a request

```http
PATCH /api/maintenance-requests/{requestId}
```

Request:

```json
{
  "status": "IN_PROGRESS",
  "hostNote": "A plumber is scheduled for tomorrow morning."
}
```

### Add evidence

```http
POST /api/maintenance-requests/{requestId}/attachments
Content-Type: multipart/form-data
```

Form field:

```text
file: image or PDF
```

## 13. Unified activity feed

Affected screens:

- Tenant Browse Listings activity panel
- Agent Dashboard upcoming activity
- Future dashboard notification surfaces

Some activity can be derived from bookings, escrow, disputes, and chat. A single ordered feed does not exist.

### Get current-user activity

```http
GET /api/activity/mine?cursor=<cursor>&size=20
```

Response:

```json
{
  "success": true,
  "message": "Activity retrieved",
  "data": {
    "items": [
      {
        "id": "activity_01J8ZK3H",
        "type": "ESCROW_HELD",
        "occurredAt": "2026-09-08T11:42:00Z",
        "resourceType": "BOOKING",
        "resourceId": 301,
        "propertyId": 201,
        "propertyTitle": "Lekki Garden Maisonette",
        "actor": {
          "id": 41,
          "name": "Chinedu Okafor",
          "role": "LANDLORD"
        },
        "metadata": {
          "amount": 750000,
          "currency": "NGN"
        }
      }
    ],
    "nextCursor": null
  }
}
```

Recommended event activity types:

```text
BOOKING_REQUESTED
BOOKING_CONFIRMED
BOOKING_CANCELLED
MOVE_IN_UPCOMING
ESCROW_AWAITING_PAYMENT
ESCROW_HELD
PAYOUT_RELEASED
DISPUTE_OPENED
DISPUTE_RESOLVED
VIEWING_REQUESTED
VIEWING_CONFIRMED
MESSAGE_RECEIVED
LISTING_VERIFIED
LISTING_REJECTED
```

The frontend owns the visible sentence. The backend returns stable types and metadata.

## 14. Saved payment methods

Affected screen: Tenant payment settings.

The cards displayed in settings are mock data. Card details must not be stored directly by Rello.

### List saved payment methods

```http
GET /api/payment-methods
```

Response:

```json
{
  "success": true,
  "message": "Payment methods retrieved",
  "data": [
    {
      "id": 801,
      "provider": "PAYSTACK",
      "brand": "VISA",
      "last4": "4821",
      "expiryMonth": 8,
      "expiryYear": 2028,
      "default": true
    }
  ]
}
```

Only provider authorization references and masked display fields may be stored. Never return a full card number or CVV.

### Set the default method

```http
PATCH /api/payment-methods/{paymentMethodId}
```

Request:

```json
{
  "default": true
}
```

### Remove a payment method

```http
DELETE /api/payment-methods/{paymentMethodId}
```

Adding a card should happen through a Paystack-authorized transaction or setup flow. The backend should not accept raw card details from the frontend.

## 15. Host payout account management

Affected screens:

- Landlord payment settings
- Agent payment settings when the same payout interface is enabled

Existing support:

```http
POST /api/verification/payout/resolve
POST /api/verification/payout/setup
GET  /api/verification/status
```

The current backend effectively exposes one verified payout account through verification status. The settings UI displays multiple accounts.

Product decision:

- If Rello supports one payout account, change the UI to singular and use the existing endpoints.
- If Rello supports multiple accounts, implement the endpoints below.

### List payout accounts

```http
GET /api/payout-accounts
```

Response:

```json
{
  "success": true,
  "message": "Payout accounts retrieved",
  "data": [
    {
      "id": 901,
      "bankCode": "058",
      "bankName": "GTBank",
      "accountName": "CHINEDU OKAFOR",
      "accountLast4": "4821",
      "status": "APPROVED",
      "default": true
    }
  ]
}
```

### Set the default payout account

```http
PATCH /api/payout-accounts/{accountId}
```

Request:

```json
{
  "default": true
}
```

### Remove a payout account

```http
DELETE /api/payout-accounts/{accountId}
```

Do not allow removal when a payout is actively `RELEASING` unless another verified default account exists and the in-progress transfer remains tied to its original destination.

Payout history itself can use the existing `GET /api/escrow/mine` endpoint. A separate payout-history endpoint is optional if pagination or settlement-specific filtering becomes necessary.

## 16. Admin booking management

Affected screen: `/admin/bookings`.

Existing tenant and host booking endpoints are scoped to the authenticated participant. Admins cannot list all bookings.

### Search all bookings

```http
GET /api/admin/bookings?status=PENDING&query=lekki&page=0&size=25
```

Authorization: `ADMIN`.

Supported filters:

- `status`
- `propertyId`
- `tenantId`
- `hostId`
- `startFrom`
- `startTo`
- `query` for booking ID, property title, tenant name, or host name
- `page` and `size`

Response uses `PageResponse<BookingResponse>`.

### Get one booking

```http
GET /api/admin/bookings/{bookingId}
```

Administrative status changes should not reuse the participant endpoint without an audit trail. If manual intervention is required, add:

```http
POST /api/admin/bookings/{bookingId}/decision
```

Request:

```json
{
  "status": "CANCELLED",
  "reason": "Cancelled after dispute resolution."
}
```

Record the admin ID, previous status, new status, reason, and timestamp.

## 17. Admin escrow management

Affected screen: `/admin/escrow`.

Existing support:

```http
GET  /api/admin/escrow/{escrowId}
POST /api/admin/escrow/{escrowId}/refund
```

The missing part is an escrow collection endpoint.

### Search escrow transactions

```http
GET /api/admin/escrow?status=HELD&query=lekki&page=0&size=25
```

Supported filters:

- `status`
- `bookingId`
- `tenantId`
- `hostId`
- `createdFrom`
- `createdTo`
- `query`
- `page` and `size`

Response uses `PageResponse<EscrowResponse>`.

Each result should also expose provider references and failure information to admins through a separate admin response DTO. Sensitive bank account numbers must remain masked.

## 18. Admin review moderation

Affected screen: `/admin/ratings`.

Existing review endpoints are participant-facing and do not provide a moderation queue.

### Search reviews

```http
GET /api/admin/reviews?status=PUBLISHED&query=property&page=0&size=25
```

Recommended statuses:

```text
PUBLISHED
HIDDEN
FLAGGED
REMOVED
```

Response:

```json
{
  "success": true,
  "message": "Reviews retrieved",
  "data": {
    "items": [
      {
        "id": 1001,
        "propertyId": 201,
        "propertyTitle": "Lekki Garden Maisonette",
        "rating": 4,
        "comment": "The listing was accurate.",
        "direction": "TENANT_TO_HOST",
        "status": "PUBLISHED",
        "createdAt": "2026-09-01T08:00:00Z",
        "reviewer": {
          "id": 71,
          "name": "Kelechi Eze",
          "role": "TENANT"
        },
        "subject": {
          "id": 41,
          "name": "Chinedu Okafor",
          "role": "LANDLORD"
        }
      }
    ],
    "page": 0,
    "size": 25,
    "totalItems": 1,
    "totalPages": 1,
    "hasNext": false
  }
}
```

### Moderate a review

```http
PATCH /api/admin/reviews/{reviewId}/status
```

Request:

```json
{
  "status": "HIDDEN",
  "reason": "Contains personal contact information."
}
```

Store an audit record for every moderation decision.

# Existing endpoints that should be integrated instead of rebuilt

## Landlord Dashboard

The current mock can be replaced using these endpoints in parallel:

```http
GET /api/users/me
GET /api/verification/status
GET /api/properties/portfolio
GET /api/bookings/host
GET /api/escrow/mine
GET /api/disputes/mine
```

No new endpoint is required for the first integration.

A later optimization may add:

```http
GET /api/dashboard/landlord
```

This should only aggregate existing data. It must not become a separate source of business truth.

## Agent Dashboard

Most current cards and lists can use:

```http
GET /api/users/me
GET /api/verification/status
GET /api/properties/portfolio
GET /api/bookings/host
GET /api/escrow/mine
```

Calculations:

```text
Active listings = verified properties
Tenancy requests = PENDING bookings
Occupied homes = properties with an active CONFIRMED booking
Expected monthly rent = sum of rent for active tenancies
```

Only the mocked virtual-viewing item requires the new viewing API. A dedicated `/api/dashboard/agent` endpoint is an optional aggregation optimization.

## Agent Tenancies

The mocked Agent Tenancies screen can use:

```http
GET   /api/bookings/host
PATCH /api/bookings/{id}/status?status=CONFIRMED
PATCH /api/bookings/{id}/status?status=CANCELLED
PATCH /api/bookings/{id}/status?status=COMPLETED
POST  /api/chat/send
```

Frontend tenancy stages are derived from booking status and dates:

```text
request = booking where status is PENDING
upcoming = CONFIRMED and startDate is in the future
active = CONFIRMED and current date is within the tenancy period
past = COMPLETED, CANCELLED, or an expired confirmed tenancy
```

No new tenancy endpoint is required for version one. Pagination and server-side filtering should be added to `GET /api/bookings/host` when the result set grows.

## Tenant My Home core data

The current home and rental history already use:

```http
GET /api/bookings/mine
GET /api/escrow/mine
GET /api/chat/conversation
POST /api/chat/send
GET /api/properties/{propertyId}
GET /api/hosts/{hostId}
```

Only documents, recurring payment information, and maintenance require new backend functionality.

## Tenant Browse Listings

These already exist:

```http
GET    /api/properties/rent?page=0&size=12
GET    /api/saved-listings
POST   /api/saved-listings/{propertyId}
DELETE /api/saved-listings/{propertyId}
```

The current frontend filters only the properties already loaded. For accurate platform-wide search, expand the existing rent endpoint with optional parameters:

```http
GET /api/properties/rent?query=lekki&city=Lagos&minPrice=100000&maxPrice=500000&minBedrooms=2&sort=PRICE_ASC&page=0&size=12
```

This is an existing endpoint enhancement, not a new endpoint.

## Property booking action

The Property Details `Continue` action is still visual, but the backend route already exists:

```http
POST /api/bookings
```

Request:

```json
{
  "propertyId": 201,
  "startDate": "2026-10-01",
  "endDate": "2027-10-01"
}
```

The frontend needs a date and confirmation flow. The backend does not need a new booking endpoint.

## Admin settings statistics

Replace the hardcoded stat strip with:

```http
GET /api/admin/metrics
```

No new statistics endpoint is needed.

# Dormant placeholder routes

The following routes still exist in the source but are not part of the current Agent top navigation:

```text
/agent/disputes
/agent/escrow
/agent/ratings
```

Their labels currently refer to older concepts such as Requests, Payouts, and Strikes. Do not build new backend endpoints solely for these placeholder pages until the product scope and final screens are confirmed.

Relevant existing endpoints already include:

```http
GET  /api/disputes/mine
POST /api/disputes
POST /api/disputes/{id}/escalate
POST /api/disputes/{id}/withdraw
GET  /api/escrow/mine
GET  /api/reviews/mine
GET  /api/reviews/received
POST /api/reviews
```

# Recommended implementation order

## Priority 0: Needed for core rental use

1. Property gallery and amenities contract.
2. Server-side listing drafts.
3. Viewing requests and scheduling.
4. Lease documents.
5. Maintenance requests.
6. Rent schedule and receipts, if rent is collected on a recurring basis.

## Priority 1: Needed to remove settings mocks

1. Profile update and avatar upload.
2. Notification preferences.
3. Privacy preferences.
4. Data exports.
5. Account deactivation.
6. Login sessions.
7. Two-factor authentication.
8. Saved payment methods, only if the product keeps this settings section.
9. Multiple payout-account management, only if the product supports more than one account.

## Priority 2: Operational and admin completeness

1. Admin booking search and detail.
2. Admin escrow search.
3. Admin review moderation.
4. Unified activity feed.
5. Optional landlord and agent dashboard aggregate endpoints.

# Backend schema additions

The missing endpoints imply new or expanded persistence models:

```text
UserProfile
UserAvatar or avatar fields on User
NotificationPreference
PrivacyPreference
DataExportJob
UserSession
TotpCredential
PropertyDraft
PropertyImage
PropertyAmenity
Viewing
TenancyDocument
PaymentSchedule
PaymentInstalment
PaymentReceipt
MaintenanceRequest
MaintenanceAttachment
ActivityEvent or an activity projection
SavedPaymentMethod
ReviewModerationAudit
AdminActionAudit
```

Sensitive fields such as TOTP secrets, payment provider tokens, bank account numbers, identity numbers, and storage object keys must not be returned directly to the frontend.

# Source files used for this audit

Frontend:

- `src/app/(agent)/agent/dashboard/page.tsx`
- `src/app/(agent)/agent/bookings/page.tsx`
- `src/app/(landlord)/landlord/dashboard/page.tsx`
- `src/app/(landlord)/landlord/bookings/page.tsx`
- `src/app/(tenant)/tenant/bookings/page.tsx`
- `src/app/(tenant)/tenant/browse/page.tsx`
- `src/app/property/[id]/page.tsx`
- `src/components/listings/CreateListingForm.tsx`
- `src/components/listings/HostListingsView.tsx`
- `src/components/settings/sections/ProfileSection.tsx`
- `src/components/settings/sections/NotificationsSection.tsx`
- `src/components/settings/sections/PaymentsSection.tsx`
- `src/components/settings/sections/PrivacySection.tsx`
- `src/components/settings/sections/SecuritySection.tsx`
- `src/components/settings/SettingsDangerZone.tsx`
- `src/lib/tenantActivity.ts`
- `src/lib/propertyDetails.ts`
- `src/lib/hostListings.ts`

Backend:

- `src/main/java/com/example/backend/controller/AuthController.java`
- `src/main/java/com/example/backend/controller/UserController.java`
- `src/main/java/com/example/backend/controller/PropertyController.java`
- `src/main/java/com/example/backend/controller/BookingController.java`
- `src/main/java/com/example/backend/controller/VerificationController.java`
- `src/main/java/com/example/backend/controller/EscrowController.java`
- `src/main/java/com/example/backend/controller/DisputeController.java`
- `src/main/java/com/example/backend/controller/ReviewController.java`
- `src/main/java/com/example/backend/controller/AdminController.java`
- `src/main/java/com/example/backend/controller/VirtualTourController.java`
- `src/main/java/com/example/backend/security/SecurityConfig.java`
