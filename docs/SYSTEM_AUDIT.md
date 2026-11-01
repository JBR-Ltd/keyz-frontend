# System audit

16 September 2026. Covers both repositories: this one and `keyz-backend`.

Virtual tours and floor plans are owned by another team and are deliberately left
out, except where something else touches them.

## How to read this

- **Built** means it works end to end, a person can reach it in the product, and
  there is a test or a verified run behind it.
- **Partial** means the mechanism exists but a person cannot fully use it, or it
  only covers the obvious case.
- **Missing** means there is nothing.

## What is built

### Accounts and identity

| Area | Status | Notes |
| --- | --- | --- |
| Registration, login, Google sign-in | Built | |
| Two-factor sign-in, password reset, email verification | Built | Codes queued through an outbox, retried on failure |
| Session list and remote sign-out | Built | Device names recorded |
| Identity verification (NIN, BVN) | Built | Dojah. Sandbox locally; production keys are an operations task |
| Agent verification, business verification (KYB) | Built | Admin decides |
| Payout account verification | Built | Paystack account resolution, name match |
| Account deactivation, deletion, data export | Built | Transaction records survive deletion, as the law requires |
| Customer due diligence for large payments | Built | Address, occupation, source of funds above ₦5,000,000 |

### Listings

| Area | Status | Notes |
| --- | --- | --- |
| Drafts, publishing, editing, gallery, ordering | Built | |
| Listing verification: ownership proof, location proof, utility bill | Built | OCR through Textract |
| Duplicate photo detection | Built | Flagged listings are hidden from the public |
| Availability calendar and host blocks | Built | |
| Shortlet settings: minimum nights, cleaning fee, guest limit | Built | |
| Refundable deposit on any letting | Built | New this pass |
| Public identifiers for shared links | Built | Numeric ids no longer expose unpublished listings |
| Reporting a listing or a person | Partial | API tested; screens built but not yet clicked through in a browser. Reporter stays anonymous; three open reports raise a risk flag |

### Discovery

| Area | Status | Notes |
| --- | --- | --- |
| Browse, filters, city search, server-side paging | Built | |
| Plain-English search | Built | |
| Saved listings | Built | |
| Host profiles | Built | |
| Map view, commute filters | Missing | Sorting is built |
| Saved searches and alerts | Partial | API tested; screens built but not yet clicked through in a browser. Daily digest of listings that went live since the last look |

### Bookings

| Area | Status | Notes |
| --- | --- | --- |
| Rental requests (no invented dates) and shortlet bookings | Built | |
| Quotes priced by the server | Built | Includes the deposit |
| Guest limits | Built | |
| Accept with a move-in date | Built | Required, so escrow always has a date to run from |
| Decline and cancel with a reason | Built | The other side is shown it |
| Deadline to pay, and automatic release if nobody does | Built | |
| Double-booking protection | Built | Listing row locked; race tested |
| Lifecycle stages shared by server and client | Built | |
| Rent instalments | Partial | API tested; screens built but not yet clicked through in a browser. 2, 4 or 12 parts on yearly lets the host allows; deposit rides on the first |

### Payments, escrow and deposits

| Area | Status | Notes |
| --- | --- | --- |
| Paying by card or transfer, and the return page | Built | New this pass; previously nothing called the pay endpoint |
| Webhook confirmation, with a charge matched to its booking | Built | |
| Duplicate charge refunded automatically | Built | |
| Escrow hold, auto-release, host payout, commission | Built | Commission on rent only |
| Refunds that actually move money | Built | Previously only relabelled the record |
| Cancellation refunds, and refusal once a stay has begun | Built | |
| Reconciliation of stuck payouts, refunds and deposit returns | Built | |
| Deposit held apart, returned automatically, claimable with evidence | Built | Admin decides any split |
| Receipts and payout statements | Partial | API tested; screens built but not yet clicked through in a browser. JSON receipts and statements; printing and CSV are the frontend's job |
| Payout schedule visibility for hosts | Partial | Status and the statement API exist; no timetable screen |

### Tenancy management

| Area | Status | Notes |
| --- | --- | --- |
| Tenancy documents | Built | |
| Maintenance requests, with host replies | Built | Emails added this pass |
| Renewal reminders at 60, 30 and 7 days | Built | New this pass |
| Move-in and move-out condition reports with photos | Partial | API tested; screens built but not yet clicked through in a browser. Frozen and hashed on submit; the other side acknowledges or contests |
| Tenancy agreement signing | Partial | API tested; screens built but not yet clicked through in a browser. Template in the backend for legal to edit; typed-name signatures with IP and time |

### Viewings and messaging

| Area | Status | Notes |
| --- | --- | --- |
| Viewing requests, host decisions, virtual viewings | Built | Jitsi |
| Viewing reminders | Built | New this pass |
| Chat, with property, tour and floor plan sharing | Built | Polling, not websockets, on purpose |
| Off-platform contact filtering | Built | |
| In-app notification centre | Partial | API tested; screens built but not yet clicked through in a browser. Every email also lands here |
| WhatsApp or SMS | Built | Termii, for the moments that matter; turned on by setting the API key. Preference toggles have no screen yet |

### Trust, reviews and disputes

| Area | Status | Notes |
| --- | --- | --- |
| Reviews both ways, moderation, trust score | Built | |
| Double-blind reviews, review window, host replies | Partial | API tested; screens built but not yet clicked through in a browser. Reviews bind to a specific stay. The listing page still shows no real reviews |
| Disputes: open, escalate, withdraw, admin resolution | Built | Freezes the money; emails added this pass |
| Evidence upload on a dispute | Partial | API tested; screens built but not yet clicked through in a browser |

### Admin and compliance

| Area | Status | Notes |
| --- | --- | --- |
| Metrics, bookings, escrow, disputes, reviews, users, verifications | Built | |
| Unpublishing listings, booking decisions, audit trail | Built | |
| Risk queue with clear and escalate, and a written record | Built | New this pass |
| Deposit claim decisions | Built | New this pass |
| Sanctions and politically exposed person screening | Built | Dojah, for people who move large sums; a possible match raises a flag and is never shown to the person. Request shape to confirm in the sandbox |
| Reporting exports for SCUML and the NFIU | Partial | API tested; screens built but not yet clicked through in a browser. Large payments, risk flags, screenings as CSV, every export audited |

### Platform

| Area | Status | Notes |
| --- | --- | --- |
| Database migrations, schema validated on start | Built | V1 to V11; V6 onward not yet applied to Neon |
| Request ids through every proxy | Built | |
| Cache validators on public reads | Built | |
| Rate limiting on `/api/**` | Built | |
| Query-count guard against N+1 reads | Built | Caught a real regression this pass |
| Metrics: latency percentiles, pool pressure, startup time | Built | `/actuator/metrics`, admins only. See `keyz-backend/docs/PERFORMANCE.md` |
| Error tracking, uptime alerts, dashboards | Missing | Metrics exist; nothing collects or alerts on them |
| Load testing at production size | Partial | Browse over 2,000 listings and cursor walks over 600 bookings; no concurrent load test |

## What is left, ranked

### Before taking real money

1. Register with SCUML and appoint a compliance officer. See
   the compliance programme in the `keyz-backend` repository, `docs/COMPLIANCE_AML.md`.
2. Register with the Nigeria Data Protection Commission and have a lawyer review
   the policies, terms and privacy notice. Terms of service are not written.
3. Production configuration: `RELLO_FRONTEND_BASE_URL`, Paystack live keys and the
   webhook URL, Dojah production credentials, and `TZ=Africa/Lagos`.
4. Rotate the Resend key committed to backend history at `67be1d7`.
5. Run one real payment, refund and payout in Paystack test mode against staging.
   Everything here is tested against mocks.
6. Click through the main flows in a browser. Not done in this pass, because the
   only backend available locally points at the shared database.

### Soon after

1. Click through every screen added for the gaps above against a local database: notifications,
   reports, reviews, instalments, receipts and statements, condition reports, agreements,
   saved searches, mandates, and the admin reports and compliance pages.
2. Load test at production size with concurrent users; the current tests cover query counts,
   payload size and connection isolation, not concurrency.
3. Error tracking and alerting on the metrics `/actuator/metrics` now exposes.

### Later

Map search, shortlet calendar sync, referrals, an insurance-style guarantee, mobile
apps, more languages, and observability worth the name.

## Watch items

- **Refund lookups.** Paystack cannot look a refund up by the charge it belongs to,
  so reconciliation scans recent refunds for ours. Fine at current volume, worth
  revisiting later.
- **Timestamps carry no zone.** Payment deadlines can read an hour out in the
  browser until `TZ` is set on the server.
- **Auto-release depends on the move-in date.** It is now required when a host
  accepts, and release counts from the later of move-in and payment, so a backdated
  date cannot release money early.
- **Email only, one provider.** No bounce handling, no fallback sender.
- **Chat polls.** A deliberate choice against the thread limits of the current host,
  but it will need revisiting with volume.
