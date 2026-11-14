# Project Status Review TODO

## Goal

Address the findings from the 17 September 2026 review of [PROJECT_STATUS.md](../PROJECT_STATUS.md) against the frontend and backend code. Follow the priority order below before treating the documented features as production-ready.

- All tasks start unchecked. Existing code is not proof of successful end-to-end operation.
- Backend paths below are relative to `../keyz-backend`.
- Keep existing performance and request-flow TODOs unchanged; cross-reference their evidence where applicable.
- This checklist does not authorize deployment, migrations on shared databases, live payments, or provider calls.

## 1. Correct Payout Settlement and Duplicate-Refund Recovery

Affected backend files: `service/impl/PaystackServiceImpl.java`, `service/impl/EscrowServiceImpl.java`, `service/InstalmentService.java`, `service/AgentFeeService.java`, and related payout/refund models, repositories, jobs, and tests under `src/main/java/com/example/backend` and `src/test/java/com/example/backend`.

- [x] Distinguish transfer acceptance, pending settlement, confirmed settlement, definite failure, and uncertain provider outcomes.
- [x] Inspect the returned transfer status rather than treating a successful top-level response as a completed payout.
- [x] Keep pending or uncertain payouts in a reconcilable state until settlement is confirmed.
- [x] Mark escrow and instalment payouts completed, and agent fees payable, only after confirmed settlement.
- [x] Apply the same settlement rules to agent-fee transfers.
- [x] Persist duplicate-charge refund attempts with their charge reference, amount, provider reference, status, and retry/reconciliation information.
- [x] Recover failed or uncertain duplicate refunds through durable jobs rather than logs alone.
- [x] Preserve idempotency across repeated webhooks, concurrent requests, retries, and restarts.

Completion criteria:

- [x] Tests cover pending transfers, settlement, reversal/failure, timeout after submission, and restart recovery.
- [x] Tests prove an agent fee cannot become payable before its source payout settles.
- [x] Tests prove duplicate refunds remain discoverable and recoverable without refunding the same charge twice.
- [x] Provider calls remain outside database transactions that hold connections or locks.

### Implementation and Verification Record

- Implemented locally on 17 September 2026 in backend branch `founder1`, based on `994563a`. Changes are not committed or deployed.
- Transfer outcomes are `SETTLED`, `PENDING`, `FAILED`, and `UNKNOWN`. Only a confirmed successful transfer completes an escrow, instalment, or agent-fee payout. Pending and uncertain outcomes retain their stored reconciliation intent.
- Payout completion locks the row and checks its current state so repeated or late responses cannot overwrite a completed payout. Agent fees remain `AWAITING_SOURCE` until the corresponding rent payout settles.
- `DuplicateChargeRefund`, its repository, and `DuplicateRefundService` persist one recovery record per duplicate charge before contacting the provider. Records retain the verified refund amount, attempt count, provider reference, timestamps, failure reason, and next check time.
- The existing reconciliation job selects up to 50 due duplicate-refund records per run. Uncertain submissions are verified rather than blindly resent. Accepted refunds remain tracked until the provider reports `processed`.
- Confirmed failures become eligible for retry after 15 minutes. Five unsuccessful attempts leave a durable `FAILED` record requiring operator review. An older failed provider refund cannot hide a newer accepted refund when recovering a lost response.
- Duplicate webhooks serialize on the escrow row. Unique charge references and attempt guards prevent duplicate submissions and obsolete recovery results from changing a newer attempt.
- Split-deposit host transfers use the same confirmed-settlement rule. The approved split and settlement start time are persisted so a pending host transfer is not mistaken for a full tenant refund after restart.
- Regression coverage includes provider response parsing, pending escrow and instalment payouts, delayed agent fees, agent transfers, duplicate webhooks, concurrent submissions, persisted-intent recovery, uncertain refunds, retry limits, obsolete responses, provider connection isolation, and pending split-deposit transfers. Restart recovery is simulated from a committed intent, not by killing a running server.
- Final complete backend suite: **240 tests, 0 failures, 0 errors, 0 skipped**, completed on 17 September 2026. Command: `./mvnw -B -Dlogging.level.root=WARN -Dlogging.level.org.hibernate.SQL=OFF -Dlogging.level.org.springframework=ERROR test`. Results are in backend `target/surefire-reports`; the local run log is `/tmp/keyz-settlement-final-tests.log`.
- The automated V12 SQL smoke test runs against a separate H2 database in PostgreSQL compatibility mode and verifies unique charge references, escrow foreign-key ownership, and the new deposit settlement column. Flyway remains disabled in the Spring test configuration; that suite does not execute shared database migrations.

### PostgreSQL Verification and Approved Activation

- Completed on 17 September 2026 with separate approval to apply V12 to the configured Neon database and restart the local backend.
- Downloaded PostgreSQL 16.15 into `/tmp/keyz-postgres-v12.7uq1p8`. No system packages were installed. Created an isolated `v12_verification` database bound to localhost port `55432`.
- Flyway successfully applied V1 through V12 to the isolated PostgreSQL database and validated their checksums. PostgreSQL rejected duplicate charge references with SQLSTATE `23505` and orphan escrow references with SQLSTATE `23503`.
- Verified all 13 duplicate-refund columns, the escrow deposit settlement timestamp, primary key, unique constraint, foreign key, and due-recovery index. Constraint test records and their scratch schema were rolled back.
- The backend started successfully against the isolated PostgreSQL database with `spring.jpa.hibernate.ddl-auto=validate`. Its health endpoint returned HTTP `200` with `status: UP`.
- Neon preflight identified PostgreSQL 17, the existing V1 baseline, successful V2 through V11, and only V12 pending. Existing migration checksums validated. V12 objects were absent before application.
- Stopped the old local backend, applied exactly V12 through Flyway, validated the resulting history, and verified its columns, constraints, and index on Neon. No historical payment or refund records were replayed.
- Restarted the local backend on port `8080` using the local profile, Hibernate schema validation, and `rello.scheduling.enabled=false`. Startup succeeded and `/actuator/health` returned HTTP `200` with `status: UP`. The frontend on port `3000` also returned HTTP `200`.
- Background jobs remain disabled for this run, including automatic payout, refund recovery, reminders, and other scheduled work. Enabling them is a separate operational action, not implied by successful migration application.
- Stopped the isolated PostgreSQL server after verification. Its files and local evidence remain under `/tmp/keyz-postgres-v12.7uq1p8`: `isolated.log`, `isolated-backend.log`, `neon-preflight.log`, `neon-apply.log`, `neon-postflight.log`, and `neon-backend.log`. These temporary artifacts are not committed and should not be treated as permanent release records.

Activation prerequisites and limits:

- [x] Review and apply `src/main/resources/db/migration/V12__duplicate_charge_refunds.sql` against an approved isolated PostgreSQL database, then verify Flyway history and schema validation.
- [x] Apply the migration to any shared database only with separate approval, then restart the backend to activate these changes.
- [ ] Review historical payouts previously marked completed and duplicate refunds attempted before durable recovery existed. The migration does not backfill or replay those payments.
- [ ] Establish an operator procedure for exhausted duplicate-refund records and unresolved split-deposit legs. No new admin recovery UI is included in this priority.
- Automated regression tests use H2 and mocked providers. The separately approved PostgreSQL checks establish migration and startup compatibility for the verified environments, not sandbox provider integration, bank receipt, or production readiness.
- No payments, refunds, or provider integration tests were initiated during migration verification. Other priorities remain unchecked. Changes are not committed or pushed.

## 2. Fix Reports Loading and Notification Failure Handling

Affected frontend files: `src/app/(admin)/admin/reports/page.tsx`, `src/components/notifications/NotificationsBell.tsx`, `src/lib/marketplace.ts`, and `src/lib/notifications.ts`.

- [x] Prevent clicking the already-selected Reports filter from leaving the page stuck loading.
- [x] Keep loading, errors, and retries tied to the actual report request lifecycle.
- [x] Check notification read-write results; roll back or revalidate optimistic state when a write fails.
- [x] Preserve the last known unread count when polling fails instead of reporting a false zero.
- [x] Preserve the current cursor and items when loading older notifications fails, with a visible retry option.
- [x] Guard notification pagination against overlapping requests, duplicates, obsolete panel sessions, and unmounts.
- [x] Keep the documented polling cadence clear; do not describe polling as instant delivery.

Completion criteria:

- [x] Repeated active-filter clicks and rapid filter changes never strand the Reports loader.
- [x] Failed read actions do not leave the UI claiming an unsaved read state.
- [x] Failed older-page requests can be retried without losing pagination progress.
- [x] Closing and reopening the panel cannot append responses from an obsolete request session.

### Implementation and Verification Record

- Implemented locally on 17 September 2026. No backend changes, deployment, commits, or pushes are included.
- Reports loading is derived from the current filter and reload request key. Clicking the active filter is a no-op; filter changes and retries receive a new key. Superseded requests are aborted and their results ignored. Request failures offer a visible `Try again` button.
- Notification read state now changes only after the server confirms the write. Failed single-read and mark-all operations retain their unread state and display an error toast. Mutations are serialized, and badge counts are revalidated afterward.
- Failed or malformed unread-count requests return an unknown result, not zero. Polling preserves the last known count and ignores responses superseded by a read mutation or newer count request.
- Failed older-page requests preserve both existing items and their cursor. `Retry loading older` reuses that cursor. Loaded notifications are deduplicated by ID; overlapping older-page requests are blocked.
- Closing the panel aborts pagination and invalidates its session. Obsolete first-page, pagination, and read-mutation responses cannot change a reopened panel. Unmount also cancels panel requests and prevents late state updates.
- Unread polling remains every **30 seconds** while the document is visible. Opening the panel fetches its first page; this is polling, not instant notification delivery.
- **21 controlled regression checks passed** using the real React components in a temporary JSDOM harness with mocked requests. Coverage includes active and rapid Reports filter changes, error retries, failed polling, failed read writes, preserved cursors, duplicate pages, overlapping requests, close/reopen, late read completion, and unmount.
- Local test command: `node /tmp/keyz-priority2.i90wWu/regression.cjs`. The harness and its DOM dependency are temporary verification artifacts, not application dependencies or committed test infrastructure. These checks do not replace role-based browser testing with the backend.
- `pnpm exec tsc --noEmit` passed after removing an invalid cached Next.js dev validator and regenerating route types with `pnpm exec next typegen`. ESLint passed for all four affected source files with no errors or warnings. `git diff --check` also passed.

## 3. Complete Pagination and Reliable Active-Tenancy Lookup

Affected frontend files: `src/lib/marketplace.ts`, `src/lib/bookings.ts`, `src/app/(admin)/admin/reports/page.tsx`, `src/app/(tenant)/tenant/bookings/page.tsx`, and other collection screens identified in [the performance TODO](../performance/TODO.md).

Affected backend areas: report/bookings controllers and active-tenancy or dashboard aggregate contracts where needed.

- [x] Expose Reports paging parameters and `X-Total-Count` through the client and add pagination controls.
- [x] Audit remaining capped collections and provide pagination or incremental loading rather than silently truncating them.
- [x] Obtain the current tenancy through an explicit backend lookup or suitable server-side filter, independently of a capped booking-history page.
- [x] Paginate tenancy history separately from current-home selection.
- [x] Use backend aggregates for complete dashboard counts and totals rather than calculations over partially loaded collections.
- [x] Preserve sorting, filters, deduplication, loading, errors, and stale-response guards across pages.

Completion criteria:

- [x] Reports beyond the first 50 are reachable.
- [x] An active tenancy remains visible when it is older than the first 100 history records.
- [x] Counts and financial totals do not change merely because another history page was loaded.
- [x] Concurrent inserts and filter changes do not cause duplicate or obsolete rows.

### Implementation and Verification Record

- Implemented locally on 19 September 2026 across the frontend working branch and backend branch `founder1`. Changes are not committed, pushed, or deployed.
- Reports request 20 rows at a time, retain the backend `X-Total-Count`, and provide Previous and Next controls. Filter changes reset to the first page, abort superseded requests, and cannot append results from an obsolete filter.
- `GET /api/bookings/mine/current` selects the tenant's active tenancy independently of booking history. It prefers an active confirmed tenancy, then an upcoming confirmed stay, then a pending request. The query is scoped to the authenticated tenant.
- Tenant booking history uses the existing booking cursor in 20-row increments. Current-home errors and history errors remain independent. Loaded history is deduplicated by booking ID, and obsolete or overlapping page requests cannot update the screen.
- Screens that need complete booking selectors walk all cursor pages rather than using the first 100 rows. Draft and escrow selectors walk all backend pages and reject partial results after an error or account change.
- Admin Risk Flags and Deposit Claims now expose their page parameters and total counts in the client, load another 50 rows on request, deduplicate by ID, and guard filter changes and overlapping requests. Existing admin search, host tenancy, public host listings, notifications, maintenance, and catalogue screens retain their existing pagination or incremental loading.
- Landlord and agent dashboard headline counts use backend dashboard summaries or portfolio aggregates. They no longer calculate account totals from the currently loaded booking or escrow page.
- Reports, property drafts, risk flags, and deposit claims use deterministic descending timestamp and ID ordering. Booking history uses the backend cursor ordering, which is already covered by the scale test that inserts a booking during a 600-row cursor walk.
- Backend tests cover a report past the first 50 rows, deterministic report ties, and an active tenancy older than 110 history rows. The final complete backend suite passed with **244 tests, 0 failures, 0 errors, and 0 skipped** on 19 September 2026. Log: `/tmp/keyz-priority3-backend-full-final2.log`.
- Frontend `pnpm exec tsc --noEmit`, focused ESLint for the affected files, and `git diff --check` passed on 19 September 2026. Browser and production-build coverage remain part of priority 6 rather than this implementation record.

## 4. Extend Shared Fetching and Adopt Compact Responses

Affected frontend files: `src/lib/apiRequest.ts`, `src/lib/marketplace.ts`, `src/lib/notifications.ts`, `src/lib/instalments.ts`, `src/lib/tenancyRecords.ts`, `src/lib/hostListings.ts`, `src/lib/bookings.ts`, and their consumers.

- [ ] Route newly pulled client API calls through the existing shared request helper where appropriate.
- [ ] Preserve independent cancellation, explicit reloads, mutation behavior, and account-scoped safeguards.
- [ ] Request `view=card` for browse grids after validating compatibility with card rendering.
- [ ] Adopt booking cursors where incremental navigation benefits from stable ordering; retain page-based navigation where appropriate.
- [ ] Add server-side rental-mode filtering so catalogue results, totals, and pagination match the selected stay type.
- [ ] Preserve the stay-type filter in saved searches and alert-link restoration.
- [ ] Ensure plain-English and explicit filter searches retain their intended semantics.

Completion criteria:

- [ ] Controlled tests cover duplicate reads, account changes, logout, late responses, and mutation refreshes for the new clients.
- [ ] Browse uses compact payloads without losing required card metadata.
- [ ] Rental and shortlet filters return accurate totals across the complete catalogue.
- [ ] Saved-search alerts and restored results match the saved filters.
- [ ] Record before/after payload sizes and request waterfalls in the performance report.

## 5. Preserve Sensitive Response Headers

Affected frontend files: `src/app/api/_authenticatedProxy.ts`, `src/app/api/_requestId.ts`, and proxy tests. Backend reference: `src/main/java/com/example/backend/controller/ComplianceExportController.java`.

- [ ] Preserve backend `Cache-Control: no-store` on sensitive CSV downloads.
- [ ] Review sensitive JSON/download paths for explicit cache policy preservation.
- [ ] Preserve required content type, filename, and request identifiers without forwarding unrelated headers indiscriminately.

Completion criteria:

- [ ] A compliance export through the frontend proxy retains `Cache-Control: no-store`, its filename, content type, and request ID.
- [ ] Byte-for-byte download and multipart-upload behavior remains intact.
- [ ] Unauthorized users cannot retrieve exports through the proxy.

## 6. Verify Tests and New Workflows Against an Isolated Database

Reference suites: `MarketplaceTests`, `PlatformScaleTests`, `ProviderIsolationTests`, and `ObservabilityTests` in the backend.

- [ ] Prepare an isolated database and safe provider configuration before browser testing.
- [ ] Run the complete backend suite and record actual totals, failures, skipped tests, commit, configuration, and date.
- [ ] Run frontend TypeScript, lint, and a production build against the exact merged source being reviewed.
- [ ] Browser-test notifications, reports, reviews/replies, instalments, payment returns, receipts/statements, condition reports, agreements, saved searches, mandates, and admin compliance.
- [ ] Cover tenant, landlord, agent, admin, and anonymous access where relevant.
- [ ] Test loading, empty/error states, retries, keyboard access, mobile layouts, and refresh/relogin persistence.
- [ ] Separate mocked-provider test results from sandbox integration evidence and live-provider verification.
- [ ] Record unresolved provider, migration, security, and legal release prerequisites without claiming they are satisfied by code tests.

Completion criteria:

- [ ] Reproducible reports support the test counts and build claims.
- [ ] Browser evidence identifies tested routes, roles, scenarios, and remaining failures.
- [ ] No testing applies migrations or initiates payments on shared/live systems without separate approval.

## 7. Update the Project Status Document With Verified Evidence

Affected file: `docs/PROJECT_STATUS.md`.

- [ ] Replace outdated uncommitted-work statements with actual frontend/backend commit references.
- [ ] Distinguish committed collaborator work from remaining local frontend changes.
- [ ] Identify repository paths and branches as environment-specific rather than universally current.
- [ ] Verify the target database's migration history before stating whether V6 to V11 are applied.
- [ ] Distinguish implementation, integration, automated tests, browser verification, deployment, and operational readiness.
- [ ] Replace blanket completion claims with verified coverage and explicit remaining limitations.
- [ ] Link the resulting test, performance, migration, and browser evidence.
- [ ] Retain unresolved credential rotation, provider setup, and legal review requirements.

Completion criteria:

- [ ] Every status claim identifies its environment, source revision, and supporting evidence where applicable.
- [ ] The document does not imply production readiness while priorities 1 to 6 or release prerequisites remain unresolved.
