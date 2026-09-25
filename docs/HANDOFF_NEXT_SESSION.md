# Rello: handoff for the next Claude session

Written 16 September 2026. Read this whole file before touching code. It is the only context you have.

## 0. Progress since this file was written (read first)

- **Section 6.1 is done.** New suites `MarketplaceTests`, `PlatformScaleTests`, `ProviderIsolationTests`, `ObservabilityTests`. Full backend run: **209 tests, 0 failures**.
- The tests found and fixed two real problems:
  - **Browse N+1:** 24 cards cost 50 statements. `PropertyRepository.searchIds` plus `findCards` now make it 3 statements at any page size, and `Property.amenities` has `@BatchSize`.
  - **Refund on cancellation held a pool connection during the Paystack call:** after-commit listeners run before Spring releases the connection. Fixed globally with `spring.jpa.properties.hibernate.connection.handling_mode=DELAYED_ACQUISITION_AND_RELEASE_AFTER_TRANSACTION` (main and test properties).
- Compliance exports use a writable transaction, because they write an audit row, which Postgres rejects inside a read-only one.
- **Section 6.2 docs are done:** `backend/docs/PERFORMANCE.md` is new, and `backend/docs/ENGINEERING_HANDOVER.md` was rewritten from the code. Also done: it is published as an Artifact at https://claude.ai/artifact/6wRKYs25gU3ArGNUZQ5VhQ (source `scratchpad/rello-backend-handover.html` from the previous session; republish by passing that URL), `SYSTEM_AUDIT.md` statuses are updated, and the em dashes in `POLICIES.md` are gone.
- **Preference keys fixed:** the settings screen stores `notify.sms`, `notify.whatsapp` and `notify.property`. The backend constants in `SmsService` and `SavedSearchService` now use those names; before, the switches did nothing.
- **Section 6.3 frontend, done so far** (tsc and eslint clean, not yet run in a browser):
  - Proxies: `_authenticatedProxy` forwards bodies as bytes (multipart works), passes downloads through with `Content-Disposition`, and accepts `allowAnonymous`. `_requestId.listHeaders` forwards `X-Next-Cursor`. `_catchAllProxy.ts` backs the new optional catch-all routes for `notifications`, `saved-searches`, `mandates`, `compliance` (this route was missing, so the due diligence dialog could never load) and `reports`. The bookings proxy gained PUT; the reviews proxy gained POST and public GET for listing reviews.
  - 1: `components/notifications/NotificationsBell.tsx` in the dashboard shell for every role; SMS and WhatsApp switches in `NotificationsSection`.
  - 4: reviews bound to a booking, the pending state, host replies (`HostRatingsBoard`), and real reviews on the listing page.
  - 5 and 6: `components/tenant/InstalmentPlanSection.tsx` inside `BookingPaymentPanel`; the payment return page handles `rello_inst_` references; `app/receipts/[kind]/[id]` for printable receipts; `components/escrow/StatementView.tsx` at `/tenant|landlord|agent/statement` with CSV; receipt links in both escrow ledgers. The backend `BookingResponse` now includes `instalmentsAllowed` and `maxInstalments`.
  - 7 and 8: `components/tenancy/TenancyRecordsDialog.tsx` (agreement plus condition reports) on the tenant booking page and in both host drawers.
- **Frontend, also done:**
  - Dispute evidence upload (`DisputeBoard`).
  - `components/reports/ReportDialog.tsx` on the listing page and the host page, plus `/admin/reports`.
  - `/admin/compliance` for the CSV exports and on-demand screening.
  - Saved searches: "Save search and get alerts" on browse, which opens `?search={id}`, and `/tenant/saved-searches`.
  - `components/mandates/MandatesView.tsx` at `/landlord/mandates` and `/agent/mandates`.
  - Date of birth in the compliance dialog, labels for the new risk flags, and instalment settings in `CreateListingForm` (yearly lets).
  - Navigation: admin sidebar (Reports, Compliance) and the profile menus (Statement and Mandates for hosts; Saved searches and Statement for tenants).
- **Not done:** nothing has been clicked through in a browser. The local backend would need the shared Neon database, which needs the user's permission. Run every new screen against a local database before release.
- Everything is still uncommitted.

## 1. The project

- **Product:** Rello, a rentals-first marketplace for Nigeria (Airbnb and Zillow style): long-term rental requests, shortlets, escrowed payments through Paystack, deposits, disputes, verification (Dojah), AML risk tracking.
- **Frontend:** `C:\Users\BEST\Documents\keyz-frontend` (Next.js 16 App Router, branch `founder-1`).
- **Backend:** `C:\Users\BEST\Documents\backend` (Spring Boot 3.5, Java 17, Hibernate 6.6, Postgres on Neon, Flyway, branch `founder1`).
- Virtual tours and floor plans belong to another team. Do not work on them.

## 2. Rules you must follow

- **Never commit or push.** Leave every change uncommitted; the user commits.
- Work only in `keyz-frontend` and `backend`. Other folders (Pharmmar, JBR Backend) are out of scope.
- Never enter passwords, API keys or credentials anywhere.
- Do not run the local backend against the shared Neon database without asking: it would apply migrations V6 to V11 early.
- `keyz-frontend/AGENTS.md` style rules apply to both repos:
  - No em dashes anywhere (docs, comments, commits). Rewrite the sentence instead.
  - Section separators are exactly `// === Name`.
  - Comments only for a non-obvious why.
  - TypeScript: no `any`, explicit return types on hooks and non-trivial functions, let inference work for `useState(false)` and similar.
- Match the surrounding code. Backend comments are plain English and explain why; error messages are short and human.

## 3. How to build and test

### Backend

- Use absolute paths; the shell cwd resets. Run from `C:/Users/BEST/Documents/backend`:
  - Compile: `./mvnw -q -o compile`
  - One class: `./mvnw -o test -Dtest=ClassName`
  - Full suite: `./mvnw -o test` (takes several minutes; run in the background)
- Tests use H2 in PostgreSQL mode with `ddl-auto=create-drop` and **Flyway disabled** (`src/test/resources/application.properties` shadows the main file). Migrations are not exercised by tests, so hand-check any SQL.
- Test pattern: `@SpringBootTest @AutoConfigureMockMvc`, `@MockitoBean` for `StorageService`, `PaystackService`, `DojahService`, `JitsiService`, `OcrVerificationService`. Tokens come from `jwtService.generateToken(email, Map.of("role", role))`. Copy the helpers from `src/test/java/com/example/backend/InstalmentAndReceiptTests.java` or `TenancyRecordsTests.java`.
- A test that needs its own properties gets its own Spring context. Give it its own H2 database too (`spring.datasource.url=jdbc:h2:mem:<unique>;MODE=PostgreSQL;DB_CLOSE_DELAY=-1`) so it cannot wipe other suites' data.
- Scheduled jobs are off in tests (`rello.scheduling.enabled=false`); call job methods directly.
- Last full green run: **192 tests** before batch 3; batch 3 added 4 (`TenancyRecordsTests`) which passed on their own. The uncommitted work in section 5 has **not been tested yet**.

### Frontend

From `C:/Users/BEST/Documents/keyz-frontend`:
- `./node_modules/.bin/tsc --noEmit`
- `./node_modules/.bin/eslint src`
- `npm run build`
- React purity lint: never call `Date.now()` during render. Take "now" in `useState(() => Date.now())` or set it inside an effect or async callback.
- Dialog pattern: `OverlayPortal` plus framer-motion plus `useDialogFocus` (see `src/components/bookings/CancelBookingDialog.tsx`).
- API calls go through Next route proxies in `src/app/api/**` built on `_authenticatedProxy.ts`. `_requestId.ts` has `listHeaders` (forwards `X-Total-Count`) and `cacheHeaders` (ETag). **Add `X-Next-Cursor` to `listHeaders`** when you build cursor paging.
- Check whether the disputes proxy passes multipart bodies through intact before building evidence upload.

## 4. What exists and works (committed)

Commits `01726ff` (backend) and `f4632c7` (frontend) hold everything below. Migrations V1 to V11 are written; V6 onward are not yet deployed.

- **Bookings split** (V3): `RENTAL_REQUEST` vs `SHORT_STAY`, move-in preference, open-ended tenancies, `lifecycleStage`, competing requests cancelled on accept.
- **Public ids** (V5): `p_` and `u_` ids, `/api/properties/public/{id}`, `/api/hosts/public/{id}`, slugs.
- **Payments** (V6, V7): payment deadline, refunds, caution-fee deposits held for the tenant, deposit claims and settlement, due diligence details, risk flags, reconciliation jobs.
- **Batch 1** (V8): in-app notifications (`/api/notifications`), SMS and WhatsApp through Termii, reports (`POST /api/reports`, admin queue), dispute evidence upload, double-blind reviews bound to a stay with host replies.
- **Batch 2** (V9): rent instalments (2, 4 or 12 parts on yearly lets), receipts and statements. Endpoints: `POST /api/escrow/bookings/{id}/plan`, `GET /api/escrow/bookings/{id}/instalments`, `POST /api/escrow/instalments/{id}/pay`, `POST /api/escrow/instalments/payments/{ref}/verify`, `GET /api/escrow/{escrowId}/receipt`, `GET /api/escrow/instalments/{id}/receipt`, `GET /api/escrow/statement?from&to`, `POST /api/admin/instalments/{id}/refund`.
- **Batch 3** (V10): move-in and move-out condition reports with photos and tenancy agreement signing. All under `/api/bookings/{bookingId}`:
  - `GET|POST /inspections`, `PUT /inspections/{id}/items`, `POST /inspections/{id}/photos` (multipart `file`, `room`, `caption`), `DELETE /inspections/{id}/photos/{photoId}`, `POST /inspections/{id}/submit`, `POST /inspections/{id}/respond {agree, note}`.
  - `GET /agreement`, `GET /agreement/versions`, `PUT /agreement {clauses}`, `POST /agreement/send {fullName, agree}`, `POST /agreement/sign {fullName, agree, version}`, `POST /agreement/decline {reason}`.
  - Agreement template text lives in `src/main/resources/agreements/tenancy-agreement.txt` for legal to edit.
- **Batch 4** (V11), code written: saved searches (`/api/saved-searches`), management mandates (`/api/mandates`, accept, decline, end, attach and detach listings, overview), agent fee payouts, Dojah sanctions and PEP screening, admin compliance CSV exports (`/api/admin/compliance/exports/large-payments.csv`, `risk-flags.csv`, `screenings.csv`, and `POST /api/admin/compliance/screenings/{userId}`). Jobs in `config/MarketplaceJobs.java`.

## 5. Uncommitted work in the backend (compiles, NOT tested)

`git status` in the backend shows these. Review them, then write the tests in section 6.

**Batch 4 wiring that the commit was missing:**
- `User` screening fields and `dateOfBirth` are `@JsonIgnore`. `/api/users/me` returns the entity, so without this a person could see they matched a watchlist (tipping off, an offence under the MLPPA 2022).
- `Property.mandate` and `liveSince` are `@JsonIgnore`. `@PrePersist` and a new `@PreUpdate` set `liveSince` when a listing first becomes verified; before this, saved-search alerts could never match anything.
- `EscrowServiceImpl.beginPayout`: recipient is `mandates.payoutRecipientFor(property)` (the landlord under a mandate). Host amount is rent minus 5% commission minus the agent fee. Sets `payoutRecipient` and calls `mandates.recordAgentFee(...)`. `finishPayout` success calls `agentFees.sourcePaid`; `finishRefund` success calls `agentFees.sourceRefunded`. Deposit-claim settlement pays the landlord too.
- `InstalmentService.beginRelease` and `finishRelease` and `markRefunded`: the same split for instalments.
- `ReceiptService` host statement: rows follow `payoutRecipient` (the landlord sees managed rent, the agent does not), plus `AGENT_FEE` rows for paid agent fees.
- `BookingServiceImpl.assertRentable`: a listing whose mandate is not ACTIVE returns 409 `PROPERTY_UNAVAILABLE`.
- `PropertyRepository.search` and `searchLiveSince` exclude listings with a non-active mandate; `searchLiveSince` is FOR_RENT only.
- `UserRepository.findDueForScreening`: only people with due diligence details or a verified payout account, rescreened yearly, errors retried after 6 hours, rescreened when details change. The committed version screened every user, which costs money per call.
- `ComplianceController`: optional `dateOfBirth` (16 to 120 years old), returned on the profile.
- Saved search email links to `/tenant/browse?search={id}`.
- New properties: `rello.saved-searches.alert-hours` (24), `rello.screening.match-threshold` (0.85).
- `DojahScreeningGateway.interpret` is now public so it can be unit tested.

**BACKEND_CHANGES.md spec gaps (the spec is at `C:\Users\BEST\Downloads\BACKEND_CHANGES.md`):**
- `util/Cursors.java`: keyset cursors. `?cursor=` (empty means first page) on `GET /api/bookings/mine`, `GET /api/bookings/host`, `GET /api/notifications`. Response header `X-Next-Cursor`, absent on the last page. No `X-Total-Count` in cursor mode. Page-number mode still works. `Booking` and `Notification` `createdAt` are truncated to microseconds so a cursor matches the stored value.
- `GET /api/properties/{rent|sale|all}?view=card` omits description and tour links.
- `GET /api/properties/{id}/availability`: long-term listings skip booking ranges (legacy dated bookings no longer show as taken), return only blocks, a mode message, and header `X-Rental-Mode`.
- Legacy `POST /api/bookings` and `GET /api/bookings/quote`: `Deprecation` and `Link` headers, warn log, counter `rello.deprecated.requests{endpoint}`.
- `/actuator/metrics` exposed for `ADMIN` only (SecurityConfig), with p50, p95 and p99 on `http.server.requests`, `http.client.requests`, `spring.data.repository.invocations`, `hikaricp.connections.acquire`. Hikari pool gauges and `application.ready.time` come for free. No Prometheus registry (not in the offline Maven cache).

## 6. What is left, in order

### 6.1 Backend tests (do first)

Put new test classes in `src/test/java/com/example/backend/`.

1. **MarketplaceTests**
   - Saved search: `POST /api/saved-searches {}` gives 400. Create one with a unique query token and max price. Backdate its `lastCheckedAt` by one second, create a verified matching FOR_RENT listing, call `savedSearchService.alert(id)`: true, one email with purpose `saved search alert`. Call again: false. Then set that listing's `liveSince` an hour back, backdate the search again, create an **unverified** matching listing, verify it and save (tests `@PreUpdate`), alert again: true. With `preferences.put("property", false)` alert sends nothing.
   - Mandate: agent invites with fee 25 gives 400; fee 10 gives INVITED. A different landlord accepting gives 403. The landlord accepts. The agent attaches two own listings. Tenant rental request on listing 1, agent accepts, tenant pays (`POST /api/escrow/bookings/{id}/pay` then `escrowService.confirmPayment(ref, id)`). Payout accounts for landlord and agent. Backdate booking `tenancyStartDate` 30 days and escrow `heldAt` 5 days, run `escrowService.releaseDueHolds()`. Expect `transferToHost` to the landlord account for rent minus 5% minus 10%, `payoutRecipient` = landlord, an agent fee row PENDING for 10%. `agentFeeService.pay(id)` sends to the agent account and marks PAID. Landlord statement has `RENT_PAYOUT`; agent statement has `AGENT_FEE` and no `RENT_PAYOUT`. Detach listing 1 gives 409. End the mandate with a reason; a new rental request on listing 2 gives 409 and it is gone from `/api/properties/rent?query=<its title>`.
   - Screening: `@MockitoBean DojahScreeningGateway` with `configured()` true and `screen()` returning POSSIBLE_MATCH. A user with `complianceUpdatedAt` is in `screeningService.findDue(50)`; screening raises a `SANCTIONS_PEP_MATCH` risk flag; `GET /api/users/me` JSON has no `screeningStatus`. Unit check `DojahScreeningGateway.interpret`: explicit no match is CLEAR, a non-empty results list is POSSIBLE_MATCH, an empty map is ERROR.
   - Exports: admin gets `large-payments.csv` containing a payment of 5,000,000 or more; a payer first name starting with `=` comes out as `"'=`; a tenant gets 403; an `AdminActionAudit` row is written.
2. **PlatformScaleTests** (own H2 database, `hibernate.generate_statistics=true`): seed about 2,000 verified listings with amenities in a distinct city, and about 600 bookings for one host. Browse `?city=...&size=24&view=card`: statement count bounded (under about 8), under 2 seconds, payload size bounded. Walk `/api/bookings/host?cursor=&size=100` to the end while inserting a new booking between pages: no duplicates, every original row seen, constant statements per page. The same cursor walk for notifications. A bad cursor gives 400.
3. **ProviderIsolationTests**: inside Mockito answers for `initialisePayment`, `transferToHost` and `refundPayment`, read `((HikariDataSource) dataSource).getHikariPoolMXBean().getActiveConnections()` and assert 0. Proves no provider call runs inside a transaction.
4. **ObservabilityTests** (with `management.endpoints.web.exposure.include=health,metrics` in properties, since test config shadows main): admin gets 200 on `/actuator/metrics/http.server.requests` and `/actuator/metrics/hikaricp.connections.active`; tenant gets 403. Legacy `POST /api/bookings` returns a `Deprecation` header and increments the counter. Availability on an ANNUAL listing with an old dated booking returns no booking range and `X-Rental-Mode: ANNUAL`.
5. Run the full suite. Fix anything red. Report the real count.

### 6.2 Docs

- **`backend/docs/PERFORMANCE.md`**: latency targets per area (auth, browse, listing detail, dashboards, bookings, verification status, mutations; suggest p95 under 300ms for reads, 800ms for writes, provider calls excluded), which metric to read for each, how to check startup (`application.ready.time`, Hikari fail-fast), slow query and slow request logging, the decision to keep entity reads with fetch graphs and batch fetching (proven bounded by tests) instead of JPQL projections.
- **Replace `backend/docs/ENGINEERING_HANDOVER.md`** (or write `docs/BACKEND_CHANGES.md` and delete the old one) from the code, not from memory. The committed version is wrong in many places:
  - V1 is `V1__baseline.sql`; V2 is `V2__sessions_exports_audits.sql`.
  - No PDF receipts or `/api/host/statements` exist; the real endpoints are listed in section 4.
  - Inspection and agreement paths are wrong (see section 4).
  - Instalments are 2, 4 or 12, paid by the tenant, never auto-charged.
  - Report body uses `listingId` or `userId` and reasons `FAKE_LISTING`, `WRONG_PRICE`, `OFF_PLATFORM_PAYMENT`, `EXTRA_FEES`, `DISCRIMINATION`, `HARASSMENT`, `SCAM`, `UNSAFE`, `OTHER`.
  - Job schedules: read each `@Scheduled` (for example `MessageDispatchJob` PT20S, `InstalmentJob` PT1H, `ReviewPublicationJob` PT6H, `MarketplaceJobs` 30m, 10m and 1h). It also omits `EscrowReconciliationJob`, `EmailDispatchJob` and `EscrowAutoReleaseJob`.
  - Config keys: verify every one against `application.properties` (for example `dojah.api-key`, not `dojah.secret-key`; the Paystack webhook is `POST /api/escrow/webhook/paystack`).
  - Tests do not run Flyway.
  - It contains em dashes.
  - It must include: architecture, every flow, endpoints, migrations, jobs, env vars, tests, policies (`keyz-frontend/docs/POLICIES.md`), AML (`backend/docs/COMPLIANCE_AML.md`), and the deploy checklist below.
- Update `keyz-frontend/docs/SYSTEM_AUDIT.md` statuses as gaps close. `POLICIES.md` line 29 has an em dash to remove.
- The user wants the handover doc published as an Artifact so they can share it: load the `artifact-design` skill first, then publish and give them the link.

### 6.3 Frontend for every backend gap (none of it exists yet)

For each item: typed client in `src/lib`, Next proxy under `src/app/api`, UI, then tsc, eslint and build.

1. **Notification bell** in the dashboard shell next to `MessagesDropdown`, for every role: unread count polling, cursor list, mark one and mark all read. SMS and WhatsApp toggles (preference keys `sms` and `whatsapp`) in the notifications settings section.
2. **Dispute evidence upload** in the dispute board (multipart `file`, 10 files, 10MB, JPEG PNG WebP PDF).
3. **Report dialogs** on the property page and host page; **admin reports page** (`GET /api/admin/reports?status`, `POST /api/admin/reports/{id}/review {status, note}`) plus a sidebar item.
4. **Reviews:** write for a specific `bookingId`, show the pending (hidden until both write) state, host reply. The listing page never loads real reviews: `src/lib/propertyDetails.ts` maps an empty placeholder. Fix it.
5. **Instalments:** listing form fields `instalmentsAllowed` and `maxInstalments` (yearly only); plan picker before first payment; schedule and pay each instalment; payment return page for `rello_inst_` references; host view of the schedule.
6. **Receipts and statements:** printable receipt page; statement page with date range and CSV download, for tenants and hosts.
7. **Condition reports:** create, rooms and items editor, photo upload, submit, and acknowledge or contest, on tenant and host booking views.
8. **Tenancy agreement:** host draft with clauses, sign-to-send; tenant read, sign with typed name and version, decline with reason; versions list; print view.
9. **Saved searches:** "Save this search" on browse; management list with alerts toggle and delete; `/tenant/browse?search={id}` must load that search's filters. Use `?view=card` for browse lists if no card needs the description.
10. **Mandates:** agent page `/agent/mandates` (invite with fee, attach and detach listings, end); landlord page `/landlord/mandates` (accept, decline, end, read-only overview of listings, bookings and agent fees); sidebar items.
11. **Compliance:** date of birth field in the compliance details dialog; admin page with the three CSV exports (date range) and "screen now" on a user. Never show screening results to the person screened.
12. **Cursor paging:** forward `X-Next-Cursor` through the proxies and use it for notifications and long booking lists.
13. **Risk page:** add a label for the `SANCTIONS_PEP_MATCH` flag type.

## 7. Before go-live (tell the user; not code)

- Rotate the Resend API key that is in backend git history at commit `67be1d7`.
- Confirm the Dojah AML request and response shape in the Dojah sandbox. The gateway reads the answer defensively and never treats a failed call as clear, but the payload (`properties.names` as a list, `date_of_birth`, `screening_options`) came from partial docs.
- Legal review of `agreements/tenancy-agreement.txt` and `docs/POLICIES.md`. Register with SCUML and NDPC.
- Apply migrations V6 to V11 to Neon in a maintenance window, after a backup.
- Paystack live webhook to `/api/escrow/webhook/paystack`; Termii sender id approval; set `TZ=Africa/Lagos`.

## 8. Known limits and unreviewed code (added last)

- Latency is measured at the request, repository and provider boundaries only. The service layer has no timers (it would need Spring AOP). Say so in `PERFORMANCE.md`, or add it.
- Cursor paging exists on `/api/bookings/mine`, `/api/bookings/host` and `/api/notifications` only. Chat messages and the activity feed still use page numbers or offsets.
- The startup timing check is a documented procedure (read `application.ready.time` against a dev database), not an automated test, because CI has no database.
- Browse still loads entities, not JPQL projections. `?view=card` trims the payload only. The scale test in 6.1 must prove the query count stays bounded.
- Parts of batch 4 in commit `01726ff` were written by another tool and never reviewed here, notably the notifier methods `mandateInvited`, `mandateAnswered`, `mandateEnded`, `savedSearchMatches` and `agentFeePaid`, and the helper `sendToEmail` in `BookingNotifier.java`. Read them before relying on them. For example, `mandateEnded` emails both sides, including the one who ended it.
- Frontend commit `f4632c7` was not reviewed in this session. Check what it changed before building on it.
