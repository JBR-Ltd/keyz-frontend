# Frontend Performance Report

## First Batch: 2026-09-16

- Baseline: frontend commit `f4632c7`, before this batch's working-tree edits.
- Branch: `feat/add-dashboards-2`.
- Framework: Next.js 16.2.3 with Turbopack, React 19.2.4.
- Build command: `pnpm build` on the same local machine, with the same `.env` and installed dependencies.
- Scope: Tenant Browse request coordination and property request-dialog code splitting.
- No backend changes, browser-persistent cache, or account-shared data cache were added.
- This report and the TODO remain local. They have not been committed or pushed.

## Production Bundle Measurements

Measured from `.next/server/app/<route>/page_client-reference-manifest.js`: deduplicate all `entryJSFiles`, sum their file sizes, then gzip each file independently with Node's default gzip settings. Shared layout and fallback entry chunks are included consistently in both runs. These are artifact measurements, not observed browser transfer sizes or executed JavaScript measurements. Dynamic dialog chunks are excluded from the entry total.

| Route | Before raw bytes | After raw bytes | Before gzip bytes | After gzip bytes |
| --- | ---: | ---: | ---: | ---: |
| Property details | 431,912 | 382,635 | 130,675 | 119,070 |
| Tenant Browse | 514,309 | 514,616 | 153,557 | 153,654 |

- Property entry JavaScript decreased by 49,277 bytes, approximately 11.4%. Its gzip estimate decreased by 11,605 bytes, approximately 8.9%.
- Browse entry JavaScript increased by 307 bytes raw and 97 bytes gzip for independent loading and pagination guards. Its improvement is fewer requests and removing an unrelated loading dependency, not a smaller bundle.
- Production loadable-manifest verification confirmed both request-dialog chunks are separate from the property route's entry chunks.
- Dialog code is loaded when the relevant control is used. A status indicator appears while the module loads. The viewing dialog remains mounted after its first opening so form state and exit animation remain intact.

### Reproduce Bundle Measurements

Run `pnpm build`, then execute:

```sh
node <<'NODE'
const fs = require("fs");
const vm = require("vm");
const zlib = require("zlib");

for (const route of ["property/[id]", "(tenant)/tenant/browse"]) {
  const context = {};
  const path = `.next/server/app/${route}/page_client-reference-manifest.js`;
  vm.runInNewContext(fs.readFileSync(path, "utf8"), context);
  const manifest = Object.values(context.__RSC_MANIFEST)[0];
  const files = [...new Set(Object.values(manifest.entryJSFiles).flat())];
  let rawBytes = 0;
  let gzipBytes = 0;

  for (const file of files) {
    const bytes = fs.readFileSync(`.next/${file}`);
    rawBytes += bytes.length;
    gzipBytes += zlib.gzipSync(bytes).length;
  }

  console.log({ route, files: files.length, rawBytes, gzipBytes });
}
NODE
```

## Controlled Request Behavior

A read-only Node harness used TypeScript's AST to extract the actual Browse loading effects and Load more callback from the baseline commit and working tree. It executed those callbacks with mocked setters and deferred request promises, allowing response order to be controlled without changing server data.

| Scenario | Before | After |
| --- | --- | --- |
| Saved-listings calls across initial search and one changed search | 2 | 1 |
| Property request resolves while saved-listings request is still pending | Grid remains loading | Grid resolves independently |
| Load more invoked twice before its response resolves | Two pagination requests | One pagination request |
| Old pagination response resolves after a replacement search | Old results append | Old response ignored |
| Pagination response resolves after page cleanup | State update attempted | Response ignored |

- All five updated assertions passed.
- Save controls stay loading until saved-home state resolves, avoiding a save action racing the initial saved-state response.
- The existing first-page stale-response guard remains in place, with a shared search-generation guard for pagination.
- Changing search resets pagination loading without allowing old responses to clear a newer request's loading state.
- This is callback-level regression verification, not a browser network capture or full React component test.
- React development Strict Mode can replay mount effects and issue extra initial requests. This batch removes filter-triggered saved-listings refetches; it does not introduce global request deduplication or cancellation.
- Obsolete requests are ignored rather than aborted, so they may still complete on the backend.

## Build and Code Checks

- Baseline production build: passed; compiler reported 20.8 seconds, TypeScript reported 12.4 seconds.
- Final production build: passed; compiler reported 17.0 seconds, TypeScript reported 12.3 seconds.
- ESLint: passed without warnings after cleanup.
- `git diff --check`: passed.

Build phase timings are single local observations affected by caches, machine load, and font/network conditions. They are not statistically comparable benchmarks and do not establish a rendering-speed improvement. Development route timings were not measured in this batch.

## Remaining Verification

- Browser LCP, INP, CLS, request waterfalls, CPU profiles, and real transfer sizes remain unmeasured. No browser automation capability was available for this batch.
- Visually verify first-open dialog feedback, keyboard focus, Escape, form submission, close, and reopen on mobile and desktop.
- Test rapid filter changes during pagination and saved-state loading against the running application.
- Test failed requests and explicit retries, including saved-home fetch failures.
- Confirm fresh account state after logout and login as a different role.
- Continue the broader shared-data cache, section-loading, media, navigation, and calendar audit in the TODO. This batch does not mark those site-wide requirements complete.

## Site-Wide Data Fetching Audit and Rollout

### Shared Request Layer

- All existing client `fetch` call sites now use `src/lib/apiRequest.ts`. The coverage check identified 33 adopting files across libraries, public routes, authentication, verification, and marketing forms.
- Equivalent overlapping GETs share one underlying request, with independent response clones for each caller. Keys include the path, normalized options and headers, token, and role.
- Sharing ends when response headers resolve. This is in-flight deduplication, not a cache of completed data or a guarantee of one request for an entire navigation.
- Different query parameters, headers, credentials, or options remain separate. Requests with their own cancellation signal, body, or explicit reload bypass sharing.
- Mutations are never combined. Pending-read sharing clears before and after each write; older cleanup cannot remove a newer request entry.
- Account changes reject late API responses at the request boundary. Stale Authorization headers are rejected before dispatch.
- Non-API assets and server-side calls bypass the helper's sharing behavior. Next.js proxy handlers were not rewritten.
- The existing account cache is additionally scoped by token and role, checked after body parsing, and guarded against late reads overwriting profile updates or logout.

### Route and Feature Coverage

| Area | Audit outcome and changes |
| --- | --- |
| Marketing and authentication | Mutation calls use the shared boundary; signup, sign-in, email, and waitlist requests remain explicit actions |
| Public property details | Saved-home reads start alongside property detail; numeric failures no longer repeat the same lookup through the host fallback |
| Public host profiles | Profile and listing reads resolve independently; Load more and listing retry have concurrency and stale-response guards |
| Tenant Browse | Existing search-generation guards retained; saved reads stay separate; shared helper covers requests |
| Tenant My Home | Booking selection genuinely precedes booking-specific documents and maintenance; independent secondary reads already run concurrently |
| Landlord and Agent Dashboards | Independent initial requests retained; the earlier Agent section-loading changes remain; layout and page can share matching pending reads |
| Landlord and Agent Tenancies | Explicit pagination pages, overlap locks, and stale/unmount guards; Agent now exposes Show more using existing booking count metadata |
| Listings and drafts | Drafts and portfolio now start together; event-driven refreshes ignore superseded responses |
| Listing management | Availability no longer gates primary property/gallery content; refreshes use guarded effects and availability has its own loading/error/retry state |
| Shortlet flow | Availability has cleanup guards; quotes do not run while closed and quote identity includes the property ID |
| Verification and payments settings | Guarded verification refreshes; tenant/admin shells and tenant payments skip host-only status hooks |
| Settings exports | Refreshes now use one guarded effect instead of unguarded competing callbacks |
| Admin queues | Existing shared search controller retains pagination and immediate filters; typing resets pagination only when its debounced query is applied |
| Admin risk and deposits | Independent requests and errors; changing risk status no longer reloads claims; settling a deposit refreshes relevant data |
| Repairs | Existing maintenance page parameters and `hasNext` are exposed; shared host repair screen has guarded Show more |
| Reviews and disputes | Initial reads already run concurrently; joined results support eligibility decisions requiring both reviews/disputes and bookings |
| Escrow and activity | Reads use shared request layer; existing cleanup guards retained; further pagination and aggregate coverage remains pending |
| Chat and calls | Shared reads plus local polling locks; unread badge updates no longer wait for thread-list responses; failed polling preserves visible state |
| Virtual tours | Floor, room, and panorama IDs create real dependencies; requests within each known-ID level already run concurrently |

### Controlled Checks

Temporary Node harnesses exercised the actual transpiled request/account code, extracted pagination callbacks, and the admin search hook with controlled promises and timers.

- Equivalent overlapping GETs produce one network call and independently readable response bodies.
- A later completed-data read issues a fresh request; network and HTTP failures permit retry.
- Parameters, headers, credentials, cancellation signals, and explicit reloads stay independent.
- Writes are never combined, and subsequent refreshes do not share pre-write reads.
- Token/role switches reject old responses and stale authorization; account cache reads cannot return the previous user's data.
- Late user reads do not overwrite a completed profile update or clear another account's pending user request.
- Logout removes cached account state.
- Host, Landlord, and Agent pagination prevent duplicate requests, advance explicit pages, and ignore stale or unmounted responses.
- Draft and portfolio requests both begin before either response resolves.
- Failed numeric property lookup calls the backend once, with no repeated host fallback.
- Admin typing on another page makes no old-query page-zero request; the debounced query and page reset apply together. Status filters remain immediate and stale results are ignored.
- The earlier four Agent Dashboard loading scenario groups still pass.

These are controlled logic checks, not browser timing measurements or full React/browser integration tests.

### Remaining Work and Corrected Backend Assumptions

- Some backend collections already support paging: bookings and escrow use `page`, `size`, and `X-Total-Count`; maintenance and drafts return page envelopes; admin risk/deposit queues also expose count headers. Missing controls for these are frontend follow-ups, not requests to invent new backend paging.
- Other collections still return full arrays, including viewings, saved listings, reviews, chat threads/conversations, and disputes. Their backend paging/filter contracts still need agreement.
- Tenant My Home and dashboard eligibility/attention logic must not infer complete account state from one capped booking page. Dedicated active-tenancy, priority, or aggregate responses are preferable to downloading every historical record.
- Browse still filters long rentals versus shortlets locally. The public listing controller does not currently accept a rental-mode filter, so complete server filtering and accurate filtered totals need backend support.
- Navigation-scoped shared profile/verification revalidation, cache lifetimes, and comprehensive pagination remain incomplete. There is no new persistent verification cache.
- Obsolete responses are ignored, not universally aborted. Polling deliberately refreshes live data and remains polling rather than real-time push.
- Browser LCP, INP, CLS, waterfalls, skeleton rendering, and keyboard/mobile behavior remain unverified. No rendering-speed percentage is claimed.
- No backend edits, commits, or pushes were made. Documents remain local.

## Artificial Waiting Removal

- Listing photo previews become ready when local file reading resolves. The simulated `650 + index * 180` ms upload timers and their cleanup were removed. Actual draft and listing submission requests are unchanged.
- Tenant verification advances after successful identity or selfie API checks without the forced 700 ms pause. Verified step indicators and the final completion screen remain; the transient pre-transition "Verified" message was removed with its timer state.
- The root layout no longer mounts the decorative loading gate or initially hides the document and locks its scrolling. Server-rendered content is visible without waiting for hydration or the logo animation.
- The logo component remains available but is not mounted by the application. Its additional 600 ms exit pause was removed as well.
- The Landlord Dashboard's 150 ms skeleton reveal timer is retained. It suppresses a brief placeholder flash without delaying resolved content.
- Real request states, network timeouts, search debouncing, polling, toast dismissal, and ordinary short transition animations are not artificial data-loading waits and were not removed in this batch.
- Remaining routes still need a full timer audit and browser verification. This does not complete the site-wide artificial-waiting checklist or establish measured browser speed gains.
- Final ESLint, TypeScript production build with all 102 routes, and `git diff --check` passed. Browser workflow verification remains pending.

## Agent Dashboard: Independent Section Loading

### Scope and Behavior

- Previously, the Agent Dashboard waited for a four-request `Promise.all` before displaying its content. Verification was fetched separately through the existing verification hook.
- Portfolio, bookings, viewings, summary, and the existing verification endpoint now have independent loading, error, and retry states within this page.
- The request set is unchanged. A targeted retry repeats only the failed resource, not successful requests.
- Static headings and controls appear immediately. Before account hydration, the greeting uses "Your dashboard" and a date placeholder rather than a potentially mismatched server clock.
- Successful data remains visible when another resource is pending or fails.

| Section | Data dependency | Pending or failure behavior |
| --- | --- | --- |
| First three summary counts | Dashboard summary | Value placeholders or compact errors with retry |
| Rental income | Portfolio | Independent value placeholder or error with retry |
| Property details | Portfolio | Thumbnail and metadata row skeletons or isolated error |
| Property occupancy | Bookings | Occupancy placeholders; failure is unavailable, not available |
| Recent tenancies | Bookings | Matching card skeletons or isolated error |
| Upcoming schedule | Bookings and viewings | Known items appear while remaining checks load; each failed source has retry |
| Needs attention | Portfolio, bookings, viewings, verification | Known tasks appear progressively; no all-clear message while checks are pending or failed |

- The full empty dashboard requires successful, resolved resources and empty collections and summary counts.
- Failed verification does not produce an unverified-account warning. That warning requires a successful verification response.
- Pending or failed bookings do not label a published home as available.
- Cleanup guards ignore responses after unmount. Requests are not aborted, and this batch does not introduce shared caching or global deduplication.

### Controlled Verification

A temporary Node harness transpiled the actual Agent Dashboard component and supplied deferred endpoint responses with a lightweight hook scheduler. React static markup was used to inspect resulting section states. This checks component logic, not browser rendering or a full React integration lifecycle.

- Initial shell appears without a premature empty state.
- Portfolio-first responses reveal property details while occupancy and other sections remain pending.
- Bookings reveal tenancy details before summary, viewings, and verification complete.
- Summary-first responses reveal counts while portfolio sections remain pending.
- Viewing and portfolio failures remain isolated from successful sections.
- Viewing-only and portfolio-only retries each increment only their respective request counter. All other resource counters remain unchanged.
- Unexpected rejected requests leave loading and expose a retryable error.
- Responses following cleanup do not update state.
- Pending or failed verification prevents false empty and all-clear states; a successful empty response set displays the genuine empty dashboard.
- All four scenario groups passed.
- Final ESLint, production build, and `git diff --check` passed. The build generated all 102 routes.

### Remaining Checks

- Browser timing, LCP, INP, CLS, visual skeleton alignment, contrast, keyboard behavior, and real request waterfalls remain unmeasured.
- Section skeletons follow the current component structure, but desktop and mobile visual verification is still required.
- No backend changes, commits, or pushes were made for this batch. Performance documents remain local.
