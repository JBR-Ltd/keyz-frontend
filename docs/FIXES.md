# Engineering Fix Record

This document records product and engineering fixes made across the Rello frontend and backend.

Each new fix should document:

- What existed before the change.
- Why the previous behavior was a problem.
- What was changed.
- What the completed fix consists of.
- Any API, database, configuration, or deployment impact.
- How the change was validated.
- Any remaining work or operational requirements.

Do not record credentials, personal information, private storage keys, raw identity data, or raw OCR content here.

## 2026-09-30: Utility-Bill Property Verification Hardening

### Scope

This fix covers utility-bill property verification for listings managed by landlords and agents. It also secures the supporting evidence workflow used by administrators.

The implementation affects:

- Backend verification orchestration and persistence.
- OCR name and address matching.
- Private evidence storage.
- Administrative review and evidence access.
- Landlord and agent verification screens.
- Authenticated frontend proxy behavior for binary evidence.

### What existed before

The utility-bill flow previously had the following behavior:

- Verification logic was performed directly in the controller instead of a dedicated transactional service.
- Listing access was checked against the seller, but the legal owner used for document comparison was not consistently distinguished from an agent managing the listing.
- Agent-managed listings could compare the utility bill against the agent instead of the landlord named in the mandate.
- OCR name matching relied on loose substring behavior.
- Address matching could lose short house-number tokens and did not consistently normalize common abbreviations.
- A readable OCR mismatch could reject the verification immediately instead of sending it for human review.
- Provider failures could prevent a reviewable submission from being recorded.
- Repeated submissions could invoke OCR and upload evidence again while an existing review was pending.
- Concurrent requests did not have a property-level locking workflow protecting the final decision.
- Utility-bill file validation did not fully enforce the allowed binary signatures before storage and OCR.
- Verification evidence could be represented by a public URL.
- The frontend did not restore the durable verification state after login or refresh.
- The frontend could not clearly distinguish automatic approval from submission for manual review.
- The admin interface treated the listing manager and legal owner as though they were always the same person.

### Why it was a problem

The previous behavior created several risks:

- An agent is a listing manager and is not necessarily the legal property owner.
- Loose name matching could approve incorrect names that happened to contain matching substrings.
- Immediate rejection of OCR mismatches prevented legitimate cases from receiving human review.
- Public evidence URLs could expose sensitive ownership documents.
- Duplicate submissions could create unnecessary OCR and storage costs.
- Concurrent submissions could create conflicting verification records or publication state.
- A refreshed frontend could show the upload form even while a review was already pending.
- Browser-provided content types could disagree with the actual file contents.

### How it was fixed

#### Verification orchestration

- Added a dedicated property verification service.
- Restricted utility-bill submissions to authenticated landlords and agents.
- Required the requester to be the listing creator or manager.
- Resolved the legal owner from the property owner relationship.
- Retained the landlord seller as a fallback for legacy landlord-created listings.
- Resolved the mandate landlord for agent-managed legacy listings.
- Prevented agents from being treated as the legal owner.
- Used short database transactions with pessimistic property locking when inspecting and recording verification state.
- Kept OCR and storage operations outside the database transaction.
- Rechecked the state under a lock before recording the result.
- Deleted duplicate uploads when another request created a pending or approved result first.
- Deleted newly uploaded private evidence when persistence failed.
- Ensured a verified listing always returns a verified result, including when another verification method approves it concurrently.

#### Idempotent states

- An already verified listing returns its existing approved state without another upload or OCR call.
- A listing with an open pending review returns the existing pending state without another upload or OCR call.
- A rejected submission permits a new attempt.
- The utility-bill endpoint never changes an already verified listing to unverified.

#### File security

- Rejected empty uploads.
- Enforced a maximum utility-bill size of 5 MB.
- Accepted only PDF, JPEG, and PNG files.
- Validated the binary file signature before storage or OCR.
- Derived the stored content type from the validated binary signature instead of trusting the browser.

#### OCR and automatic approval

- Replaced substring matching with complete normalized token matching.
- Preserved house numbers of every length.
- Normalized common street and unit abbreviations.
- Supported reversed, short, and hyphenated names.
- Retained the 60 percent normalized address-match threshold.
- Allowed automatic approval only when:
  - The legal owner is identity-verified.
  - The legal owner's name matches.
  - The address match reaches at least 60 percent.
- Sent all readable mismatches to manual review.
- Sent submissions with an unverified legal owner to manual review.
- Sent provider failures to manual review after local file validation and private upload succeeded.
- Did not persist or return raw OCR text.

#### Persistence

- Added Flyway migration V23.
- Added verification method and submission metadata.
- Added the submitting user and submission timestamp.
- Added name-match and address-match indicators.
- Added review and automation reasons.
- Added private storage key and evidence content type.
- Retained a nullable legacy proof URL for migration compatibility.
- Added a property, status, and ID index for current-state queries.

#### Private evidence

- Added a private-document storage interface separate from public listing media.
- Local development stores evidence under an unserved private-uploads directory.
- Production requires AWS_S3_PRIVATE_BUCKET_NAME.
- The private bucket does not fall back to the public listing-media bucket.
- Storage supports upload, authenticated retrieval, migration upload, and best-effort deletion.
- Added an opt-in, idempotent legacy evidence migration runner.
- The migration copies evidence to private storage, verifies the copy, updates the database, clears the public URL, and only then requests deletion of the public object.

#### API and admin review

- Utility-bill submissions now return a dedicated result containing the verification ID, property ID, state, method, user-facing message, and current listing verification status.
- Automatic approval and already-verified results return HTTP 200.
- New and existing pending reviews return HTTP 202.
- Invalid documents return HTTP 400.
- Unauthorized listing access returns HTTP 403.
- Added an authenticated listing verification status endpoint.
- Updated the admin queue to distinguish the legal owner from the listing manager.
- Added verification method, OCR indicators, submission date, and review reason to the admin view.
- Added an admin-only proof endpoint.
- Evidence is streamed with Cache-Control: no-store, X-Content-Type-Options: nosniff, and an inline content disposition.
- Direct S3 URLs and private storage keys are not returned.
- Admin approval publishes the listing.
- Admin rejection keeps the listing unverified and permits resubmission.
- Admin decisions are written to the existing administrative audit log.

#### Frontend

- Loaded listing data and current verification state together.
- Added durable no-submission, pending, verified, and rejected states.
- Disabled duplicate uploads while a review is pending.
- Restored pending and completed states after login or refresh.
- Displayed the administrator's rejection reason and allowed resubmission.
- Added agent-specific language explaining that the bill must belong to the mandate's legal owner.
- Used separate messaging for automatic approval and manual-review submission.
- Updated the admin evidence link to use the authenticated proof endpoint.
- Preserved binary proof responses in the authenticated Next.js proxy.

### Configuration and deployment

- Production must provide AWS_S3_PRIVATE_BUCKET_NAME.
- The configured bucket must block public access.
- Local development uses rello.private-storage.root, which defaults to ./private-uploads.
- Legacy evidence migration is disabled by default.
- Enable migration only after private storage is ready with rello.migrations.private-property-evidence.enabled=true.
- The migration is designed to be safe to run more than once.

### Validation completed

- The complete backend test suite passed.
- The final backend compile passed.
- Focused OCR normalization and matching tests passed.
- Frontend TypeScript checks passed.
- Focused frontend ESLint checks passed.
- The frontend production build passed.
- Git diff integrity checks passed in both repositories.

### Remaining operational work

- Create and secure the production private S3 bucket.
- Configure AWS_S3_PRIVATE_BUCKET_NAME in each deployed backend environment.
- Replace the invalid local AWS credentials with an active identity permitted to call `textract:DetectDocumentText` in the configured region.
- Run the legacy migration only after confirming the private bucket and backup strategy.
- Monitor the manual-review queue after release to confirm OCR mismatch reasons are useful to administrators.

### PostgreSQL migration reconciliation

#### What existed before

- The shared Neon testing database recorded Flyway migrations only through V17.
- Local startup disabled Flyway and used Hibernate `ddl-auto=update`.
- Hibernate had created part of the V23 schema without recording the migration.
- The legacy `proof_of_ownership_url` column still required a non-null value.
- New utility-bill submissions stored evidence privately and intentionally left the legacy public URL null.
- The database rejected the new verification row after OCR and upload, so the endpoint returned HTTP 500 and the cleanup path deleted the newly uploaded private file.

#### How it was repaired

- Created a Neon child-branch snapshot before changing the shared testing database.
- Checked the duplicate floor-plan and door records affected by V19 and V21 before migration. No duplicates were present.
- Corrected V19 so it enforces floor-plan uniqueness when the table already exists and safely defers to V21 when a clean database has not created the table yet.
- Made V23 safe for the partially updated schema with conditional column, foreign-key, and index creation.
- Removed the obsolete non-null requirement from `proof_of_ownership_url`.
- Standardized `private_storage_key` at 500 characters and `evidence_content_type` at 120 characters in both the migration and entity mapping.
- Backfilled null verification methods as `LEGACY`.
- Applied migrations V18 through V23 in order.
- Repaired the V19 Flyway checksum on the snapshotted testing branch after validating the ordering correction.
- Re-enabled Flyway locally and changed Hibernate to `ddl-auto=validate`, restoring Flyway as the schema authority.

#### Validation completed

- Flyway history reports V18 through V23 as successful.
- The submitter foreign key and property verification index are present.
- The legacy proof URL is nullable and the private evidence column lengths match the entity mappings.
- A second normal backend startup applied no migrations and passed Hibernate schema validation.
- A temporary clean Neon database applied all 23 migrations successfully, validated them, and applied zero migrations on a second run.
- The temporary migration database was removed immediately after validation.
- The complete backend suite passed with 198 tests, zero failures, and zero errors.
- Focused OCR verification tests passed with 5 tests, zero failures, and zero errors.
- An authenticated utility-bill resubmission for property 2 returned HTTP 202 instead of HTTP 500.
- The resulting row is pending manual review with method `UTILITY_BILL`, submission metadata, a private storage key, and a PDF content type.
- The private evidence file exists, remains inside the configured private root, and is non-empty.
- The legacy public proof URL remains null and the unverified listing was not published.
- A generated blank-image Textract diagnostic returned HTTP 400 `UnrecognizedClientException`, confirming that the configured AWS security token is invalid without resending private evidence.

## 2026-10-01: Consistent Async Button Feedback

### Scope

This fix standardizes buttons that start asynchronous frontend requests across authentication, listing management, bookings, verification, settings, messaging, notifications, reviews, and administrative workflows.

### What existed before

- Some request buttons remained enabled while a request was running, which allowed duplicate submissions.
- Some buttons showed only a spinner or a generic loading label.
- Some authentication buttons used blinking opacity instead of a clear progress state.
- Replacing a short idle label with a longer pending label could change button width and move nearby controls.
- Several rows used one busy identifier for multiple actions. Clicking one action could make a sibling action show the loader.
- Some request state was cleared only after a successful promise resolution. An unexpected rejection could leave the control disabled.
- Progress text was not consistently exposed as an accessible live status.

### What changed

#### Shared pending content

- Added `AsyncButtonContent` as the shared inline pending-content pattern.
- The idle and pending states occupy the same grid cell, so the widest state determines the button width before interaction.
- The inactive state remains invisible while preserving its layout space.
- The pending state contains an inline animated loader and a contextual label.
- Pending text uses a polite status announcement, and the loader is hidden from assistive technology.

#### Request protection

- Request buttons are disabled for the duration of their associated request.
- Buttons expose `aria-busy` only when their own action is running.
- Request state cleanup uses `finally` where a rejected promise could otherwise leave the interface locked.
- Multi-action rows now track an action-specific key rather than only a record ID.
- Sibling controls remain disabled during a conflicting request without incorrectly showing the active loader.

#### Contextual labels

- Authentication actions now use labels such as `Logging in…`, `Registering…`, `Verifying email…`, and `Resetting password…`.
- Listing actions now use labels such as `Creating listing…`, `Saving draft…`, `Updating unit status…`, and `Closing selected dates…`.
- Booking actions now identify the actual operation, including rental requests, shortlet requests, viewing requests, acceptance, cancellation, deposit claims, and payment checkout.
- Settings and account actions now identify profile saving, password changes, two-step sign-in actions, session termination, data export, account deactivation, and account deletion.
- Review, report, notification, saved-search, call, verification, and administrative actions now describe the exact operation in progress.

### Completed fix

The application now uses a consistent request-button contract:

1. The initiating action becomes disabled immediately.
2. Conflicting sibling actions are also disabled where necessary.
3. Only the initiating action displays its pending state.
4. The pending state contains a loader and operation-specific text.
5. The button retains a stable width while its content changes.
6. Assistive technology receives a busy state and a polite status update.
7. The original label and enabled state return after success or failure unless navigation replaces the page.

### Interface impact

- No backend endpoints, payloads, or database structures changed.
- No public component contracts changed outside the frontend UI layer.
- Existing request success and error behavior remains unchanged.

### Validation

- TypeScript validation passed during implementation.
- Focused ESLint checks passed.
- The production build passed.
- Git diff integrity checks passed.

## 2026-10-04: Compact Unified Tenant Search

### Scope

This fix combines keyword and natural-language property discovery into one compact tenant search experience. It covers the Browse interface, the public search contract, backend query classification, interpreted-filter merging, server-side filtering, optional provider infrastructure, and search-specific tests.

The implementation affects:

- The desktop Browse search surface.
- The sticky header search.
- The mobile search and filter sheet.
- Frontend search request and response types.
- The backend public search endpoint.
- Rental catalogue filtering and pagination.
- Optional Gemini interpretation and Redis caching.

### What existed before

- Browse exposed separate `Search by location` and `Describe what you need` modes.
- Switching modes changed which filters were visible and which backend path received the request.
- Tenants had to decide whether their query was a keyword or a description before searching.
- The additional mode selector made the search area taller than necessary.
- Plain-English search existed on another backend branch and was not integrated with the current catalogue rules.
- The previous interpretation contract assumed an annual rental mode when the query did not specify one.
- Manual filters were not submitted with interpreted searches.
- Natural-language filtering and keyword filtering did not share one result strategy contract.
- A Redis dependency could affect application health when no Redis server was running.
- The empty-state search icon was visually too small for its surrounding result area.

### Why it was a problem

- The two search modes exposed an implementation choice instead of letting tenants describe what they wanted naturally.
- Hiding filters in one mode prevented tenants from combining descriptive text with precise manual controls.
- The larger search surface used disproportionate vertical space before the property results.
- Defaulting an unspecified query to annual listings could hide valid monthly and shortlet results.
- Filtering after pagination could produce incorrect result counts, empty pages, or missing matches.
- Model or Redis availability could become a runtime dependency for otherwise normal property searches.
- Conflicting inferred and manually selected values did not have a clear precedence rule.

### How it was fixed

#### Compact unified frontend search

- Removed the separate keyword and description mode selector.
- Added one search field with the prompt `Search by city, area, property, or describe what you need`.
- Retained the 300-character query limit for all searches.
- Kept the query input and Search button as one connected control.
- Reduced the desktop search interface to two compact rows:
  - The unified query field and Search action.
  - Stay type, rental period, budget, bedrooms, and additional filters.
- Kept manual filters visible regardless of the query wording.
- Applied the same unified search behavior to the sticky header and mobile sheet.
- Preserved clear-input behavior, Enter submission, contextual loading text, result focus movement, active filter chips, and load-more pagination.

#### Backend search classification

- Added a public `POST /api/search/interpret` endpoint to the current backend branch.
- Added a server-side classifier that chooses between two strategies:
  - `KEYWORD` for simple place, area, or property-name searches.
  - `INTERPRETED` for rental intent, prices, room counts, stay periods, amenities, and descriptive constraints.
- Simple searches do not call Gemini.
- Missing Gemini configuration, provider failures, timeouts, and invalid interpretations fall back to keyword matching.
- `fallback` is set only when interpretation was attempted but could not produce a valid reading.
- Added nullable inferred stay type and rental mode values so a simple query such as `Lagos` does not default to annual homes.
- Added monthly rental interpretation alongside annual and short-stay interpretation.
- Kept inferred prices in the period specified by the query.

#### Manual filter precedence

- Extended interpretation requests with the existing explicit filters:
  - Stay type.
  - Rental mode.
  - Minimum price.
  - Maximum price.
  - Minimum bedrooms.
  - Sorting.
- Applied non-default manual filters after interpretation.
- Manual values override the corresponding inferred values.
- Preserved validation for incompatible stay types, rental modes, price ranges, and price sorting.
- Kept price controls unavailable until an exact annual, monthly, or nightly period is selected.

#### Server-side catalogue query

- Added a unified repository query that applies every effective filter before pagination and counting.
- Preserved public catalogue restrictions:
  - Only verified listings are returned.
  - Duplicate-flagged listings remain hidden.
  - Listings without an available unit remain hidden.
  - Inactive hosts remain hidden.
  - Inactive management mandates remain hidden.
  - Only rental listings are returned.
- Preserved server-side sorting and ordered card hydration.
- Added interpreted support for city, area, price, bedrooms, bathrooms, floor size, property keywords, and amenities.

#### Results and feedback

- Added `strategy` to the interpreted-search response.
- Interpretation chips appear only when the backend reports `INTERPRETED`.
- The fallback guidance appears only when interpretation was attempted and failed.
- Saved-search alerts remain available for keyword and manual-filter searches.
- Saved-search alerts are hidden for interpreted and fallback description searches because natural-language alerts remain outside this iteration.
- Increased the `No matching homes` icon from 24px to 32px.
- Increased its circular background from 56px to 72px.

#### Optional Gemini and Redis behavior

- Gemini remains optional. An empty API key uses keyword search without blocking application startup.
- Redis caching remains optional and is disabled unless explicitly enabled.
- Search continues without a cache manager or during Redis failures.
- Interpretation cache keys contain a hash of the normalized query instead of the raw tenant query.
- The cache version was increased after the interpreted filter shape changed.
- Redis health contributors are excluded so an unavailable optional cache cannot mark the application unhealthy.
- Backend test configuration disables Redis and does not require a local Redis process.

### Public interface changes

`POST /api/search/interpret?page=0&size=12` now accepts the tenant query with optional explicit catalogue filters.

The response retains the paginated property data, interpreted filters, and fallback flag. It now also includes:

- `strategy: "KEYWORD"`
- `strategy: "INTERPRETED"`

Existing rental catalogue and saved-search contracts remain unchanged.

### Configuration and deployment

- `GEMINI_API_KEY` enables natural-language interpretation.
- `GEMINI_MODEL` may override the configured Gemini model.
- `SEARCH_REDIS_ENABLED=true` enables Redis-backed interpretation caching.
- Redis host, port, username, password, SSL, timeout, and cache TTL settings remain configurable.
- No database migration is required.
- The local configuration template documents both optional integrations.

### Validation completed

- Added backend tests confirming that simple place searches avoid the model.
- Added backend tests confirming that failed interpretation falls back to keyword search.
- Added backend tests confirming that explicit manual filters override interpreted values.
- The complete backend test suite passed.
- The backend production package passed.
- Frontend TypeScript checks passed.
- Focused frontend ESLint checks passed.
- The frontend production build passed.
- Git diff integrity checks passed in both repositories.

### Remaining operational work

- Configure a Gemini API key only in environments where natural-language interpretation is required.
- Provision Redis only if shared interpretation caching is required.
- Monitor the percentage of `KEYWORD`, `INTERPRETED`, and fallback searches after release.
- Natural-language saved alerts remain outside this implementation.

## Compact Browse Search Controls

### What was there before

- The desktop Browse search used one full row for the query and a second permanent row for stay type, rental period, budget, bedrooms, and additional filters.
- Guidance beneath the controls added more height even when the tenant had not opened or used a filter.
- The filter count included values already visible in the query field or stay selector.
- The empty-state search icon was too small for the surrounding result area.

### Why it was a problem

- The search interface occupied disproportionate vertical space before the results.
- Permanently displaying every filter gave secondary controls the same visual weight as the primary search task.
- Counting visible controls as hidden filters made the badge less informative.

### How it was fixed

- Consolidated the desktop experience into one connected toolbar containing the query, stay scope, filter disclosure, and Search action.
- Kept `All stays`, `Homes to rent`, and `Shortlets` directly accessible through a styled scope dropdown.
- Moved rental period, contextual budget, and bedrooms into an anchored filter popover.
- Kept filter changes immediate and retained the existing mobile bottom sheet.
- Added keyboard dismissal, outside-click dismissal, focus management, and visible applied-filter feedback through the existing Radix primitives.
- Excluded the visible query and stay scope from the concealed-filter count and removable filter chips.
- Kept detailed active filters and `Clear all` outside the toolbar so the default search surface stays compact.
- Increased the empty-state icon to 48px inside a 104px circular container.

### Interfaces and behavior preserved

- No backend endpoint, search payload, saved-search, pagination, or sorting contract changed.
- Existing stay type, rental mode, price, bedroom, and sort values continue to drive the same server-side filtering.

## Unified Tenant and Host Identity Verification

### What was there before

- Tenants used a separate dark identity-dossier interface while landlords and agents used the newer open identity journey.
- The tenant flow split NIN and BVN into separate screens, offered selfie upload, and required a selfie before considering the tenant verified.
- Tenant progress, navigation prompts, and client state all described three required checks.
- The backend requires only NIN and BVN for tenants and records them atomically, so the frontend requirement did not match the server policy.
- The old completion screen contained a hardcoded tenant name.

### Why it was a problem

- Verification looked and behaved like a different product depending on the account role.
- A tenant could be verified by the backend but still appear incomplete in the frontend because the local state required a selfie.
- The separate tenant implementation duplicated camera, validation, status, error, and completion behavior.
- Hardcoded identity details could show information unrelated to the signed-in user.

### How it was fixed

- Generalized the host identity journey into one shared role-aware flow for tenants, landlords, and agents.
- Gave tenants the same open layout, masked fields, trust panel, progress treatment, review screen, accessible errors, and verified state.
- Defined the tenant journey as two steps: identity numbers, then review and verify.
- Kept tenant NIN and BVN submission atomic through the existing tenant verification endpoint.
- Removed tenant selfie capture, upload, and completion requirements to match the backend contract.
- Kept landlord live-selfie verification and agent personal plus business verification unchanged.
- Made server verification status authoritative when restoring the active screen.
- Preserved safe booking, offer, dashboard, and settings return paths.
- Updated tenant gates, settings badges, dashboard synchronization, and navigation progress to use two required checks.
- Removed the hardcoded tenant name and the obsolete tenant-only verification component.

### Interfaces and behavior preserved

- No backend endpoint, database, or verification payload changed.
- Tenant identity still uses `GET /api/verification/status` and `POST /api/verification/tenant`.
- Landlord and agent verification continue using their existing endpoints and role-specific requirements.

## One-Time Initial Administrator Provisioning

### What was there before

- Public password registration and Google registration correctly refused the `ADMIN` role.
- The application had no supported way to create the first administrator.
- Operators therefore needed direct database edits or an unsafe temporary registration change to bootstrap admin access.

### Why it was a problem

- Direct database edits can bypass BCrypt password encoding, public identifier generation, account flags, and audit logging.
- Temporarily exposing admin registration creates a privilege-escalation path and can remain enabled by mistake.
- Concurrent manual setup attempts could create more than one initial administrator.

### How it was fixed

- Added a property-gated Spring command that is disabled during normal application startup.
- Kept provisioning outside HTTP so there is no public or authenticated admin-creation endpoint to attack.
- Required a valid unused email, non-empty first and last names, and a password of at least 16 characters.
- Read the password only from an environment variable and never included it in logs, audit data, or command arguments.
- Acquired a PostgreSQL advisory transaction lock before checking administrator state.
- Refused provisioning if any administrator already exists or if the email belongs to any account.
- Created a dedicated active, email-verified `ADMIN` account with a BCrypt password, generated public identifier, and two-factor authentication enabled.
- Wrote the creation to `AdminActionAudit` in the same transaction.
- Closed the Spring context after a successful command so the provisioning process does not open or retain an HTTP server.
- Preserved the existing registration restrictions that prevent public and Google registration from requesting the `ADMIN` role.

### Operational behavior

- `RELLO_ADMIN_PROVISION_ENABLED` defaults to `false`.
- The four identity and password environment variables are read only when provisioning is enabled.
- Missing or invalid input, an existing email, an existing administrator, or a database failure causes a non-zero process exit without a partial account.
- Operators use a hidden shell prompt for the password and clear every provisioning environment variable immediately after the command.
- First login requires the account password and the emailed two-factor code.
- Additional administrators remain outside this command and require a future authenticated invitation workflow.

### Validation completed

- Confirmed normal startup does not register the provisioning runner.
- Confirmed valid input is normalized and creates the expected administrator and audit record.
- Confirmed the database lock is acquired before the first-administrator check.
- Confirmed malformed input and short passwords fail before database access.
- Confirmed existing administrators and existing email addresses cannot be provisioned or promoted.
- Confirmed the audit record does not contain the password.
- Passed the complete backend suite with 278 tests and no failures.
- Built the packaged Spring Boot application successfully.
- Passed backend and frontend diff integrity checks.

### Remaining operator validation

- Run the command once with the intended administrator identity and a securely entered password.
- Complete password and emailed two-factor login, then confirm access to `/admin/dashboard` and `/admin/verifications`.

## Property Detail First-Viewport Refinement

### What was there before

- The public property route had no navigation header, even when opened from an authenticated portal.
- The desktop Save button rendered the text `aria-busy=` because the attribute was placed inside the button body.
- Property verification appeared beside the title and again over the lead photograph.
- The desktop back action was an unexplained icon over the image.
- The 480px gallery pushed price and request actions below the first laptop viewport.
- A photo count appeared only when more than five images existed.
- Three supporting photographs were forced into shallow rows, causing aggressive image cropping.
- Bedrooms, bathrooms, size, and availability were enclosed in another bordered box.

### Why it was a problem

- A visible accessibility attribute made the page look broken and reduced trust in the Save action.
- Missing navigation disconnected a shareable listing from the rest of Rello.
- Repeated verification and heavy borders created visual noise without adding information.
- Tenants could not immediately see the rental period, price, availability, or photo count.
- The first viewport emphasized gallery height over the tenant's core decision-making information.

### How it was fixed

- Added a compact context-aware header for tenants, landlords, agents, administrators, and anonymous visitors while keeping the listing publicly accessible.
- Replaced the desktop image-overlay arrow with a labeled `Back to results` action and retained the compact overlay control on mobile.
- Moved `aria-busy` onto the Save button and preserved its loader, disabled state, stable dimensions, pressed state, and toast feedback.
- Kept one property verification badge beside the title and retained the separate host verification badge in the host section.
- Added price, rental period, and available-unit information directly beneath the location.
- Reduced the desktop gallery to 420px and introduced a balanced four-image supporting layout.
- Added an always-visible `View all X photos` action on desktop and mobile using the existing lightbox.
- Replaced the bordered facts box with an open row, quiet dividers, and correct singular or plural labels.
- Reordered the booking panel around price, availability, minimum stay, primary request action, reassurance, viewing, and host information.
- Preserved the mobile price and primary-action bar with its existing safe-area spacing.

### Interfaces and behavior preserved

- No backend, database, property payload, booking, viewing, saved-listing, or SEO contract changed.
- Existing tenant verification gates, request dialogs, sharing, messaging, reporting, tours, lightbox controls, and image optimization remain in place.

### Validation completed

- Frontend TypeScript checks passed.
- Focused property-page ESLint checks passed.
- The production build passed.
- Git diff integrity checks passed.
