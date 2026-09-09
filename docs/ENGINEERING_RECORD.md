# Engineering record

What changed across `keyz-frontend` and `backend`, why, and what is still outstanding.

Paths prefixed `backend/` are in the Spring Boot repo. Everything else is this repo.

---

## 1. Host verification: from fake to real

### The problem

Two parallel sets of verification screens existed. The reachable set was fake; the wired set was unreachable.

- `LandlordVerificationFlow.tsx` rendered at `/landlord/verify` and had **no identity step at all**. Its screens were `overview → kyb → payout → complete`. Zero references to NIN, selfie or camera in 1,384 lines. Landlords could therefore never become identity verified, and so could never list.
- `agent/verify/page.tsx` approved anyone after a 1.6 second `setTimeout` unless their NIN was eleven zeros.
- `HostIdentityVerificationFlow`, `HostPayoutVerificationFlow` and `HostVerificationCenter` called the real Dojah and Paystack endpoints, but **nothing imported them**: 1,444 lines of dead code.
- Both live flows wrote "verified" to `localStorage`. `lib/hostVerification.ts` was 249 lines with no network calls. `getVerificationStatus()`, the one function that read server truth, was called by nothing.

The consequence: a host finished the flow, saw "Fully verified", then had every listing refused by a backend that had never heard of them. It also broke the other way, since verifying on a phone left a laptop showing unverified.

### What replaced it

Routes now render the real components:

| Route | Component |
| --- | --- |
| `/landlord/verify`, `/agent/verify` | `HostVerificationCenter` |
| `/*/verify/identity` | `HostIdentityVerificationFlow` |
| `/*/verify/payout` | `HostPayoutVerificationFlow` |

`LandlordVerificationFlow.tsx` and the fake agent page are deleted, about 2,080 lines removed.

`lib/hostVerification.ts` is now server backed. Every read goes to `/api/verification/status`. Nothing about verification is cached in the browser.

### Documents actually upload now

They were collected into component state as `{ id, name }`, discarding the `File`, so nothing could ever have been sent.

- `backend/POST /api/verification/kyb` is now multipart, uploads both files to S3, and always saves the record `PENDING` so a host cannot submit themselves approved.
- `KybVerification` gained `addressDocumentUrl` and `rejectionReason`.
- The Next proxy route at `src/app/api/verification/kyb/route.ts` was missing entirely and forwards bytes rather than text.
- Admin rejection now requires a reason, which the host is shown.

### Two judgment calls

**The third document upload was dropped.** The flow asked for business registration, a valid ID, and proof of address. Dojah's NIN plus selfie already proves the ID, so that upload duplicated work the host had just done.

**Agents submit documents too**, not only landlords. The backend already permitted it, and someone handling other people's property and money is the stronger case for business registration.

### Server truth

`VerificationStatusResponse` now carries KYB and payout state alongside identity, so one call tells the UI everything it renders. `describeStatus` reads each record once rather than five times, because it runs on every dashboard load.

---

## 2. Chat

`ChatServiceImpl` deleted messages on read, so a conversation vanished as soon as it was opened. `ChatMessage` gained `isRead` and `propertyId`, the repository gained conversation and thread queries, and the controller takes the sender from the token rather than the request body.

---

## 3. Resilience: the crash path

### The failure

Three facts combined into one outage:

1. `new RestTemplate()` in `DojahServiceImpl` and `PaystackServiceImpl` has **infinite** connect and read timeouts.
2. Those calls ran **inside database transactions** (`startPayment`, `confirmPayment`).
3. The connection pool was **5**.

So five slow Paystack calls held every connection forever, and every request in the app failed, including login and browsing, with no recovery. Nothing timed out, so nothing recovered.

A second instance of the same bug existed in `forgotPassword`, which is **public and unauthenticated** and sent email inside its transaction. Anyone could have exhausted the pool by hitting it.

### The fix

- `backend/config/HttpClientConfig.java` provides a shared `RestTemplate` with 5s connect and 15s read timeouts.
- `startPayment` and `confirmPayment` split so the provider call sits between two short transactions.
- `releaseDueHolds` was **one transaction wrapping a bank transfer per escrow**. It now reads due ids in one short transaction, then runs one transaction per payout, capped at 50 per run.

These use a `self()` proxy accessor. A `@Transactional` method called through `this` bypasses Spring's proxy and silently joins the caller transaction, which would have made the split do nothing.

### Capacity, sized for 512MB

Render free is 512MB and 0.1 CPU, so Tomcat was **capped rather than raised**. The default 200 threads costs roughly 1MB of stack each, which is a large slice of the instance held by threads that would only queue behind the pool anyway.

| Setting | Value | Why |
| --- | --- | --- |
| `hikari.maximum-pool-size` | 10 | Sized against Neon free tier, 0.25 vCPU |
| `hikari.minimum-idle` | 0 | Neon free suspends when idle and drops connections |
| `hikari.leak-detection-threshold` | 30s | Catches a provider call creeping back inside a transaction |
| `tomcat.threads.max` | 50 | Thread stacks are real memory on a 512MB box |
| `tomcat.accept-count` | 100 | Sheds load rather than exhausting heap |
| `jakarta.persistence.query.timeout` | 15s | Nothing holds a connection indefinitely |
| `transaction.default-timeout` | 30s | Same, at the transaction level |
| `server.shutdown` | graceful | A deploy cannot cut a payment write in half |

### Container

`Dockerfile` sets `MaxRAMPercentage=75` and **`ExitOnOutOfMemoryError`**. Without the latter, a heap exhausted JVM keeps running broken while still passing a TCP health check.

It also had `ENV SERVER_PORT=8080`, which overrode Render's injected `PORT`. Removed.

### Health check

`/actuator/health` is public, with `show-details=never`.

Mail and database indicators are **deliberately off**. Actuator's mail indicator probes SMTP, so a Zoho blip would have reported DOWN and had Render restart a healthy instance, causing the outage this work exists to prevent. The database is not a restart signal either, since restarting cannot fix an unreachable database, and probing it every 30s keeps Neon's free compute awake and burns the monthly hours.

### Slow leaks

- `ExpiredTokenCleanupJob` prunes the blacklist, which is queried on every authenticated request and previously grew one row per logout forever.
- S3 uploads stream instead of `file.getBytes()`, so a 10MB file is not a 10MB heap spike per concurrent upload.
- Multipart limits were never set, so Spring's **1MB default** silently rejected every real phone photo. Now 10MB per file, 25MB per request, with a friendly message on `MaxUploadSizeExceededException`.

---

## 4. Email: an outbox

Mail went out on the request thread. A slow mailbox held a Tomcat thread for the SMTP timeout, and a transient Zoho failure **lost the code permanently**, because the send threw and nothing retried.

Plain async was rejected: the send throws and callers surface that, so async would tell a signing up user "check your email" when nothing was sent.

Instead:

- `EmailService` renders the mail and writes one `OutboundEmail` row. No network.
- Because it is a single insert, it stays **inside** the caller transaction. That is the point of an outbox: the verification code and the email carrying it commit together, and a rolled back token leaves no email promising a code that does not exist.
- `EmailDispatchJob` drains the queue every 20 seconds on its own thread, 5 attempts, 1/2/4/8/16 minute backoff, then parks the row as `FAILED`.
- `SmtpMailGateway` is the only place SMTP is spoken, and it is never called from a request thread.
- Sent rows are pruned after 7 days.

---

## 5. Payout reliability

### The gap

There is real time between asking a bank to move money and learning whether it moved. The payout happened inside one transaction, so a crash in that gap left **no record that a transfer had been attempted**.

Worse, `transferToHost` sent no reference of ours, so Paystack minted its own. A retry would have been a **second payout to the host**.

### The design

1. `beginPayout` writes `RELEASING` with a reference derived from the escrow id, and commits.
2. The transfer happens outside any transaction, carrying `rello_payout_<escrowId>`. Paystack rejects duplicates, which is what makes a retry safe.
3. `finishPayout` records the outcome: `RELEASED` on success, back to `HELD` on an outright refusal.

`EscrowReconciliationJob` picks up anything left in `RELEASING` after 15 minutes and asks Paystack via the new `verifyTransfer`.

The important case is the third one. When Paystack **cannot say**, the job does nothing and asks again next run. Guessing either way pays a host twice or marks a completed payout as failed.

Admin metrics count `RELEASING` toward held, so money in flight does not vanish from the dashboard between states.

The frontend renders it as "On its way" for hosts and "Paying out" for tenants.

---

## 6. Security fixes earlier in this work

- `@JsonIgnore` on `User.password`, which was being returned publicly by `GET /api/properties/rent`.
- All credential fallbacks stripped to env only; a real JWT secret was committed in `SETUP.md` and replaced with a placeholder.
- Listing self verification removed, where both sides of the geofence came from the request body.
- Dojah mock gated behind `dojah.allow-mock`, default false, failing closed on missing credentials.
- Reset OTP lookups scoped by email, closing an account takeover path.
- Rate limiter takes the **rightmost** `X-Forwarded-For` hop, so the key cannot be spoofed.
- CORS wildcard removed.
- Tests were running against the production Neon database. They now use H2.

---

## 7. Deployment requirements

**Set `JPA_DDL_AUTO=update` for the next deploy.** It defaults to `validate`, and this work adds:

- table `outbound_emails`
- `escrow_transaction.payout_reference`, `escrow_transaction.release_started_at`
- `kyb_verification.address_document_url`, `kyb_verification.rejection_reason`

With `validate` the application **will not start**.

Then confirm `/actuator/health` returns 200 and point Render's health check at it.

### Still outstanding from the security audit

Credentials that appeared in git history should be rotated, particularly the JWT secret. Confirm `DOJAH_BASE_URL` points at production before going live, and that `dojah.enforce-name-match` is true.

---

## 8. Test coverage added

24 backend tests pass.

| Suite | Covers |
| --- | --- |
| `LoadResilienceTests` | Concurrent requests against a slow mail provider finish under budget; the queue is drained; a failed send is retried with backoff; health is public and UP; the provider `RestTemplate` has timeouts |
| `PayoutReliabilityTests` | The transfer carries our own idempotency reference; commission and host share sum exactly; an unknown outcome stays `RELEASING`; reconciliation settles, fails, or **leaves an unknown alone**; a payout in flight is not started twice |

The load test was verified by reintroducing the bug: an unrelated read waited **1916ms** with the transaction fault present, versus under 1000ms once fixed.

Two bugs were caught by these tests rather than by production: `release()` built its response outside a transaction and would have **500'd after successfully paying the host**, and the health endpoint returned 503.

### A limitation worth knowing

`backend/src/test/resources/application.properties` **shadows** the main properties file rather than merging with it, because the main file requires env vars with no defaults. Production configuration is therefore not exercised by the suite. Tests that need to prove a production setting declare it explicitly via `@SpringBootTest(properties = ...)`, as the health tests do.

---

## 9. What is still outstanding

### Unbuilt screens

Eight pages render a "Coming soon" stub, and in every case **the backend endpoint already exists**:

| Page | Endpoint available |
| --- | --- |
| `/agent/dashboard` | uses `RoleDashboardStub` |
| `/agent/bookings` | `GET /api/bookings/host` |
| `/agent/escrow`, `/admin/escrow` | `GET /api/escrow/mine` |
| `/agent/ratings`, `/admin/ratings` | `GET /api/reviews/received` |
| `/agent/disputes` | dispute endpoints exist |
| `/admin/bookings` | `GET /api/bookings/host` |

### Calls

`backend/CallController` exposes six endpoints (initiate, accept, reject, end, incoming, status) and `JitsiService` is complete. **There is no call UI in the frontend at all.** Chat was completed; calls were requested at the same time and were never built.

### Remaining fake data

- `getPropertyById` in `lib/propertyDetails.ts` checks `MOCK_PROPERTY_DETAILS` **first**, so six hardcoded listings (`ikoyi-garden-residence`, `maitama-city-apartment`, `lekki-contemporary-home`, `gra-family-duplex`, `wuse-studio-loft`, `banana-island-terrace`) shadow real ones by id.
- The landlord dashboard chart is hardcoded; there is no analytics endpoint.
- `seedMockConversations` and `MOCK_PROPERTY_DETAILS` are otherwise unreferenced dead code.
- Tenant "add payment method" in settings is still a toast. Cards are added during checkout, so this may be correct as a no-op, but it currently claims otherwise.

### Not fixable in code

Render free spins down after 15 minutes idle, roughly 50 seconds to wake. A self ping would keep Neon's compute awake too and burn free tier hours. This one is the upgrade.

### Untested end to end

None of the verification, escrow or payout work has run against live Dojah and Paystack sandbox credentials. The Paystack key is blank. The contracts are verified by the compiler and the suite, but the first real NIN submission and the first real payout are the actual proof.

---

## Admin, host operations, settings and two step sign-in

### Admin queues

`/admin/bookings`, `/admin/escrow` and `/admin/ratings` were "coming soon" pages, and the banner across the admin area said so. Support had no way to look up a booking somebody phoned about, because every booking and escrow query was scoped to whoever was asking.

Added `GET /api/admin/bookings`, `GET /api/admin/escrow`, `GET /api/admin/reviews` and `PATCH /api/admin/reviews/{id}/status`, each filtered by status and a free text query, and the three screens that use them. Moderation hides rather than deletes: a hidden review leaves the public listing and the host rating but the text survives, so a decision can be undone and neither party can claim it said something else. Any status other than published needs a written reason, kept on `AdminReviewResponse` and never shown to either party.

The preview banner is gone rather than reworded.

### A whole class of 500s

Writing the admin tests turned up `/api/reviews/property/{id}` answering 500 in production. `open-in-view` is off, so a row from a finder is detached the moment the repository call returns, and every response mapper that reads through to the property or the parties throws.

An audit of the read surface found ten endpoints with the same defect: tenant and host booking lists, both escrow lists, all three dispute lists, the admin KYB queue, escrow detail, saved listings, and the three review reads. All now carry `@Transactional(readOnly = true)` on the method that maps.

`DetachedReadTests` seeds rows and reads them back in a separate request, which is what catches it. Creating a row and reading the response in the same request does not: the entity is still the object that was just built.

### Host operations

Endpoints for galleries, blocked dates, viewings and repairs existed with no way to reach them. A host could publish a listing and then not change a photo.

- `/{role}/listings/{id}` manages a published listing: add and remove photos, set the cover, close and reopen dates. Booked dates are shown but cannot be closed.
- `/{role}/viewings` is the requests feed. Confirm, decline, mark done, and open the video room for a virtual viewing.
- `/{role}/maintenance` is the repairs feed, with a status and a note the tenant reads.
- Tenancy paperwork can now be attached from either host bookings screen.
- The landlord bookings page had a message button wired to nothing. It opens the chat now.
- The sidebar showed a made up name while the profile loaded.

### Settings

- Profile is a real screen: name, username, phone, city and a photo. A verified name is fixed, because it came off a government ID and both the tenancy and the payout are in it. The username is what stays editable.
- Notification and privacy switches persist per account. The whole set is written on every change, so a switch turned off stays off on the next device.
- Payments showed two invented cards and three invented charges. It now shows the one payout account and real escrow history.
- The "download your data" button slept for 900ms and claimed a simulated archive. Removed.

### Two step sign-in

A code emailed to the address on the account, not an authenticator app: every account here already has a verified address, and asking a first time renter to install an app to see a flat costs more accounts than it protects.

Codes are stored hashed, expire in ten minutes, work once, and allow five guesses. The attempt counter is written in its own transaction, because a wrong code answers with an error and an error would otherwise roll the count back and make the limit unreachable.

Turning it off asks for the password, so a borrowed session cannot.

### Also

Anonymous requests answered 403. They answer 401 now, so a client can tell "log in again" from "this is not yours".

### CI

Both repositories were red.

- The frontend typecheck failed on every image import. `next-env.d.ts` is generated rather than committed and it is what declares those modules, so a fresh checkout has no declarations until something generates them. A `next typegen` step now runs before `tsc`.
- `gitleaks-action` needs a paid licence on an organisation repository and fails without one. Both repositories now run the gitleaks CLI, which needs no licence.
- The backend Docker job asked for a GitHub Actions cache export without the driver that supports one. `docker/setup-buildx-action` added.

The backend secret scan runs from `97d6c1d`, the commit that removed the last committed credential. **A Resend API key is in the backend history at `67be1d7`.** It is not in the working tree and Resend is no longer used, but a published key is published: it needs revoking at Resend regardless of what the scanner is pointed at.

### Still not built

- Calls: six endpoints, no UI. Unchanged.
- The 3D tour: `FloorController`, `RoomController` and `PanoramaController` are complete and have no viewer or builder. The Jitsi room is a live video call, which is a different thing.
- Neither Dojah nor Paystack has run against live sandbox credentials.
