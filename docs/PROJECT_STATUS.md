# Rello: project status

What has been built, what changed in this round of work, what was found and fixed along the way, and exactly where things stand. Written 17 September 2026.

## 1. At a glance

| | State |
| :--- | :--- |
| Backend features (all gaps from the audit) | Built and wired |
| Backend tests | 209 passing, 0 failing (full run, 17 September, after every change in this round) |
| Frontend screens for every gap | Built; type checks, lint and production build all pass |
| Frontend production build | `npm run build` passes |
| Clicked through in a browser | **Not yet** |
| Committed | Backend and frontend up to commits `01726ff` and `f4632c7`. **Everything in this round is uncommitted.** |
| Deployed | No. Migrations V6 to V11 are not on Neon. |

Repositories:
- Backend: `C:\Users\BEST\Documents\backend` (Spring Boot 3.5, Java 17), branch `founder1`.
- Frontend: `C:\Users\BEST\Documents\keyz-frontend` (Next.js 16), branch `founder-1`.

## 2. What Rello can do now

### Bookings and listings
- Long-term rental requests (no invented end date) and shortlet bookings with exact dates, each with its own endpoint and rules.
- Move-in preference, guest limits, server-side pricing, a lifecycle stage every client agrees on.
- Accepting a rental request marks the home rented and cancels competing requests.
- Opaque public ids (`p_`, `u_`) for shareable links.
- Hosts can let tenants pay a yearly rent in 2, 4 or 12 parts.

### Money
- Paystack checkout, webhook and return-page confirmation, duplicate charges refunded.
- Escrow held until the later of move-in and payment plus 3 days, then paid out less Rello's 5%.
- Refundable caution-fee deposits held for the tenant, with claims settled by an admin.
- Rent instalments: plan choice, reminders, arrears, and a payout for each part.
- Receipts (printable) and statements (with CSV) for tenants and hosts.
- Agents managing homes for landlords: rent goes to the landlord's verified account and the agent's fee is paid separately.

### Trust, safety and compliance
- In-app notifications, plus SMS or WhatsApp through Termii.
- Reports against listings and people, with an admin queue.
- Dispute evidence uploads.
- Reviews bound to a stay, hidden until both sides write one, with a host reply.
- Move-in and move-out condition reports with photos, frozen and hashed on submit.
- Tenancy agreements signed with a typed name, version by version.
- Risk flags for large payments, refund patterns, shared payout accounts, rapid cancellations, missing due diligence, repeated reports and sanctions matches.
- Sanctions, PEP and adverse media screening through Dojah, for people who move large sums.
- Admin CSV exports for SCUML and NFIU work, every export audited.

### Discovery
- Server-side search and filters, plain-English search, saved listings.
- Saved searches with daily email alerts for new matching homes.

## 3. What was done in this round (uncommitted)

### 3.1 Backend: finishing batch 4

Commit `01726ff` contained batch 4 half wired. This round finished it:
- **Rent under a mandate goes to the landlord.** Escrow payouts, instalment payouts and deposit claims pay the landlord's account. The agent's fee is recorded when the payout starts, becomes payable once it lands, is paid by `MarketplaceJobs`, and is cancelled if the rent is refunded.
- **Ended mandates** leave search and saved-search alerts, and new bookings get 409.
- **Statements follow the money.** The landlord sees managed rent; the agent sees `AGENT_FEE` rows instead.
- **Saved-search alerts can fire.** Listings now record `liveSince` when first verified; before, alerts never matched.
- **Screening is limited** to people with due diligence details or a verified payout account. The committed version would have screened, and paid for, every user.
- **Date of birth** is accepted on the compliance profile, to sharpen screening.
- **Booking responses** now say whether the host allows instalments (`instalmentsAllowed`, `maxInstalments`).

### 3.2 Backend: the BACKEND_CHANGES.md spec gaps

Spec: `C:\Users\BEST\Downloads\BACKEND_CHANGES.md`. Everything in it was already done except these, now closed:
- **Cursor pagination:** `?cursor=` on `/api/bookings/mine`, `/api/bookings/host` and `/api/notifications`, with an `X-Next-Cursor` header. Page numbers still work.
- **Compact browse cards:** `?view=card` on `/api/properties/rent|sale|all` drops descriptions and tour links.
- **Availability for long-term homes:** a long-term listing has no booking calendar and says so (`X-Rental-Mode`). Old dated bookings no longer show as taken nights.
- **Deprecated endpoints announce themselves:** `POST /api/bookings` and `GET /api/bookings/quote` send `Deprecation` and `Link` headers, log a warning and count `rello.deprecated.requests`.
- **Metrics:** `/actuator/metrics`, admins only, covers request, repository and provider latency (median, 95th and 99th percentile), database pool pressure and startup time.
- **Latency targets and decisions:** documented in `backend/docs/PERFORMANCE.md`.
- **Scale and isolation tests** (section 5).

### 3.3 Problems found and fixed

| Problem | Effect before the fix | Fix |
| :--- | :--- | :--- |
| `/api/users/me` returned screening status, reference and date of birth | A person could see they matched a watchlist, which is tipping off (an offence under the MLPPA 2022) | Fields marked `@JsonIgnore` |
| Browse loaded each card's host, host preferences and amenities one query at a time | 50 SQL statements for 24 cards | Ids first, then one card query: 3 statements at any page size |
| The refund after a cancellation ran while the database connection was still held | A slow Paystack call tied up a pool connection | Hibernate now releases connections at commit (`hibernate.connection.handling_mode`) |
| Compliance exports wrote their audit row inside a read-only transaction | Postgres would reject every export | Writable transaction |
| Preference keys: the settings screen saves `notify.sms` and similar, but the backend read `sms` | Turning off texts or alerts in settings did nothing | Backend reads the `notify.` keys |
| No Next.js route for `/api/compliance` | The due diligence dialog could never load or save, blocking large payments | Proxy route added |
| The shared frontend proxy read request bodies as text | File uploads through it were corrupted | Bodies forwarded as bytes |
| The reviews proxy only forwarded GET, and only with a login | Replies could not be posted; listing reviews needed a login | POST added; listing reviews public |
| The listing page never loaded real reviews | Always "No reviews yet" | Loads published reviews and host replies |

### 3.4 Frontend: screens for every gap

| Gap | What was built | Where |
| :--- | :--- | :--- |
| Notifications | Bell with unread count, list, load older, mark read, for every role | `components/notifications/NotificationsBell.tsx`, `lib/notifications.ts`, `DashboardShell` |
| SMS and WhatsApp | Two switches in notification settings | `components/settings/sections/NotificationsSection.tsx` |
| Dispute evidence | Upload photos or PDFs, list files | `components/disputes/DisputeBoard.tsx`, `lib/disputes.ts` |
| Reports | Report dialog on listing and host pages; admin queue | `components/reports/ReportDialog.tsx`, `app/(admin)/admin/reports` |
| Reviews | Review a specific stay, hidden-until-both notice, host replies, listing page reviews | `app/(tenant)/tenant/ratings`, `components/reviews/HostRatingsBoard.tsx`, `app/property/[id]`, `lib/reviews.ts` |
| Rent instalments | Plan picker, schedule, pay the next part, return page, host setting on the listing form | `components/tenant/InstalmentPlanSection.tsx`, `BookingPaymentPanel`, `app/(tenant)/tenant/payments/return`, `CreateListingForm`, `lib/instalments.ts` |
| Receipts and statements | Printable receipts, statement with date range and CSV | `app/receipts/[kind]/[id]`, `components/escrow/StatementView.tsx`, `app/(tenant|landlord|agent)/.../statement` |
| Condition reports | Rooms and items editor, photos, submit, acknowledge or contest | `components/tenancy/InspectionsPanel.tsx` |
| Tenancy agreement | Host drafts and signs to send; tenant signs or declines; print | `components/tenancy/AgreementPanel.tsx`, `TenancyRecordsDialog.tsx`, tenant bookings page, both host booking drawers |
| Saved searches | "Save search and get alerts" on browse, alert links open the search, management page | `app/(tenant)/tenant/browse`, `app/(tenant)/tenant/saved-searches`, `lib/marketplace.ts` |
| Agent mandates | Invite, accept or decline, add and remove listings, overview, end | `components/mandates/MandatesView.tsx`, `app/(landlord)/landlord/mandates`, `app/(agent)/agent/mandates` |
| Compliance | Date of birth field; admin exports and screen-now page; new risk labels | `ComplianceDetailsDialog`, `app/(admin)/admin/compliance`, `app/(admin)/admin/risk` |
| Navigation | Admin sidebar (Reports, Compliance); profile menus (Statement, Mandates, Saved searches) | `RoleSidebar`, `LandlordHeader`, `AgentHeader`, `TenantSidebar` |
| Proxies | Catch-all proxy factory; routes for notifications, saved searches, mandates, compliance, reports; PUT on bookings; cursor and download headers | `app/api/_catchAllProxy.ts`, `_authenticatedProxy.ts`, `_requestId.ts` |

### 3.5 Documents

| Document | State |
| :--- | :--- |
| `backend/docs/ENGINEERING_HANDOVER.md` | Rewritten from the code (the committed version had wrong endpoints, schedules and config keys) |
| Engineering handover page | Published privately at https://claude.ai/artifact/6wRKYs25gU3ArGNUZQ5VhQ (version 2, up to date) |
| `backend/docs/PERFORMANCE.md` | New |
| `keyz-frontend/docs/SYSTEM_AUDIT.md` | Statuses updated |
| `keyz-frontend/docs/POLICIES.md` | Em dashes removed |
| `keyz-frontend/docs/HANDOFF_NEXT_SESSION.md` | Instructions for another Claude session (copy in Downloads) |
| This file | Current status |

## 4. Endpoints added or changed in this round

| Method and path | Purpose |
| :--- | :--- |
| `GET /api/bookings/mine?cursor=`, `GET /api/bookings/host?cursor=` | Cursor paging |
| `GET /api/notifications?cursor=` | Cursor paging |
| `GET /api/properties/rent|sale|all?view=card` | Compact cards |
| `GET /api/properties/{id}/availability` | Long-term listings return only host blocks, with `X-Rental-Mode` |
| `GET /actuator/metrics` | Admin-only metrics |
| `PUT /api/compliance/profile` | Accepts `dateOfBirth` |

The batch 1 to 4 endpoints are listed in `backend/docs/ENGINEERING_HANDOVER.md`.

## 5. Tests

New backend suites this round:

| Suite | Proves |
| :--- | :--- |
| `MarketplaceTests` (5) | Saved-search alerts fire only for newly live homes and respect the preference; managed rent pays the landlord 85% and the agent 10%, with statements to match; ended mandates stop bookings and search; screening raises a flag and is never serialised; only an explicit no-match reads as clear; exports are admin-only, audited and formula-safe |
| `PlatformScaleTests` (3) | Browse over 2,000 listings costs 3 statements, is fast and compact, and caps page size; a cursor walk over 600 host bookings with an insert mid-walk has no duplicates or gaps; notification cursors |
| `ProviderIsolationTests` (2) | No database connection is held during checkout, verify, payout or refund calls |
| `ObservabilityTests` (3) | Metrics are admin-only and carry percentiles, pool gauges and startup time; the old quote endpoint sends deprecation headers and is counted; only shortlets have a booking calendar |

Frontend: `tsc --noEmit` and `eslint src` pass on the whole codebase.

## 6. Where we are right now

- **Backend full test suite:** 209 passing, 0 failing, with every change in this round.
- **Frontend:** `tsc --noEmit`, `eslint src` and `npm run build` all pass.
- **Browser check:** not done. A useful run needs a local backend, and the local backend points at the shared Neon database, which would apply migrations V6 to V11 early. It needs your go-ahead, or a local Postgres.
- **Nothing is committed.** Review the diff, then commit in two logical commits per repo (backend fixes and features; frontend screens).

## 7. What is left

### Before release
1. Run every new screen against a local database: notifications, reports, reviews, instalments, receipts, statements, condition reports, agreements, saved searches, mandates, admin reports and compliance.

### Before real money moves
1. Rotate the Resend API key in backend git history at commit `67be1d7`.
2. Back up Neon, then apply migrations V6 to V11 in a maintenance window.
3. Confirm the Dojah AML screening request and response in the sandbox.
4. Point the Paystack live webhook at `/api/escrow/webhook/paystack` and test a real transfer and refund with a small amount.
5. Get the Termii sender id approved.
6. Legal review of the tenancy agreement template (`backend/src/main/resources/agreements/tenancy-agreement.txt`), `POLICIES.md`, fees and deposit rules. SCUML and NDPC registration; appoint a compliance officer.
7. Production settings: `TZ=Africa/Lagos`, `DOJAH_ALLOW_MOCK=false`, `RELLO_FRONTEND_BASE_URL`.

### Known limits (acceptable for now, documented)
- Service-layer latency is not timed separately; request, repository and provider timings are.
- Cursor paging covers bookings and notifications, not chat or the activity feed.
- The startup timing check is a manual procedure; CI has no database.
- No concurrent load test yet, and nothing collects or alerts on the metrics.
- Chat still polls.
- Virtual tours and floor plans belong to the other team.
