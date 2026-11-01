# Rello — Implementation Roadmap

Generated from a gap analysis between `API_DOCS.md` (the actual backend) and
the screens currently built or scaffolded. This document is the source of
truth for what to build next and in what order.

**Status legend**
- 🟢 Built and connected to a real endpoint
- 🟡 Built (UI only) but backend does not support it yet — stub
- 🔴 Not built, backend supports it, needs a screen
- ⚪ Neither built nor backed — future/undecided

---

## 0. Foundational corrections (do first, blocks everything else)

These aren't new features — they're fixes to wrong assumptions baked into
what's already built. Shipping new screens on top of these without fixing
them first will compound the rework later.

- [ ] **Confirm product scope: sale + rental, not rental-only.** The API
      models `FOR_SALE` and `FOR_RENT` as equal citizens. Landing page copy,
      pricing format ("/mo"), and the word "rental" throughout the product
      currently assume rental-only. Decide: fully embrace dual-mode, or
      confirm with backend owner that rental-only is the actual near-term
      scope and sale endpoints are unused for now.
- [ ] **Correct the Tenant role model.** Per the API, Tenants are **buyers**
      (`/api/properties/portfolio` literally labels them this way). The
      current Tenant Dashboard stat strip (Active Bookings, Escrow Held,
      Saved Listings) does not match the real payload shape
      (`totalPropertiesCount`, `totalValueForSale`, `properties[]`). Rework
      before connecting to live data.
- [ ] **Correct the Agent role model.** Agents list `FOR_SALE` properties
      only — not a "matchmaker between tenants and landlords" as originally
      scaffolded. Update Agent dashboard copy/scope before building further.
- [ ] **Confirm whether Admin endpoints exist elsewhere.** `API_DOCS.md`
      contains zero admin routes. Either they exist in an undocumented part
      of the backend, or Admin is not yet a real backend concern. Get a
      straight answer before investing further in the Admin Dashboard.

---

## 1. Auth completeness (highest priority — currently broken end-to-end)

Users can technically register and log in, but the full auth lifecycle the
backend already supports is not implemented. This is the biggest gap
between "looks done" and "is done."

- [ ] 🔴 **Email verification screen** — `POST /api/auth/verify-email`
      (6-digit OTP via query params). Needed immediately after registration;
      currently registered users have no way to activate their account
      through the UI.
- [ ] 🔴 **Forgot password screen** — `POST /api/auth/forgot-password`
- [ ] 🔴 **Reset password screen** — `POST /api/auth/reset-password`
      (consumes OTP + new password)
- [ ] 🔴 **Device fingerprint header wiring** — `X-Device-Fingerprint` is
      required on Register and Login. Confirm this is being generated and
      sent; if not, this is a silent bug in the currently "working" auth
      flow, not just a missing screen.
- [ ] ⚪ **"Change password while logged in" flow** — Settings → Security
      currently has a "Change Password" UI stub. No such endpoint appears in
      `API_DOCS.md` (only the forgot/reset OTP flow exists). Confirm with
      backend whether this endpoint exists elsewhere or whether Settings
      should redirect to the forgot-password flow instead.

---

## 2. Dashboard data correction (fix before connecting real data)

- [ ] 🟡→🟢 **Tenant Dashboard**: rework stat strip and portfolio section to
      consume `GET /api/properties/portfolio` (buyer response shape).
- [ ] 🟡→🟢 **Landlord Dashboard**: rework stat strip to consume
      `GET /api/properties/portfolio` (host response shape — includes
      `expectedMonthlyRentalIncome`, `pendingOffersCount`).
- [ ] 🔴 **Agent Dashboard**: same portfolio endpoint (host-shaped, FOR_SALE
      context) — not yet built at all beyond a stub route.

---

## 3. Property lifecycle (the actual core product loop)

Nothing end-to-end works yet — users can see properties but can't act on
one, and landlords/agents can't get a listing live. This is the single
biggest missing chunk of product.

### Browsing & detail
- [ ] 🟢 Landing page property feed — already connected to
      `GET /api/properties/all` / `/sale` / `/rent`
- [ ] 🔴 **Property detail page** — needs a single-property GET endpoint;
      not present in `API_DOCS.md`. Flag to backend owner — this is likely
      an oversight in the doc, not a missing feature, but must be confirmed
      before building the detail screen.
- [ ] 🔴 **Search / filter screen** — per the Surface Types rule, this is a
      utility surface (compact, scannable, no editorial styling). Not yet
      built.

### Booking & offers
- [ ] 🔴 **Booking flow** (FOR_RENT) — `POST /api/bookings`
- [ ] 🔴 **Offer submission flow** (FOR_SALE) — `POST /api/offers`
- [ ] ⚪ **View my bookings/offers list** — no GET-list endpoint shown for
      either; confirm with backend before designing the Bookings screen.

### Reviews
- [ ] 🔴 **Leave a review** — `POST /api/reviews`, gated on a `COMPLETED`
      booking. UI should handle the 403 case gracefully (explain why the
      review option isn't available yet) rather than just hiding the button
      silently.

---

## 4. Verification systems (blocks landlords/agents from doing anything real)

This is the most underbuilt part of the whole product relative to how much
backend work already exists for it. A landlord literally cannot get a
listing live without going through all of this.

### Identity verification
- [ ] 🔴 **Landlord KYB submission** — `POST /api/verification/kyb`
      (document upload, pending Admin approval)
- [ ] 🔴 **Agent compound verification** — `POST /api/verification/agent`
      (NIN + BVN + selfie liveness in one flow, auto-approved via Smile ID)
- [ ] 🔴 **Standalone NIN verification** — `POST /api/verification/smileid/nin`
- [ ] 🔴 **Standalone BVN verification** — `POST /api/verification/smileid/bvn`
- [ ] 🔴 **Selfie liveness check** — `POST /api/verification/smileid/selfie`

### Property verification (required before a listing goes public)
- [ ] 🔴 **Property ownership document submission** —
      `POST /api/verification/property`
- [ ] 🔴 **Geofenced proof-of-presence check** —
      `POST /api/verification/property/verify` (on-site photo + GPS EXIF)
- [ ] 🔴 **Utility bill OCR verification** —
      `POST /api/verification/property/verify-bill` (AWS Textract,
      auto-approves on address match)

### Payouts
- [ ] 🔴 **Bank payout profile setup** —
      `POST /api/verification/payout/setup` (triggers micro-deposits)
- [ ] 🔴 **Micro-deposit confirmation** —
      `POST /api/verification/payout/confirm`

**Recommendation**: build this as a single guided verification wizard
(KYB → property ownership → geofence or bill OCR → payout setup) rather
than scattered standalone screens. This mirrors how the backend already
chains these steps logically.

---

## 5. Virtual tours (built on backend, zero frontend)

- [ ] 🔴 **Live video tour (Jitsi)** — `POST /api/tours/jitsi/{propertyId}`
      generates room credentials; needs a video call UI (Jitsi embed).
- [ ] 🔴 **Video walkthrough upload** — `POST /api/tours/upload/{propertyId}`
      (Landlord/Agent only, multipart MP4/MOV)
- [ ] 🔴 **Matterport 3D tour link** — `PATCH /api/tours/matterport/{propertyId}`
      (Landlord/Agent only, just a URL field)
- [ ] 🔴 **Tour viewing on property detail page** (Tenant-facing) — display
      embedded video walkthrough and/or Matterport iframe, "Request live
      tour" CTA to trigger Jitsi flow.

---

## 6. Chat (architecturally distinct — needs local storage, not just a screen)

- [ ] 🔴 **Chat UI** — `POST /api/chat/send`, `GET /api/chat/receive`,
      `GET /api/chat/pending`
- [ ] 🔴 **Local persistence layer** — the backend is explicitly
      zero-storage (messages are wiped from server RAM the moment they're
      fetched). The frontend **must** persist conversation history locally:
      IndexedDB on web, SQLite/Hive/Realm equivalent on mobile. This is a
      genuine architectural task, not just a chat bubble UI — treat it as
      its own sub-project.
- [ ] ⚪ **Polling or push strategy** — decide how the client checks
      `/api/chat/pending` (interval polling vs. some push mechanism the
      backend may or may not support — not documented, confirm with
      backend owner).

---

## 7. Stub features — no backend yet, keep clearly marked

Per the "mixed" approach: these stay as visible "Coming soon" stubs in the
UI rather than being ripped out, since they've already been designed and
may get backend support later.

- [ ] 🟡 Tenant: **Escrow** page/stat
- [ ] 🟡 Tenant: **Disputes** page
- [ ] 🟡 Tenant: **Ratings** (viewing own given/received ratings beyond
      raw Reviews)
- [ ] 🟡 Tenant: **Saved Listings** (wishlist)
- [ ] 🟡 Landlord: **Strikes** page
- [ ] 🟡 Landlord: **Requests** (may just need remapping to pending
      bookings rather than being a truly separate feature — confirm)
- [ ] 🟡 **Notifications** (bell icon currently in dashboard headers) — no
      general notification endpoint exists, only chat-specific pending count
- [ ] ⚪ **Admin Dashboard** (entire surface) — no backend support found in
      `API_DOCS.md` at all

---

## Suggested build order

1. Foundational corrections (Section 0) — cheap, prevents rework
2. Auth completeness (Section 1) — currently broken, high user impact
3. Dashboard data correction (Section 2) — makes existing screens actually
   truthful
4. Property lifecycle (Section 3) — this is the core product; nothing else
   matters if this doesn't work
5. Verification wizard (Section 4) — blocks landlords/agents from doing
   anything real, but only matters once property lifecycle works
6. Virtual tours (Section 5) — enhances property detail, not blocking
7. Chat (Section 6) — genuinely complex (local storage architecture),
   budget real time for it
8. Stubs (Section 7) — revisit once backend adds support, or decide to cut

---

## Open questions to resolve with backend owner

- Does a single-property `GET /api/properties/{id}` endpoint exist?
- Does a "my bookings" / "my offers" list endpoint exist for either role?
- Does an admin API surface exist anywhere outside this doc?
- Does a "change password while authenticated" endpoint exist, or does
  Settings need to route through the forgot-password OTP flow instead?
- What's the intended polling/push strategy for chat's pending queue?
- Is "Requests" on the Landlord dashboard meant to be its own concept, or
  just filtered/pending bookings?
