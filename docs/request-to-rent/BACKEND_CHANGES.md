# Backend Changes for Rental Requests and Shortlet Bookings

## Purpose

The backend currently treats annual rentals, monthly rentals, and shortlets as date-range bookings. This forces tenants requesting a long-term home to provide an artificial end date.

The backend should support two distinct intents:

- A long-term rental request expresses when a tenant hopes to move in. It has no predicted end date.
- A shortlet booking reserves a property for an exact check-in and check-out range.

The property remains the source of truth for the flow. A client must not be allowed to submit a shortlet request for an annual listing or a rental request for a shortlet.

## Current Backend Limitations

The current implementation has the following constraints:

- `Booking.startDate` and `Booking.endDate` are both non-null database columns.
- `BookingRequest` requires both dates.
- `POST /api/bookings` accepts one date-range shape for every rental mode.
- `GET /api/bookings/quote` requires both dates and calculates periods for all modes.
- Conflict detection assumes every booking has a bounded date range.
- Property availability includes all pending and confirmed bookings as date ranges.
- Activity and data-export code call date methods without null checks.
- Frontend tenancy stages are derived from the booking status and end date.
- Confirming a long-term request does not establish an explicit open-ended tenancy lifecycle.

Relevant current implementation:

- `model/Booking.java`
- `dto/request/BookingRequest.java`
- `dto/response/BookingResponse.java`
- `controller/BookingController.java`
- `service/impl/BookingServiceImpl.java`
- `controller/PropertyAvailabilityController.java`
- `controller/ActivityController.java`
- `service/impl/DataExportServiceImpl.java`

## Recommended Domain Model

Continue using the existing booking aggregate for the first release so current tenant, landlord, and agent list endpoints remain usable. Add an explicit kind and mode-specific fields.

### New `BookingKind` enum

```java
public enum BookingKind {
    RENTAL_REQUEST,
    SHORT_STAY
}
```

### New `MoveInPreference` enum

```java
public enum MoveInPreference {
    ASAP,
    WITHIN_30_DAYS,
    EXACT_DATE,
    FLEXIBLE
}
```

### Booking fields

Add:

- `bookingKind`, required after migration
- `rentalMode`, stored as a snapshot of the property's mode when requested
- `moveInPreference`, rental requests only
- `preferredMoveInDate`, rental requests only and required for `EXACT_DATE`
- `tenantMessage`, optional text with a server-enforced length limit
- `guestCount`, shortlets only if guest selection ships in the first release

Change:

- Make `startDate` nullable and use it only for shortlet check-in.
- Make `endDate` nullable and use it only for shortlet check-out.
- Keep `totalPrice` for compatibility, but define it as the quoted rent for rental requests and the complete stay total for shortlets.

Do not infer historical booking behavior from the property's current mode. A host might edit a listing later, so the mode and kind must be stored on the booking record.

## Database Migration

Create a versioned migration rather than relying on Hibernate schema updates.

The migration should:

1. Add nullable columns for `booking_kind`, `rental_mode`, `move_in_preference`, `preferred_move_in_date`, `tenant_message`, and `guest_count`.
2. Backfill `rental_mode` from each booking's property.
3. Backfill `booking_kind` as `SHORT_STAY` when the stored mode is `SHORT_STAY`, otherwise `RENTAL_REQUEST`.
4. Preserve existing start and end dates for historical records.
5. Make `start_date` and `end_date` nullable.
6. Make `booking_kind` and `rental_mode` non-null after the backfill.
7. Add check constraints where supported:
   - Shortlets require start and end dates.
   - Rental requests must not require an end date.
   - Exact-date rental requests require a preferred move-in date.
   - Guest count must be positive when present.
8. Add indexes for property and kind queries used by availability and host dashboards.

Before production migration, decide how old non-shortlet bookings with stored end dates should appear. The safest compatibility behavior is to preserve their dates while treating new long-term requests as open-ended.

## Creation Endpoints

Use separate creation endpoints so validation and intent are unambiguous. Keep existing read endpoints unified.

### Create a long-term rental request

`POST /api/bookings/rental-requests`

Authentication: verified tenant required.

Request:

```json
{
  "propertyId": 74,
  "moveInPreference": "EXACT_DATE",
  "preferredMoveInDate": "2026-10-01",
  "message": "I work nearby and would like to arrange a viewing."
}
```

Rules:

- The property must be verified, available, and `FOR_RENT`.
- The property mode must be `ANNUAL` or `MONTHLY`.
- `preferredMoveInDate` is required only for `EXACT_DATE`.
- A supplied preferred date cannot be in the past.
- `endDate` must not be accepted or manufactured.
- The server takes the tenant identity from the access token.
- The server snapshots the property's rental mode and advertised price.
- Reject a duplicate open request from the same tenant for the same property.
- The initial status is `PENDING`.
- Creating a request does not charge the tenant or create escrow.

### Create a shortlet booking

`POST /api/bookings/short-stays`

Authentication: verified tenant required.

Request:

```json
{
  "propertyId": 81,
  "checkInDate": "2026-10-04",
  "checkOutDate": "2026-10-09",
  "guestCount": 2,
  "message": "We expect to arrive in the afternoon."
}
```

Rules:

- The property must be verified, available, and `FOR_RENT`.
- The property mode must be `SHORT_STAY`.
- Check-in must be before check-out and cannot be in the past.
- The stay must satisfy `minimumNights`.
- The range must not overlap blocks or pending and confirmed shortlet bookings.
- Guest count must be positive and must not exceed the property's maximum occupancy when that field is available.
- The server calculates and stores the price. Client-supplied totals are never accepted.
- The initial status is `PENDING`.

## Quote and Availability Endpoints

Keep `GET /api/bookings/quote` for shortlets only, or rename it to `GET /api/bookings/short-stays/quote` and temporarily support the old path.

Recommended parameters:

```text
propertyId=81
checkInDate=2026-10-04
checkOutDate=2026-10-09
guestCount=2
```

The response should continue returning:

- Nightly unit price
- Number of nights
- Cleaning fee
- Total
- Currency
- Unavailable reason when the range cannot be booked

Long-term rental requests do not need a date-range quote. Their dialog displays the listing's monthly or annual price and clearly states that no payment occurs when the request is sent.

`GET /api/properties/{propertyId}/availability` should return bookable date ranges only for shortlets. For a long-term property, return a clear mode-specific response or reject the request because calendar availability is not relevant.

## Unified Read Response

Keep these endpoints so current dashboard integrations have one collection to load:

- `GET /api/bookings/mine`
- `GET /api/bookings/host`

Extend `BookingResponse` with discriminated fields:

```json
{
  "id": 214,
  "bookingKind": "RENTAL_REQUEST",
  "rentalMode": "ANNUAL",
  "propertyId": 74,
  "propertyTitle": "Hello Homes",
  "status": "PENDING",
  "startDate": null,
  "endDate": null,
  "moveInPreference": "EXACT_DATE",
  "preferredMoveInDate": "2026-10-01",
  "guestCount": null,
  "tenantMessage": "I work nearby and would like to arrange a viewing.",
  "totalPrice": 250000,
  "createdAt": "2026-09-14T21:15:00"
}
```

For a shortlet:

- `bookingKind` is `SHORT_STAY`.
- `startDate` and `endDate` are populated.
- Rental move-in fields are null.
- `guestCount` is populated when supported.

Continue returning the existing tenant, host, property image, and address summaries.

## Status and Tenancy Lifecycle

The existing `PENDING`, `CONFIRMED`, `CANCELLED`, and `COMPLETED` values can remain for compatibility, but their meaning must depend on the booking kind.

### Rental request

- `PENDING`: the landlord or agent has not decided.
- `CONFIRMED`: the request has been accepted.
- `CANCELLED`: either party withdrew or the host declined.
- `COMPLETED`: the tenancy was explicitly ended. Time alone must not complete it.

When a rental request is confirmed:

- Prevent another rental request from being confirmed for the same property.
- Decide whether the property becomes `RENTED` immediately or after a separate lease or payment milestone.
- Cancel or close competing pending requests using an explicit product rule.
- Do not derive completion from an artificial end date.

### Shortlet

- Keep date-driven upcoming, active, and past presentation.
- Pending and confirmed ranges continue to block conflicting bookings.
- Completion can remain explicit or be automated after check-out according to one documented rule.

The preferred long-term design is for the backend to return a lifecycle stage so all clients use the same result. Suggested values are `REQUEST`, `UPCOMING`, `ACTIVE`, and `PAST`.

## Availability Rules

Update conflict checks so they branch by booking kind.

For shortlets:

- Compare only bounded shortlet ranges.
- Include property blocks.
- Preserve same-day turnover behavior.

For long-term rentals:

- Pending requests do not make the property unavailable to other tenants unless product decides otherwise.
- Only one request may be confirmed for a property.
- A confirmed long-term tenancy makes the property unavailable for new rental requests.
- Property availability is restored only through an explicit tenancy-ending workflow.

Every overlap check must guard nullable dates. Existing records must not cause a null dereference.

## Pricing, Payment, and Escrow

Rental requests and shortlet bookings should not create escrow at request time.

- A rental request snapshots the advertised monthly or annual price for display and audit purposes.
- A shortlet booking stores the server-calculated total for the selected stay.
- Any later payment endpoint must verify the stored server price rather than accept a client amount.
- The current escrow auto-release logic uses the booking start date. It must branch by booking kind before long-term dates become nullable.
- Long-term escrow release should use the actual move-in or tenancy-start milestone, not a requested date when the tenant selected a flexible option.

## Guest Capacity

If guest count is part of the first shortlet release, add `maximumGuests` to:

- `Property`
- Property creation and update requests
- Property draft requests and responses
- Public property summaries and details
- Shortlet validation

Only `SHORT_STAY` listings should require this value. Until maximum occupancy exists, omit guest count from the first frontend release rather than displaying an unenforced control.

## Existing Code That Must Become Null-Safe

At minimum, audit and update:

- `BookingServiceImpl.firstClash`
- `PropertyAvailabilityController`
- `ActivityController`
- `DataExportServiceImpl`
- Escrow release scheduling
- Booking response mapping
- Repository queries that compare start and end dates
- Any notification templates that print a date range

Do not replace null dates with sentinel values such as `2099-12-31`. Sentinel dates would leak into conflict checks, exports, notifications, and user interfaces as false tenancy terms.

## Compatibility Strategy

1. Add and backfill the new columns before changing response validation.
2. Make read responses additive so the existing frontend can continue reading old fields during rollout.
3. Introduce the two new creation endpoints.
4. Keep `POST /api/bookings` temporarily for the current frontend, but mark it deprecated.
5. Deploy the frontend flow split.
6. Monitor creation errors and confirm that no new long-term record contains a fabricated end date.
7. Remove the legacy creation endpoint after all clients migrate.

Existing historical long-term bookings may continue returning their original start and end dates. New clients should use `bookingKind` to decide which fields to display.

## Error Contract

Return stable error codes in the existing API envelope for at least:

- Wrong property rental mode
- Property not verified
- Property unavailable
- Duplicate open rental request
- Invalid move-in preference
- Preferred move-in date required
- Preferred move-in date in the past
- Invalid shortlet date range
- Minimum-night violation
- Shortlet dates unavailable
- Guest capacity exceeded
- Tenant identity not verified

The frontend should display the server message but branch on a stable code when it needs a specific recovery action.

## Tests

Add service and controller coverage for:

- Every valid move-in preference
- Exact-date rental requests with missing and past dates
- Rental requests without end dates
- Mode mismatch attempts
- Duplicate rental requests
- Competing rental request confirmation
- Shortlet minimum nights and unavailable ranges
- Back-to-back shortlet stays
- Server-side price calculation
- Guest-capacity validation when enabled
- Tenant and host authorization
- Null-safe activity, export, availability, and escrow processing
- Existing migrated bookings

## Backend Acceptance Criteria

- Annual and monthly rental requests can be created without an end date.
- Shortlets still require valid check-in and check-out dates.
- The property mode always determines which request is accepted.
- No client can submit or override a booking price.
- Unified tenant and host reads identify the booking kind and expose only relevant fields.
- Confirmed long-term tenancies do not become past because of a fabricated date.
- Shortlet availability and price calculations continue to work.
- Existing booking records remain readable after migration.
- Activity, export, availability, and escrow jobs handle both booking kinds without errors.

## Platform-Wide Performance Requirements

These requirements apply beyond the rental-request feature. They support faster rendering across every frontend route that depends on backend data.

### Measure Before Optimizing

- Record request latency at the controller, service, repository, and external-provider boundaries.
- Track median, 95th-percentile, and 99th-percentile response times by endpoint.
- Add request correlation identifiers so slow frontend requests can be traced through backend logs.
- Record database pool wait time, active connections, query duration, error rate, and timeout count.
- Define performance targets for authentication, listing reads, property details, dashboards, bookings, verification status, and mutations.
- Keep health checks lightweight and separate availability checks from detailed dependency diagnostics.

### Neon Connection and Startup

- Investigate slow Neon connection establishment and schema metadata reads during local and deployed startup.
- Use versioned migrations in deployment workflows and keep Hibernate schema validation or updates out of normal request processing.
- Confirm that the JDBC URL uses the correct Neon endpoint and pooling mode for the environment.
- Tune connection, validation, idle, keepalive, and maximum-lifetime settings against Neon limits.
- Avoid creating more application connections than the database or deployment instance can service.
- Record application readiness only after required initialization completes.
- Keep retry behavior bounded so a temporary database failure does not create an endless startup loop.

### Query Performance

- Enable slow-query logging with a production-safe threshold.
- Review query plans for listing browse, property details, booking collections, dashboard summaries, verification status, and profile reads.
- Add indexes for actual filter, join, sort, and status predicates confirmed by query plans.
- Eliminate N+1 queries when returning property cards, host summaries, tenancy rows, images, amenities, or verification data.
- Use projections for collection endpoints so list views do not hydrate complete entities.
- Fetch full nested data only from detail endpoints that need it.
- Batch independent aggregate queries where it reduces round trips without creating an oversized query.

### Pagination and Payload Size

- Paginate every collection that can grow without a practical bound.
- Use stable sorting and cursors where records can be inserted while a user paginates.
- Return compact card summaries for browse and dashboard collections.
- Do not include image binaries, unused nested entities, internal audit fields, or repeated host data in collection responses.
- Expose total counts only where the interface uses them and calculate expensive counts separately when needed.
- Support filter parameters on the server so the client does not download an entire collection to filter locally.

### Data Fetching Audit Follow-ups: 2026-09-16

- Existing paging does not need to be reinvented: booking and escrow lists already expose `page`, `size`, and `X-Total-Count`; maintenance and draft lists return page envelopes; admin risk and deposit queues support paging and count headers.
- Frontend work remains to expose all of that existing paging consistently. Do not solve capped-page omissions by automatically downloading all history.
- Add compatible paging and server filters for viewings, saved listings, reviews, disputes, and chat history where collections still return full arrays. Return stable ordering and `hasNext` or cursor metadata.
- Add a rental-mode filter to public listing search so Homes to rent and Shortlets match the entire catalogue and return correct filtered totals, not only matches in the loaded page.
- Provide active-tenancy lookup and bounded dashboard attention/upcoming data that do not depend on the first page of booking history containing every important record.
- Return account-wide aggregates separately from paginated detail rows. Occupancy, eligibility, financial totals, and dashboard task counts must not be guessed from one loaded page.
- Define shared profile and verification revalidation/version contracts before introducing completed-response caches. Frontend in-flight sharing must not replace authoritative verification checks after mutations.
- Keep existing clients compatible while adding pagination envelopes or cursor responses. The frontend currently has a mixture of arrays, page envelopes, and count headers.

### Caching and Revalidation

- Define cache rules for public listing summaries, property details, availability, dashboard summaries, and verification status.
- Do not cache personalized responses without a user-scoped key.
- Invalidate or update affected cache entries after listing, booking, tenancy, profile, or verification mutations.
- Use validators such as ETags or last-modified timestamps for suitable read endpoints.
- Prevent cache layers from returning stale verification or authorization state after an account change.

### Endpoint Composition

- Provide purpose-built dashboard summary endpoints when the frontend currently combines many requests to render one screen.
- Return the current user's profile, role, and verification summary through one stable session endpoint when practical.
- Avoid making the frontend request the same property, host, or user data separately for adjacent components.
- Keep slow optional sections independent so one provider or aggregate does not delay the entire primary response.
- Run independent service and repository operations concurrently only when connection-pool capacity supports it.

### External Services and Background Work

- Keep email, payout, document processing, and other slow provider calls outside database transactions.
- Move non-essential work out of request threads using the existing durable job or outbox patterns.
- Apply connect, read, and total-operation timeouts to every external request.
- Add bounded retry with idempotency for operations that are safe to retry.
- Return a pending state for genuinely asynchronous work instead of holding the frontend request open.

### Backend Performance Tests

- Add integration tests that detect N+1 query regressions on representative collection endpoints.
- Add load tests for authentication, browse listings, property details, dashboards, bookings, and verification status.
- Test with production-like row counts rather than empty or minimal fixtures.
- Verify pagination limits and maximum response sizes.
- Verify that a slow external provider does not exhaust request threads or database connections.
- Run a startup timing check against a reachable development database and record regressions.

### Platform Performance Acceptance Criteria

- Key endpoints have documented latency targets and observable production measurements.
- Collection endpoints are bounded, paginated, and return only the fields their screens require.
- Representative dashboard and listing requests do not produce N+1 query patterns.
- Slow external providers do not hold database transactions or block unrelated requests.
- Cache behavior is user-safe and invalidates after relevant mutations.
- Backend readiness accurately reflects whether the application can serve requests.
- Frontend routes can load their primary content without duplicate or unnecessary API calls.

## Platform-Wide Public Identifiers

Public property and host routes currently expose numeric database primary keys. Internal numeric IDs can remain efficient relationship keys, but they should not be the identifiers published in browser URLs or public API contracts.

### Identifier Model

- Add an immutable `publicId` to every property.
- Add an immutable `publicId` to the public host identity used for landlord and agent profile pages.
- Prefer UUID, ULID, or a securely generated opaque identifier with enough entropy to prevent practical enumeration.
- Do not derive the public identifier from a database sequence, email address, phone number, or another sensitive value.
- Add non-null unique indexes after existing records are backfilled.
- Generate identifiers on the server and never accept a client-selected public identifier.
- Keep numeric primary keys for internal joins and foreign keys.

Readable slugs should be presentation fields rather than identifiers. A route such as `/property/luxury-terrace-lekki-p_8f3k2` should resolve the property using `p_8f3k2`; changing the title should not change the record's identity.

### Migration

1. Add nullable public identifier columns.
2. Backfill every existing property and public host profile with a unique value.
3. Verify that no value is null or duplicated.
4. Add non-null and unique constraints.
5. Include public identifiers in existing property, host, listing, booking, tenancy, activity, and search responses where clients create links.
6. Deploy public lookup support before changing frontend links.
7. Monitor public lookup failures during the compatibility period.

The migration must be versioned and repeatable. Hibernate schema updates must not generate or backfill public identifiers.

### Public Lookup Contract

Support public lookup endpoints that do not require numeric database IDs. The final naming should follow the backend's established route conventions. Suggested contracts are:

```text
GET /api/properties/public/{publicId}
GET /api/hosts/public/{publicId}
```

Responses used to construct links should expose both:

- `publicId`, which is immutable and used for lookup
- `slug`, which is readable and used to construct the canonical URL

The backend should either return the current slug from the lookup response or provide enough stable display data for the frontend to generate it consistently. The public identifier remains authoritative when a slug is missing or outdated.

### Legacy Numeric Routes

- Keep numeric lookup endpoints temporarily for authenticated internal workflows that still require them.
- Provide a compatibility lookup or redirect path so saved numeric browser URLs can resolve to the new canonical URL.
- Mark public numeric lookup usage as deprecated and record remaining consumers.
- Remove public numeric routing only after frontend deployments, external links, tests, and documentation have migrated.
- Do not expose whether a private or unauthorized record exists through different error responses.

### Authorization and Enumeration

Opaque identifiers reduce predictable enumeration but do not replace authorization.

- Apply the same ownership, visibility, verification, and publication checks used by current detail endpoints.
- Return a consistent not-found response for records that do not exist or are not publicly visible.
- Never authorize edits, verification actions, booking actions, or private host data merely because the caller knows a public identifier.
- Rate-limit public detail lookups according to the platform's existing policy.
- Keep private user fields out of public host responses.

### Canonical URL Support

- Return or derive one canonical slug for each public property and host.
- Allow lookup by public identifier when the supplied slug is outdated.
- Give the frontend enough information to redirect outdated slugs to the canonical URL.
- Preserve the same public identifier when a property title or host display name changes.
- Include canonical public URLs in metadata, sharing payloads, notifications, and emails that link to these records.

### Tests

- Verify identifier generation for new properties and host profiles.
- Verify migration backfill uniqueness and non-null constraints.
- Verify public lookup for landlords, agents, and properties.
- Verify that renamed records retain the same public identifier.
- Verify that unknown, malformed, private, and unauthorized records return the agreed response.
- Verify that numeric identifiers cannot be substituted where a public identifier is required.
- Verify that list and relationship responses include the identifiers needed to construct public links.
- Verify compatibility behavior for existing numeric links.

### Public Identifier Acceptance Criteria

- Public property and host browser routes do not contain numeric database primary keys.
- Public API consumers can resolve properties and hosts through immutable opaque identifiers.
- Internal database relationships continue using numeric primary keys where appropriate.
- Existing records receive unique public identifiers through a versioned migration.
- Title and display-name changes do not break saved links.
- Legacy numeric links remain recoverable during the documented compatibility period.
- Knowing a public identifier does not bypass visibility or authorization rules.
