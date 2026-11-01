# Rello Software Requirements Specification

## Document control

| Field | Value |
| --- | --- |
| Product | Rello |
| Document | Software Requirements Specification |
| Version | 0.2 |
| Status | Revised draft for stakeholder review |
| Date | 30 August 2026 |
| Intended audience | Product, engineering, design, quality assurance, operations, security, compliance, and business stakeholders |
| Requirement baseline | Current frontend, Keyz REST API reference, Rello roadmap, Rello design system, and requirements quality review |

### Revision history

| Version | Date | Summary |
| --- | --- | --- |
| 0.1 | 30 August 2026 | Initial comprehensive draft |
| 0.2 | 30 August 2026 | Requirements-quality revision: atomicity, normative references, verification methods, measurable NFRs, canonical rules, retention schedule, and ID migration |

## 1. Purpose

This Software Requirements Specification defines the target functional and non-functional requirements for Rello, a Nigerian property marketplace supporting property rentals and sales. It is intended to become the shared baseline for product design, engineering implementation, testing, security review, operational readiness, and stakeholder acceptance.

This document describes the required production system. A requirement does not imply that the capability is already implemented.

## 2. Product scope

Rello shall provide a trusted marketplace in which:

- Tenants can discover verified properties, book rental properties, submit purchase offers, communicate with hosts, attend virtual tours, and manage their property activity.
- Landlords can create and manage rental listings, complete identity and property verification, manage rental bookings, communicate with tenants, and configure payout details.
- Agents can create and manage sale listings, complete identity and property verification, manage purchase offers, communicate with prospective buyers, and configure payout details.
- Administrators can oversee users, verifications, listings, marketplace risk, disputes, reviews, and operational reporting when the required administration services are available.
- Visitors can browse verified listings, review public property information, register, authenticate, and join the waitlist.

The target scope includes both properties for rent and properties for sale. The exact commercial release sequence for these two modes remains a stakeholder decision.

## 3. Requirement conventions

### 3.1 Priority

| Code | Meaning |
| --- | --- |
| Must | Required for the defined production capability or for legal, security, or data integrity reasons |
| Should | Important for usability, operational quality, or a complete customer journey |
| Could | Valuable enhancement that may be deferred without invalidating the core workflow |

### 3.2 Basis

| Code | Meaning |
| --- | --- |
| API | Supported or described by the current Keyz REST API reference |
| UI | Represented in the current Rello frontend |
| Product | Defined by the roadmap or product design direction |
| Proposed | Required for a complete production product but not confirmed by a current backend contract |
| TBD | Policy, integration, or business decision requiring stakeholder confirmation |

### 3.3 Verification rule

Every requirement has an explicit verification method. The methods are:

| Code | Method | Required evidence |
| --- | --- | --- |
| AT | Acceptance test | A controlled end-to-end or integration test with recorded expected and actual results |
| UT | Automated test | A repeatable unit, component, contract, security, accessibility, or integration test in continuous integration |
| IN | Inspection | A documented review of configuration, interface, source, policy, report, or generated artifact |
| AN | Analysis | A documented calculation, model, bundle analysis, threat analysis, or capacity analysis |
| DM | Demonstration | A controlled operational exercise such as recovery, failover, alerting, or assistive-technology use |
| MT | Measurement | Recorded production or production-like telemetry evaluated against a numeric threshold |

A requirement is accepted only when all stated methods pass and the evidence is linked to the requirement ID. Stakeholder approval may accept policy or scope, but it does not replace technical verification.

### 3.4 Glossary

| Term | Normative definition |
| --- | --- |
| Accessible listing | A listing the requesting actor is authorized to retrieve under BR-003 through BR-005 |
| Actionable listing | An accessible listing that is in Published state and is not Withdrawn, Unavailable, Rejected, or Duplicate-flagged |
| Authoritative service | The backend service designated as the source of truth for the referenced record and state transition |
| Completed booking | A booking whose authoritative status is COMPLETED |
| Eligible host | An authenticated Landlord or Agent whose role, account, identity, and payout restrictions permit the stated action under POL-VER-001 |
| Eligible rental property | An actionable listing with FOR_RENT status and availability for the requested period |
| Eligible sale property | An actionable listing with FOR_SALE status that is accepting offers |
| High-risk action | An action listed in POL-RSK-001 as requiring step-up authentication, additional approval, or both |
| Material change | A field change listed in POL-VER-001 as invalidating or reopening a verification decision |
| Normal load | The request mix and concurrency defined in CAP-001 at 70 percent of approved launch capacity |
| Public-address precision | The location fields and geographic precision permitted by POL-ADR-001 |
| Recent authentication | Authentication completed within the maximum age defined in POL-SEC-001 |
| Sensitive data | Data classified as Restricted or Confidential by POL-PRV-001 |
| Transaction-primary action | The single visually dominant action that initiates a booking on a rental listing or an offer on a sale listing |

### 3.5 Normative references and policy register

Requirements may reference the following controlled documents. A reference with Draft or TBD status is a release dependency, not an optional implementation condition. The release gate in Section 14 prevents the affected capability from launching until the reference is approved and versioned.

| Reference | Document or register | Status in v0.2 |
| --- | --- | --- |
| CAP-001 | Launch capacity and representative workload profile | TBD |
| ENV-PERF-001 | Performance test environment and network profile | TBD |
| POL-ACC-001 | Account linking, deactivation, deletion, and reactivation policy | TBD |
| POL-ADR-001 | Public property address and coordinate precision policy | TBD |
| POL-CNT-001 | Marketplace content, claims, and moderation policy | TBD |
| POL-DSP-001 | Dispute eligibility, evidence, deadlines, decisions, and appeal policy | TBD |
| POL-MSG-001 | Messaging privacy, retention, device, delivery, and moderation policy | TBD |
| POL-NOT-001 | Notification event, channel, escalation, and retention policy | TBD |
| POL-PAY-001 | Payment, fee, refund, escrow, release, settlement, and payout policy | TBD |
| POL-PRV-001 | Privacy, consent, data classification, and data-rights policy | TBD |
| POL-RET-001 | Records retention and deletion schedule | TBD |
| POL-RSK-001 | Marketplace risk, administrative authority, and dual-approval policy | TBD |
| POL-SEC-001 | Password, session, OTP, step-up authentication, and secrets policy | TBD |
| POL-VER-001 | Identity, property, payout, expiry, resubmission, and manual-review policy | TBD |
| REG-MKT-001 | Approved marketing claims and authoritative evidence register | TBD |

### 3.6 Atomicity and interpretation rules

- Each numbered requirement defines one independently verifiable outcome.
- A list inside one requirement is a closed set of values or test parameters, not a collection of optional outcomes.
- “Shall” is mandatory within the approved release scope. “Should” and “Could” appear only in Priority, not as normative verbs.
- Basis records the source or rationale. Proposed does not weaken a Must priority.
- Missing APIs, policies, or provider contracts are delivery blockers recorded in Sections 13 and 14. They do not make target behavior conditional.
- Business rules in Section 9 are canonical. Functional requirements reference those rules instead of restating them.

## 4. Users and external actors

| Actor | Description |
| --- | --- |
| Visitor | An unauthenticated person using public Rello surfaces |
| Tenant | A registered user seeking a rental property or purchasing a property |
| Landlord | A registered host permitted to list properties for rent |
| Agent | A registered host permitted to list properties for sale |
| Administrator | An authorized operations or compliance user |
| Support operator | A staff member assisting users without unrestricted administrative authority |
| Identity provider | Dojah or an approved replacement used for NIN, BVN, and liveness checks |
| Storage provider | Approved object storage used for property media and verification documents |
| OCR provider | AWS Textract or an approved replacement used for utility bill processing |
| Video provider | Jitsi JaaS or an approved replacement used for live virtual tours |
| 3D tour provider | Matterport or an approved replacement used for embedded property tours |
| Email provider | The approved service used for verification and password recovery messages |
| Analytics provider | The approved privacy-reviewed product analytics service |
| Waitlist service | The external service receiving public waitlist submissions |

## 5. Assumptions and dependencies

- Rello operates primarily in Nigeria and displays monetary values in Nigerian naira unless a future localization requirement states otherwise.
- Each account has one primary role: Tenant, Landlord, Agent, or Administrator.
- Landlords create rental listings. Agents create sale listings.
- Public search results contain only listings approved for publication.
- Backend services enforce authorization independently of client-side navigation guards.
- Verification, payment, escrow, dispute, and privacy policies require business and legal approval before production release.
- External providers may be replaced if the replacement satisfies the same functional, security, privacy, and service-level requirements.
- The current backend is named Keyz in technical references. Rello is the user-facing product name. Naming shall be normalized before release.

# 6. Functional requirements

## 6.1 Public marketplace and waitlist

| ID | Requirement | Priority | Basis | Verification |
| --- | --- | --- | --- | --- |
| FR-PUB-001 | The system shall provide a public landing page that communicates Rello's rental, sale, verification, contact, and trust propositions without requiring authentication. | Must | UI, Product | AT |
| FR-PUB-002 | The system shall allow visitors to browse public verified listings and distinguish properties for rent from properties for sale. | Must | API, UI | AT |
| FR-PUB-003 | The system shall provide navigation to registration, login, property discovery, and waitlist entry points. | Must | UI | AT |
| FR-PUB-004 | Each public listing count, service location, fee, response-time claim, and trust claim shall match its current entry in REG-MKT-001. | Must | Product | AT |
| FR-PUB-005 | The waitlist form shall collect first name, last name, email address, and city. | Should | API, UI | AT |
| FR-PUB-006 | The waitlist form shall reject a submission containing an empty required field or an invalid email address. | Must | UI | AT |
| FR-PUB-007 | The system shall store marketing consent with purpose, privacy-notice version, decision, and timestamp under POL-PRV-001. | Must | Proposed | AT |
| FR-PUB-008 | Every public page shall link to the current terms of use, privacy notice, support channel, and contact channel. | Must | Proposed | AT |
| FR-PUB-009 | The waitlist form shall disable its submit action while one submission is in flight. | Must | UI | AT |
| FR-PUB-010 | A successful waitlist submission shall display a Success state and clear the submitted fields. | Must | UI | AT |
| FR-PUB-011 | A failed waitlist submission shall display an Error state with a Retry action and shall retain the submitted fields. | Must | UI | AT |
| FR-PUB-012 | Public pages shall not display a placeholder marketing claim as a measured fact. | Must | Product | AT |

## 6.2 Registration, authentication, and account access

| ID | Requirement | Priority | Basis | Verification |
| --- | --- | --- | --- | --- |
| FR-AUTH-001 | The system shall allow a visitor to register as a Tenant, Landlord, or Agent using first name, last name, email address, password, and role. | Must | API, UI | AT |
| FR-AUTH-002 | The system shall validate registration input on both client and server and return field-specific feedback without exposing sensitive implementation details. | Must | API, UI | AT |
| FR-AUTH-003 | The authentication service shall normalize an email address and enforce uniqueness under POL-ACC-001. | Must | Proposed | AT |
| FR-AUTH-004 | Registration and password-change interfaces shall display and enforce every password rule in POL-SEC-001 before submission. | Must | API, UI | AT |
| FR-AUTH-005 | The system shall send an email verification code after successful registration. | Must | API | AT |
| FR-AUTH-006 | The system shall allow a user to verify an email address using a six-digit code and shall handle invalid, expired, and already-used codes. | Must | API, UI | AT |
| FR-AUTH-007 | An account with an unverified email address shall be able to request a replacement email-verification code subject to POL-SEC-001. | Should | Proposed | AT |
| FR-AUTH-008 | The system shall allow a registered user to authenticate using email address and password. | Must | API, UI | AT |
| FR-AUTH-009 | Registration and login requests shall include a random first-party installation identifier that contains no browser, hardware, biometric, or behavioral fingerprint attributes. | Must | API, Proposed | AT |
| FR-AUTH-010 | After authentication, the system shall route the user to the correct role-specific home page. | Must | UI | AT |
| FR-AUTH-011 | The system shall reject access to protected capabilities when the user is unauthenticated, the session is expired, or the role lacks permission. | Must | API, UI | AT |
| FR-AUTH-012 | The system shall allow a user to request password recovery without revealing whether the submitted email address exists. | Must | API, UI | AT |
| FR-AUTH-013 | The system shall allow a user to reset a password with a valid recovery code and a compliant new password. | Must | API, UI | AT |
| FR-AUTH-014 | A recovery code shall become invalid immediately after successful use and at the expiry time defined in POL-SEC-001. | Must | Proposed | AT |
| FR-AUTH-015 | Signing out shall invalidate the current server session. | Must | UI, Proposed | AT |
| FR-AUTH-021 | Signing out shall remove the current session credential from the client. | Must | UI | AT |
| FR-AUTH-016 | The server shall reject an expired session, and the client shall preserve only non-sensitive recoverable work before routing to login. | Must | Proposed | AT |
| FR-AUTH-017 | An authenticated user shall be able to change the account password after completing recent authentication. | Should | UI, Proposed | AT |
| FR-AUTH-018 | An authenticated user shall be able to view and terminate active sessions. | Should | UI, Proposed | AT |
| FR-AUTH-019 | The system shall not allow public self-registration for the Administrator role. | Must | Proposed | AT |
| FR-AUTH-020 | Every high-risk account change shall require the step-up control defined in POL-SEC-001. | Must | Proposed | AT |

## 6.3 User profile and account lifecycle

| ID | Requirement | Priority | Basis | Verification |
| --- | --- | --- | --- | --- |
| FR-PRO-001 | The system shall retrieve and display the authenticated user's profile, role, verification state, and account creation information. | Must | API, UI | AT |
| FR-PRO-002 | A user shall only retrieve private profile information permitted by the access-control policy. | Must | API | AT |
| FR-PRO-003 | Every profile field shall render as Editable, Immutable, or Verification controlled; the latter two states shall use a disabled control and an explanatory label. | Should | UI, Proposed | AT |
| FR-PRO-004 | A material identity or payout field change shall reopen verification under POL-VER-001. | Must | Proposed | AT |
| FR-PRO-005 | A user shall be able to request account deactivation, and the system shall apply POL-ACC-001 to retention and reactivation. | Should | UI, Proposed | AT |
| FR-PRO-006 | The system shall allow a user to request account deletion and shall explain data that must be retained for legal, fraud, transaction, or dispute purposes. | Must | UI, Proposed | AT |
| FR-PRO-007 | A user shall be able to request an export of personal and transaction data under POL-PRV-001. | Should | Proposed | AT |
| FR-PRO-008 | Account suspension shall not delete a record retained by POL-RET-001. | Must | Proposed | AT |

## 6.4 Property discovery and search

| ID | Requirement | Priority | Basis | Verification |
| --- | --- | --- | --- | --- |
| FR-DIS-001 | The system shall retrieve public verified properties without requiring authentication. | Must | API | AT |
| FR-DIS-002 | The system shall allow users to view all properties, rental properties, or sale properties. | Must | API, UI | AT |
| FR-DIS-003 | Property search shall accept city, area, or address-keyword input. | Must | UI, Proposed | AT |
| FR-DIS-004 | Property discovery shall provide filters for transaction type, minimum price, maximum price, bedrooms, bathrooms, property type, verification state, and amenity. | Should | UI, Proposed | AT |
| FR-DIS-005 | The system shall support deterministic sorting by relevance, newest, price ascending, and price descending. | Should | Proposed | AT |
| FR-DIS-006 | The system shall preserve active search criteria while a user navigates between results and property details. | Should | Proposed | AT |
| FR-DIS-007 | Search results shall show the listing image, title, location, price and price period, rental or sale status, room summary, and verified state. | Must | UI, Product | AT |
| FR-DIS-008 | The system shall never show an unverified, rejected, disabled, duplicate-flagged, or withdrawn listing in public results. | Must | API | AT |
| FR-DIS-009 | Property discovery shall display one named state from Loading, Empty, Error, or Partial; Error and Partial states shall include a Retry action. | Must | Product | AT |
| FR-DIS-010 | Property discovery shall paginate or incrementally load results without duplicate or omitted listing identifiers. | Should | Proposed | AT |
| FR-DIS-011 | Property discovery shall provide a map view for listings whose public coordinates satisfy POL-ADR-001. | Could | UI, Proposed | AT |
| FR-DIS-012 | Public discovery shall not expose exact coordinates or street-level address fields prohibited by POL-ADR-001. | Must | Proposed | AT |

## 6.5 Property detail and inquiry

| ID | Requirement | Priority | Basis | Verification |
| --- | --- | --- | --- | --- |
| FR-DET-001 | The system shall provide a stable property detail route for each accessible listing. | Must | UI, Proposed | AT |
| FR-DET-002 | The property detail shall display the listing title. | Must | API, UI | AT |
| FR-DET-003 | The property detail shall display the listing description. | Must | API, UI | AT |
| FR-DET-004 | The property detail shall display location at the precision permitted by POL-ADR-001. | Must | API, Proposed | AT |
| FR-DET-005 | The property detail shall display price and FOR_RENT or FOR_SALE status. | Must | API, UI | AT |
| FR-DET-006 | The property detail shall display the bedroom count. | Must | API, UI | AT |
| FR-DET-007 | The property detail shall display the bathroom count. | Must | API, UI | AT |
| FR-DET-008 | The property detail shall display property size with its unit. | Must | API, UI | AT |
| FR-DET-009 | The property detail shall display every public property image returned by the authoritative service. | Must | API, UI | AT |
| FR-DET-010 | The property detail shall display every amenity returned by the authoritative service. | Should | UI, Proposed | AT |
| FR-DET-011 | The property detail shall render a verified badge only when the authoritative verification state is APPROVED, as required by BR-012. | Must | Product | AT |
| FR-DET-012 | The property detail shall display the public host summary returned by the authoritative service. | Must | API, UI | AT |
| FR-DET-013 | The property detail shall display each available walkthrough, 3D tour, or live-tour option. | Should | API, UI | AT |
| FR-DET-014 | The image gallery shall support keyboard navigation, descriptive alternatives, current-position text, and an operable close control. | Should | UI | AT |
| FR-DET-015 | A rental property detail shall display Book as its transaction-primary action. | Must | API, Product | AT |
| FR-DET-016 | A sale property detail shall display Make Offer as its transaction-primary action. | Must | API, Product | AT |
| FR-DET-017 | An authenticated user shall be able to start a property-linked conversation with the listing host. | Must | API, UI | AT |
| FR-DET-018 | An authenticated user shall be able to request or join a live tour offered for the property. | Should | API | AT |
| FR-DET-019 | The system shall disable transaction actions for every listing state prohibited by BR-004 and shall display the authoritative listing state. | Must | Proposed | AT |
| FR-DET-020 | The system shall display a Not Found state when the requested identifier does not resolve to an accessible listing. | Must | UI | AT |

## 6.6 Host listing creation and management

| ID | Requirement | Priority | Basis | Verification |
| --- | --- | --- | --- | --- |
| FR-LST-001 | The system shall permit listing creation only for an eligible host. | Must | API | AT |
| FR-LST-002 | The system shall enforce BR-001 for every Landlord listing submission. | Must | API | AT |
| FR-LST-003 | The system shall enforce BR-002 for every Agent listing submission. | Must | API | AT |
| FR-LST-004 | The listing workflow shall collect a title. | Must | API, UI | AT |
| FR-LST-005 | The listing workflow shall collect a description. | Must | API, UI | AT |
| FR-LST-006 | The listing workflow shall collect an address. | Must | API, UI | AT |
| FR-LST-007 | The listing workflow shall collect a price greater than zero. | Must | API, UI | AT |
| FR-LST-008 | The listing workflow shall collect a non-negative integer bedroom count. | Must | API, UI | AT |
| FR-LST-009 | The listing workflow shall collect a non-negative integer bathroom count. | Must | API, UI | AT |
| FR-LST-010 | The listing workflow shall collect a property size greater than zero and its unit. | Must | API, UI | AT |
| FR-LST-011 | The listing workflow shall derive transaction status from the authenticated host role under BR-001 and BR-002. | Must | API, UI | AT |
| FR-LST-012 | The listing workflow shall derive seller identity from the authenticated session. | Must | API, UI | AT |
| FR-LST-013 | The listing workflow shall collect one property type from the product taxonomy. | Should | UI, Proposed | AT |
| FR-LST-014 | The listing workflow shall allow selection of zero or more amenities from the product taxonomy. | Should | UI, Proposed | AT |
| FR-LST-015 | The listing workflow shall collect structured city and area values used by property discovery. | Should | UI, Proposed | AT |
| FR-LST-016 | The system shall reject a listing field that violates its required state, type, range, role rule, or format. | Must | UI, API | AT |
| FR-LST-017 | A host shall be able to save an incomplete listing as a draft. | Should | UI | AT |
| FR-LST-018 | A host shall be able to resume an owned draft without losing previously saved fields. | Should | UI | AT |
| FR-LST-019 | A draft view shall display completion as the percentage of required fields that currently pass validation. | Should | UI | AT |
| FR-LST-020 | A draft view shall identify the first incomplete required field as the next action. | Should | UI | AT |
| FR-LST-021 | A newly created listing shall remain non-public until BR-003 is satisfied. | Must | API | AT |
| FR-LST-022 | The listing owner shall be able to upload image formats enumerated by POL-CNT-001. | Must | API, UI | AT |
| FR-LST-023 | The image uploader shall display bytes uploaded and total bytes while an upload is active. | Must | UI | AT |
| FR-LST-024 | The image uploader shall display a retry action after an upload failure. | Must | UI | AT |
| FR-LST-025 | The media service shall preserve the display orientation of an accepted image. | Must | Proposed | AT |
| FR-LST-026 | The media service shall remove metadata classified as Restricted by POL-PRV-001 after required geofence extraction. | Must | Proposed | AT |
| FR-LST-027 | The system shall prevent publication after the authoritative service flags a property image as duplicate or stolen. | Must | API | AT |
| FR-LST-028 | A host shall be able to review all entered listing fields before final submission. | Must | UI | AT |
| FR-LST-029 | The host listing view shall display the authoritative lifecycle state from this closed set: Draft, Pending verification, Verified, Published, Rejected, Duplicate-flagged, Withdrawn, or Unavailable. | Must | API, Product | AT |
| FR-LST-030 | A host listing collection shall return only listings owned or managed by that host, except when a server-authorized delegation grants access. | Must | Proposed | AT |
| FR-LST-031 | An owner shall be able to edit a listing whose authoritative state permits editing. | Should | Proposed | AT |
| FR-LST-032 | Editing a material field shall reopen verification according to POL-VER-001. | Must | Proposed | AT |
| FR-LST-033 | An owner shall be able to withdraw an eligible listing from public discovery. | Should | Proposed | AT |
| FR-LST-034 | Archiving a listing shall preserve its transaction and status history. | Must | Proposed | AT |
| FR-LST-035 | The system shall reject deletion or destructive editing while a listing has an active booking, offer, escrow, investigation, or dispute. | Must | Proposed | AT |
| FR-LST-036 | A rejected or flagged listing shall display the reason code returned by the authoritative service. | Must | Proposed | AT |
| FR-LST-037 | A rejected or flagged listing shall display the remediation action mapped to its reason code in POL-CNT-001. | Must | Proposed | AT |
| FR-LST-038 | A listing shall support multiple property images. | Should | UI, Proposed | AT |
| FR-LST-039 | A listing owner shall be able to designate exactly one uploaded image as the cover image. | Should | UI, Proposed | AT |

## 6.7 Identity, business, property, and payout verification

| ID | Requirement | Priority | Basis | Verification |
| --- | --- | --- | --- | --- |
| FR-VER-001 | The system shall maintain separate verification states for identity, business or role, property, and payout eligibility. | Must | API, UI | AT |
| FR-VER-002 | The system shall show the user each required verification step, its status, and the effect of not completing it. | Must | UI | AT |
| FR-VER-003 | The system shall block listing publication until BR-003 is satisfied. | Must | API | AT |
| FR-VER-004 | A Landlord shall be able to submit each identity or business document type enumerated in POL-VER-001 for KYB review. | Must | API | AT |
| FR-VER-005 | The Landlord KYB flow shall display the authoritative state from this closed set: Pending, Approved, Rejected, Expired, or Resubmission required. | Must | Product | AT |
| FR-VER-006 | An Agent shall be able to submit NIN, BVN, a live selfie, and optional location data through the compound verification flow. | Must | API | AT |
| FR-VER-007 | The system shall validate NIN and BVN as eleven-digit values before sending them to the verification provider. | Must | API | AT |
| FR-VER-008 | The selfie interface shall accept only image formats and size limits defined in POL-VER-001, and camera permission shall be requested only after the user activates Capture. | Must | API, UI | AT |
| FR-VER-009 | The system shall provide standalone NIN, BVN, and selfie verification operations. | Should | API | AT |
| FR-VER-010 | A verification result shall display one authoritative state from Verified, Pending, Failed, Rejected, or Unavailable; Failed and Unavailable states shall display a Retry or Manual review action. | Must | API, Product | AT |
| FR-VER-011 | The system shall not display full NIN, BVN, bank account, or identity-document values after initial collection. | Must | Proposed | AT |
| FR-VER-012 | A Landlord or Agent shall be able to submit proof of ownership for a property controlled by that user. | Must | API | AT |
| FR-VER-013 | The system shall support proof-of-presence verification using a live property image with qualifying GPS metadata. | Must | API | AT |
| FR-VER-014 | The system shall explain that proof-of-presence must be captured near the property and that location access is limited to the verification purpose. | Must | Proposed | AT |
| FR-VER-015 | The system shall set geofence verification to Approved only after the authoritative service confirms a distance within the trust radius in POL-VER-001. | Must | API | AT |
| FR-VER-016 | Utility-bill OCR shall use the name and address thresholds defined in POL-VER-001. | Must | API | AT |
| FR-VER-017 | OCR and geofence interfaces shall render an Approved state only when BR-012 is satisfied. | Must | API | AT |
| FR-VER-018 | The system shall allow an eligible host to configure a bank payout account using bank code, account number, and account name. | Must | API | AT |
| FR-VER-019 | The system shall display the bank account name returned by the payment provider and require user confirmation before payout verification begins. | Must | Proposed | AT |
| FR-VER-020 | The system shall allow a user to confirm two micro-deposit amounts in either order. | Must | API | AT |
| FR-VER-021 | The system shall reject a micro-deposit confirmation after the attempt limit in POL-VER-001 and shall display the recovery action defined by that policy. | Must | Proposed | AT |
| FR-VER-022 | The system shall prevent payout activation until the backend confirms the payout profile as verified. | Must | API | AT |
| FR-VER-023 | The system shall preserve a verification audit trail containing status transitions, provider references, timestamps, and authorized reviewer actions. | Must | Proposed | AT |
| FR-VER-024 | An Inconclusive or Provider unavailable result shall offer the manual-review submission defined in POL-VER-001. | Should | Proposed | AT |
| FR-VER-025 | The system shall reopen verification when its expiry time passes or a material change listed in POL-VER-001 occurs. | Must | Proposed | AT |

## 6.8 Rental bookings and purchase offers

| ID | Requirement | Priority | Basis | Verification |
| --- | --- | --- | --- | --- |
| FR-TRX-001 | An authenticated Tenant shall be able to submit a booking request for an available verified rental property. | Must | API | AT |
| FR-TRX-002 | A booking request shall include the property, start date, end date, and authenticated buyer identity required by the backend. | Must | API | AT |
| FR-TRX-003 | The system shall reject invalid date ranges, unavailable periods, unverified properties, and conflicting bookings with an actionable explanation. | Must | API, Proposed | AT |
| FR-TRX-004 | Before booking confirmation, the system shall display the total booking price and each charge defined in POL-PAY-001. | Must | API, Proposed | AT |
| FR-TRX-005 | A Tenant shall be able to view each owned booking request with property, date range, price, current status, and status timestamp. | Must | Product | AT |
| FR-TRX-006 | A Landlord shall be able to view booking requests for owned rental listings. | Must | Product | AT |
| FR-TRX-007 | The booking service shall enforce the status-transition, cancellation, refund, and expiry rules in POL-PAY-001. | Must | Proposed | AT |
| FR-TRX-008 | An authenticated Tenant shall be able to submit a purchase offer for an available verified sale property. | Must | API | AT |
| FR-TRX-009 | An offer shall include the property, offered amount, and authenticated buyer identity required by the backend. | Must | API | AT |
| FR-TRX-010 | The offer service shall reject an offer amount that is not greater than zero or falls outside a limit defined in POL-PAY-001. | Must | API, Proposed | AT |
| FR-TRX-011 | A Tenant shall be able to view each owned offer with property, amount, current status, and status timestamp. | Must | Product | AT |
| FR-TRX-012 | An Agent shall be able to view pending offers for owned sale listings. | Must | Product | AT |
| FR-TRX-017 | An Agent shall be able to accept a pending offer for an owned sale listing. | Must | Product | AT |
| FR-TRX-018 | An Agent shall be able to reject a pending offer for an owned sale listing. | Must | Product | AT |
| FR-TRX-019 | An Agent shall be able to submit a counteroffer for a pending offer on an owned sale listing. | Should | Product | AT |
| FR-TRX-013 | The system shall prevent an offer or booking from being submitted twice because of repeated input, refresh, or network retry. | Must | Proposed | AT |
| FR-TRX-014 | The system shall record immutable transaction status history and identify the authorized actor responsible for each state change. | Must | Proposed | AT |
| FR-TRX-015 | The notification service shall create an event for each booking or offer status transition listed in POL-NOT-001. | Should | Proposed | AT |
| FR-TRX-016 | The system shall display final transaction terms and require explicit confirmation before a binding action. | Must | Proposed | AT |

## 6.9 Escrow, payment, and payout

This domain is visible in the frontend but lacks a confirmed escrow or payment API contract.

| ID | Requirement | Priority | Basis | Verification |
| --- | --- | --- | --- | --- |
| FR-PAY-001 | The system shall send payment authorization to the provider selected in POL-PAY-001 and shall not collect or store raw card credentials on Rello servers. | Must | Proposed | AT |
| FR-PAY-002 | Before payment authorization, the system shall display amount, currency, each fee, recipient, property, transaction reference, and the refund rule identifier from POL-PAY-001. | Must | Proposed | AT |
| FR-PAY-003 | The system shall create a unique, idempotent payment intent for each payable transaction. | Must | Proposed | AT |
| FR-PAY-004 | The system shall display the authoritative payment or escrow state from the state machine in POL-PAY-001. | Must | Proposed | AT |
| FR-PAY-005 | The payment service shall execute escrow release only after the authoritative escrow service returns Release authorized under BR-010. | Must | Proposed | AT |
| FR-PAY-006 | A user shall be able to view transaction references, amounts, fees, timestamps, and status history for authorized payments. | Must | Proposed | AT |
| FR-PAY-007 | The system shall prevent payout to an unverified payout profile. | Must | API, Proposed | AT |
| FR-PAY-008 | Payment provider callbacks shall be authenticated, idempotently processed, and reconciled with internal transaction records. | Must | Proposed | AT |
| FR-PAY-009 | Failed, delayed, reversed, or ambiguous payment states shall not be presented as successful. | Must | Proposed | AT |


## 6.10 Portfolio and role dashboards

| ID | Requirement | Priority | Basis | Verification |
| --- | --- | --- | --- | --- |
| FR-DAS-001 | The system shall provide a role-specific authenticated dashboard. | Must | UI | AT |
| FR-DAS-002 | The Tenant dashboard shall display the Tenant's purchased-property portfolio returned by the authoritative portfolio service. | Must | API, Product | AT |
| FR-DAS-003 | The Tenant dashboard shall link to the Tenant's booking collection. | Must | Product | AT |
| FR-DAS-004 | The Tenant dashboard shall link to the Tenant's offer collection. | Must | Product | AT |
| FR-DAS-005 | The Tenant dashboard shall link to incomplete verification steps. | Must | UI | AT |
| FR-DAS-006 | The Tenant dashboard shall link to the Tenant's conversation collection. | Must | UI | AT |
| FR-DAS-007 | The Landlord dashboard shall display owned rental listings. | Must | API, UI | AT |
| FR-DAS-008 | The Landlord dashboard shall display activeListingsCount from the authoritative portfolio response. | Must | API, UI | AT |
| FR-DAS-009 | The Landlord dashboard shall display expectedMonthlyRentalIncome from the authoritative portfolio response in Nigerian naira. | Must | API, UI | AT |
| FR-DAS-010 | The Landlord dashboard shall display pending rental-booking requests. | Must | Product | AT |
| FR-DAS-011 | The Landlord dashboard shall link to incomplete verification steps. | Must | UI | AT |
| FR-DAS-012 | The Agent dashboard shall display managed sale listings. | Must | API, Product | AT |
| FR-DAS-013 | The Agent dashboard shall display totalValueForSale from the authoritative portfolio response in Nigerian naira. | Must | API, Product | AT |
| FR-DAS-014 | The Agent dashboard shall display pendingOffersCount from the authoritative portfolio response. | Must | API, Product | AT |
| FR-DAS-015 | The Agent dashboard shall link to incomplete verification steps. | Must | UI | AT |
| FR-DAS-016 | Every dashboard metric shall display a source timestamp returned by the authoritative service or the client retrieval timestamp. | Must | Product | AT |
| FR-DAS-017 | A failed dashboard module shall display an Error state, a user-facing message, and a Retry action. | Must | Product | AT |
| FR-DAS-018 | A dashboard module with no records shall display an Empty state and the action that can create the first record. | Must | Product | AT |
| FR-DAS-019 | A dashboard module shall display a Loading state until its first success or failure response. | Must | Product | AT |
| FR-DAS-020 | The system shall label delayed or partial dashboard data as Delayed or Partial. | Must | Product | AT |
| FR-DAS-021 | The system shall not label placeholder or estimated values as live financial or operational data. | Must | Product | AT |
| FR-DAS-022 | Dashboard data shall be isolated by authenticated account and role. | Must | API | AT |
| FR-DAS-023 | The dashboard shall display incomplete actions in the fixed order defined by POL-VER-001, followed by transaction actions and profile actions. | Should | UI, Proposed | AT |
| FR-DAS-024 | The system shall preserve sidebar display preference without storing Restricted data. | Could | UI | AT |

## 6.11 Messaging

| ID | Requirement | Priority | Basis | Verification |
| --- | --- | --- | --- | --- |
| FR-MSG-001 | An authenticated user shall be able to start a property-linked conversation with the host of an actionable listing. | Must | API, UI | AT |
| FR-MSG-002 | The system shall send a message to its specified recipient through the marketplace relay and store the referenced property identifier in the local conversation. | Must | API | AT |
| FR-MSG-003 | The client shall persist every successfully retrieved pending message to the local store designated by POL-MSG-001 before confirming consumption. | Must | API, UI | AT |
| FR-MSG-004 | The client shall acknowledge relay-message consumption only after the local persistence transaction commits. | Must | Proposed | AT |
| FR-MSG-005 | The system shall retrieve and display the pending message count. | Must | API | AT |
| FR-MSG-006 | The system shall display conversation participants, message direction, timestamps, delivery state, and property context. | Must | UI | AT |
| FR-MSG-007 | The system shall prevent duplicate local messages when the same relay response is processed more than once. | Must | Proposed | AT |
| FR-MSG-008 | The system shall preserve message ordering despite clock differences and delayed delivery. | Must | Proposed | AT |
| FR-MSG-009 | The system shall communicate sent, pending, failed, and delivered states without claiming read receipt support unless the backend provides it. | Must | API, UI | AT |
| FR-MSG-010 | The system shall allow the user to retry a failed outbound message without creating duplicate delivered messages. | Must | Proposed | AT |
| FR-MSG-011 | The messaging interface shall display the data-loss and multi-device behavior defined in POL-MSG-001 before local conversation storage is enabled. | Must | Proposed | AT |
| FR-MSG-012 | The system shall protect local conversation data from access by other accounts using the same device. | Must | Proposed | AT |
| FR-MSG-013 | Message retention, deletion, export, and moderation operations shall enforce POL-MSG-001. | Must | Proposed | AT |
| FR-MSG-014 | The product shall not claim end-to-end encryption or zero-knowledge operation until the cryptographic design and client implementation are independently verified. | Must | Proposed | AT |
| FR-MSG-015 | While the application is visible, the client shall poll the pending-message endpoint at the interval defined in POL-MSG-001 and shall apply exponential backoff after failure or rate limiting. | Should | API, Proposed | AT |

## 6.12 Virtual tours and call signaling

| ID | Requirement | Priority | Basis | Verification |
| --- | --- | --- | --- | --- |
| FR-TOUR-001 | An authenticated Tenant shall be able to request a live virtual tour for an actionable listing. | Should | API | AT |
| FR-TOUR-002 | The system shall request private room credentials from the backend and shall not generate privileged meeting tokens in the browser. | Must | API | AT |
| FR-TOUR-003 | A Landlord or Agent shall be able to upload an MP4 or MOV walkthrough for an owned listing within the limits in POL-CNT-001. | Should | API | AT |
| FR-TOUR-004 | The system shall validate walkthrough type and configured size limits before upload and shall show progress, completion, and failure. | Must | API, Proposed | AT |
| FR-TOUR-005 | A Landlord or Agent shall be able to attach a validated Matterport showcase URL to an owned listing. | Should | API | AT |
| FR-TOUR-006 | A property detail shall embed a walkthrough or 3D tour only through an HTTPS origin allowlisted in POL-CNT-001 and with the configured iframe sandbox. | Should | API, Product | AT |
| FR-TOUR-007 | An authenticated user shall be able to initiate a property-linked call to the host of an actionable listing. | Should | API | AT |
| FR-TOUR-008 | The recipient shall be able to detect, accept, or reject an incoming call. | Should | API | AT |
| FR-TOUR-009 | Either participant shall be able to end an accepted call. | Must | API | AT |
| FR-TOUR-010 | The caller shall be able to observe initiated, accepted, rejected, ended, failed, and timed-out states. | Must | API | AT |
| FR-TOUR-011 | The system shall prevent unauthorized users from joining a private property tour room. | Must | API | AT |
| FR-TOUR-012 | The system shall request microphone or camera permission only after the user activates Join with microphone or Join with camera, and the Join action shall remain available with either device disabled. | Must | Proposed | AT |
| FR-TOUR-013 | The system shall handle unavailable devices, denied permissions, provider failures, and connection loss with recovery guidance. | Must | Proposed | AT |
| FR-TOUR-014 | The system shall not record a virtual tour unless all participants receive notice and provide any required consent. | Must | Proposed | AT |

## 6.13 Reviews and ratings

| ID | Requirement | Priority | Basis | Verification |
| --- | --- | --- | --- | --- |
| FR-REV-001 | An authenticated user shall be able to submit a property review only for a completed booking owned by that user. | Must | API | AT |
| FR-REV-002 | A review shall contain an integer rating from one through five and a comment no longer than the limit in POL-CNT-001. | Must | API | AT |
| FR-REV-003 | When review submission is blocked, the system shall display the failed BR-008 eligibility condition. | Must | Product | AT |
| FR-REV-004 | The review service shall store at most one review per reviewer and completed booking. | Must | Proposed | AT |
| FR-REV-005 | The system shall calculate aggregate ratings from reviews whose authoritative moderation state is Visible. | Should | API, Proposed | AT |
| FR-REV-006 | The system shall provide reporting and moderation controls for abusive, fraudulent, discriminatory, or irrelevant review content. | Must | Proposed | AT |
| FR-REV-007 | The system shall preserve moderation history and distinguish removed content from content that never existed. | Must | Proposed | AT |
| FR-REV-008 | A host shall be able to submit one attributable response to a visible review, and POL-CNT-001 shall govern that response. | Should | UI, Proposed | AT |

## 6.14 Saved listings

| ID | Requirement | Priority | Basis | Verification |
| --- | --- | --- | --- | --- |
| FR-SAV-001 | An authenticated Tenant shall be able to save and unsave an accessible property. | Should | UI, Proposed | AT |
| FR-SAV-002 | A saved-listing record shall persist across authenticated sessions and supported devices. | Should | Proposed | AT |
| FR-SAV-003 | The saved-listing service shall store at most one record per user and property. | Must | Proposed | AT |
| FR-SAV-004 | A saved-listing item shall display a Changed indicator after its price, transaction status, or publication state changes. | Should | Proposed | AT |
| FR-SAV-005 | The system shall allow the user to open or remove items from the saved-listing collection. | Should | UI | AT |

## 6.15 Notifications

| ID | Requirement | Priority | Basis | Verification |
| --- | --- | --- | --- | --- |
| FR-NOT-001 | The notification service shall create the security and state-transition events enumerated in POL-NOT-001. | Must | UI, Proposed | AT |
| FR-NOT-002 | The system shall distinguish required transactional notices from optional marketing communication. | Must | Proposed | AT |
| FR-NOT-003 | A user shall be able to configure each optional channel and category enumerated in POL-NOT-001. | Should | UI, Proposed | AT |
| FR-NOT-004 | A user shall not be able to disable notices required for security, transaction integrity, or legal compliance. | Must | Proposed | AT |
| FR-NOT-005 | An actionable notification shall link to the authorized record identified by its event payload. | Should | Proposed | AT |
| FR-NOT-006 | The notification service shall create no more than one delivery per event, recipient, channel, and escalation stage. | Must | Proposed | AT |
| FR-NOT-007 | An unauthenticated notification surface shall not display identity numbers, bank data, payment amounts, precise property-access data, or document content. | Must | Proposed | AT |
| FR-NOT-008 | Notification retention and deletion shall enforce POL-RET-001. | Must | Proposed | AT |

## 6.16 Disputes and support

| ID | Requirement | Priority | Basis | Verification |
| --- | --- | --- | --- | --- |
| FR-DSP-001 | An authenticated transaction party shall be able to open a dispute for a transaction category permitted by POL-DSP-001. | Must | UI, Proposed | AT |
| FR-DSP-002 | A dispute submission shall collect category, description, linked record, and requested resolution; it shall accept evidence when POL-DSP-001 requires evidence for the category. | Must | UI, Proposed | AT |
| FR-DSP-003 | The dispute view shall display one authoritative state from Submitted, Under review, Information requested, Resolved, Rejected, Appealed, or Closed. | Must | Proposed | AT |
| FR-DSP-004 | Authorized parties shall be able to add evidence and respond to requests while the dispute is open. | Must | Proposed | AT |
| FR-DSP-005 | Every dispute evidence upload shall pass NFR-SEC-017 and use the access and retention controls in POL-DSP-001. | Must | Proposed | AT |
| FR-DSP-006 | Opening a dispute category designated as Blocking by POL-DSP-001 shall create an escrow hold under BR-010. | Must | Proposed | AT |
| FR-DSP-007 | The notification service shall notify each dispute party of every event and response deadline enumerated in POL-DSP-001. | Must | Proposed | AT |
| FR-DSP-008 | Administrators shall record decisions, reasons, evidence references, and authorized overrides in an immutable audit history. | Must | Proposed | AT |
| FR-DSP-009 | A party shall be able to submit one appeal within the deadline and eligibility rules in POL-DSP-001. | Should | Proposed | AT |

## 6.17 Settings and preferences

| ID | Requirement | Priority | Basis | Verification |
| --- | --- | --- | --- | --- |
| FR-SET-001 | The settings route shall expose the profile, security, notification, payment, and privacy sections authorized for the user's role. | Must | UI | AT |
| FR-SET-002 | The system shall load settings from authoritative storage and shall not present prototype values as saved account values. | Must | Product | AT |
| FR-SET-003 | The system shall validate settings changes and communicate whether each change was saved. | Must | Product | AT |
| FR-SET-004 | A high-risk setting change shall require recent authentication under POL-SEC-001. | Must | Proposed | AT |
| FR-SET-005 | The system shall allow users to manage optional communication preferences. | Should | UI | AT |
| FR-SET-006 | The system shall allow users to review the status of payout information without displaying full account details. | Must | UI, Proposed | AT |
| FR-SET-007 | The system shall provide access to the current privacy notice, terms, consent choices, and personal-data request controls. | Must | Proposed | AT |
| FR-SET-008 | Deactivation and deletion actions shall require explicit confirmation and shall state their consequences before execution. | Must | UI | AT |
| FR-SET-009 | The system shall prevent repeated destructive actions while the first request is processing. | Must | Proposed | AT |
| FR-SET-010 | A setting shared by multiple roles shall use the same label, control type, validation rule, and saved-state behavior for each role. | Should | UI | AT |

## 6.18 Administration and marketplace operations

No administration API is documented. These requirements define the minimum proposed operations surface.

| ID | Requirement | Priority | Basis | Verification |
| --- | --- | --- | --- | --- |
| FR-ADM-001 | The system shall restrict administration capabilities to explicitly authorized staff roles using server-side authorization. | Must | Proposed | AT |
| FR-ADM-002 | The system shall separate administrative permissions by function, including support, verification review, risk, disputes, finance, content moderation, and system administration. | Must | Proposed | AT |
| FR-ADM-003 | An authorized reviewer shall be able to inspect and decide pending Landlord KYB submissions. | Must | API, Proposed | AT |
| FR-ADM-004 | An authorized reviewer shall be able to inspect and decide property ownership verification submissions that require manual review. | Must | API, Proposed | AT |
| FR-ADM-005 | An authorized operator shall be able to review duplicate-photo flags, verification anomalies, and other marketplace risk signals. | Must | API, Proposed | AT |
| FR-ADM-006 | An authorized operator shall be able to suspend, reinstate, or restrict an account with a recorded reason and duration. | Must | Proposed | AT |
| FR-ADM-007 | An authorized operator shall be able to unpublish, restore, or restrict a listing with a recorded reason. | Must | Proposed | AT |
| FR-ADM-008 | A dispute reviewer shall be able to inspect evidence, request information, record a decision, and initiate only financial actions authorized by POL-RSK-001. | Must | Proposed | AT |
| FR-ADM-009 | A moderator shall access reported content only through permissions and purpose restrictions in POL-CNT-001 and POL-PRV-001. | Must | Proposed | AT |
| FR-ADM-010 | An authorized finance operator shall be able to reconcile payment, escrow, refund, and payout records without viewing unnecessary bank data. | Must | Proposed | AT |
| FR-ADM-011 | Every high-risk administrative action listed in POL-RSK-001 shall require the number and roles of approvers specified by that policy. | Must | Proposed | AT |
| FR-ADM-012 | Every administrative read of sensitive data and every administrative mutation shall be audit-logged. | Must | Proposed | AT |
| FR-ADM-013 | Administrative search and reports shall enforce data minimization and role permissions. | Must | Proposed | AT |
| FR-ADM-014 | The system shall provide operational queues for pending verification, disputes, risk flags, failed payments, and unresolved support cases. | Should | Proposed | AT |
| FR-ADM-015 | Administrative dashboards shall use authoritative data and disclose refresh time and partial-data conditions. | Must | Product | AT |
| FR-ADM-016 | The system shall not expose production administrative actions through a design-preview or placeholder interface. | Must | Product | AT |

## 6.19 System health and integration behavior

| ID | Requirement | Priority | Basis | Verification |
| --- | --- | --- | --- | --- |
| FR-SYS-001 | The platform shall expose an unauthenticated health endpoint that reports service health without exposing sensitive configuration. | Must | API | AT |
| FR-SYS-002 | Frontend API integrations shall parse the standardized response envelope for every endpoint identified as Standard envelope in the API contract. | Must | API | AT |
| FR-SYS-003 | The system shall distinguish validation, authentication, authorization, not-found, conflict, rate-limit, dependency, timeout, and unexpected server failures. | Must | API | AT |
| FR-SYS-004 | The client shall retry a read operation only after a transient network or 5xx failure, and shall retry a mutation only with an idempotency key. | Must | Proposed | AT |
| FR-SYS-005 | The system shall preserve correlation identifiers supplied by backend or integration services for operational investigation. | Should | Proposed | AT |
| FR-SYS-006 | The system shall reject an external URL whose scheme, host, port, or redirect target is not allowlisted. | Must | Proposed | AT |
| FR-SYS-007 | When a critical dependency fails its readiness check, the system shall display the dependency's configured Degraded or Maintenance state. | Should | Proposed | AT |

# 7. Non-functional requirements

## 7.1 Security

| ID | Requirement | Verification |
| --- | --- | --- |
| NFR-SEC-001 | All production traffic shall use TLS 1.2 or later. | UT, IN |
| NFR-SEC-002 | Every HTTP request to a production user route shall redirect to HTTPS. | UT, IN |
| NFR-SEC-003 | Authentication tokens shall use Secure, HttpOnly, and SameSite cookies or a security-reviewed mechanism documented in POL-SEC-001. | UT, IN |
| NFR-SEC-004 | Browser local storage shall not contain a bearer access token. | UT, IN |
| NFR-SEC-005 | Every protected backend operation shall enforce authentication. | UT, IN |
| NFR-SEC-006 | Every protected backend operation shall enforce role authorization. | UT, IN |
| NFR-SEC-007 | Every object-specific backend operation shall enforce ownership or explicit delegated access. | UT, IN |
| NFR-SEC-008 | Passwords shall be stored only as adaptive password hashes meeting POL-SEC-001. | UT, IN |
| NFR-SEC-009 | Every high-risk action shall require recent authentication under POL-SEC-001. | UT, IN |
| NFR-SEC-010 | User-controlled content shall be encoded or sanitized so the OWASP cross-site scripting test suite produces no executable injection. | UT, IN |
| NFR-SEC-011 | Every cookie-authenticated state-changing request shall pass the cross-site request-forgery control defined in POL-SEC-001. | UT, IN |
| NFR-SEC-012 | Every database operation shall use parameterized access or an object mapper that prevents injection. | UT, IN |
| NFR-SEC-013 | Object identifiers supplied by a client shall not bypass NFR-SEC-007. | UT, IN |
| NFR-SEC-014 | Server-side outbound requests shall permit only schemes, hosts, ports, and redirect behavior on the configured allowlist. | UT, IN |
| NFR-SEC-015 | Production responses shall include the frame-ancestors restriction defined by the Content Security Policy. | UT, IN |
| NFR-SEC-016 | Redirect targets shall resolve only to same-origin paths or origins allowlisted in POL-SEC-001. | UT, IN |
| NFR-SEC-017 | Every uploaded file shall pass type, file-signature, size, ownership, and malware validation before downstream use. | UT, IN |
| NFR-SEC-018 | Production responses shall include the versioned Content Security Policy defined in POL-SEC-001. | UT, IN |
| NFR-SEC-019 | Production responses shall include transport security, MIME sniffing protection, and referrer-policy headers defined in POL-SEC-001. | UT, IN |
| NFR-SEC-020 | Secrets and provider credentials shall remain outside source control. | UT, IN |
| NFR-SEC-021 | Secrets and provider credentials shall be rotated at the interval defined in POL-SEC-001. | UT, IN |
| NFR-SEC-022 | NIN, BVN, bank details, identity documents, proof documents, and private location evidence shall be encrypted in transit and at rest. | UT, IN |
| NFR-SEC-023 | Logs, analytics, errors, URLs, and client storage shall not contain passwords, complete tokens, OTPs, full NIN or BVN values, full bank account numbers, or raw identity documents. | UT, IN |
| NFR-SEC-024 | Public and authentication endpoints shall enforce endpoint-specific limits defined in POL-SEC-001, with no limit exceeding 100 requests per minute per IP. | UT, IN |
| NFR-SEC-025 | OTP, recovery, login, verification, payment, and administration endpoints shall reject replayed credentials or commands. | UT, IN |
| NFR-SEC-026 | Administrator authentication shall require multi-factor authentication. | UT, IN |
| NFR-SEC-027 | Each security audit event shall contain actor, action, target, result, timestamp, and correlation identifier in tamper-evident storage. | UT, IN |
| NFR-SEC-028 | Continuous integration shall fail a release build for an unaccepted critical exploitable dependency vulnerability. | UT, IN |
| NFR-SEC-029 | Threat modeling shall be completed before a production release that processes identity documents or escrow funds. | UT, IN |
| NFR-SEC-030 | Independent penetration testing shall be completed before a production release that processes identity documents or escrow funds. | UT, IN |
| NFR-SEC-031 | Authorization failures shall return the same resource-existence detail for existing and non-existing unauthorized records. | UT, IN |
| NFR-SEC-032 | Provider callbacks shall pass signature or mutual-authentication verification before processing. | UT, IN |
| NFR-SEC-033 | Replayed provider callbacks shall not create a second state transition. | UT, IN |

## 7.2 Privacy and regulatory quality

| ID | Requirement | Verification |
| --- | --- | --- |
| NFR-PRV-001 | The platform shall satisfy every regulatory obligation enumerated in the legally ratified version of POL-PRV-001. | IN, AT |
| NFR-PRV-002 | Every collected personal-data field shall have a documented purpose in the data dictionary. | IN, AT |
| NFR-PRV-003 | The collection interface shall display the current privacy-notice link before the user submits personal data. | IN, AT |
| NFR-PRV-004 | A consent record shall store purpose, notice version, decision, and timestamp. | IN, AT |
| NFR-PRV-005 | Marketing consent shall be independent from consent required to provide a requested service. | IN, AT |
| NFR-PRV-006 | The system shall enforce the retention and deletion period for each data category in POL-RET-001. | IN, AT |
| NFR-PRV-007 | The system shall complete a data-access request within the deadline in POL-PRV-001. | IN, AT |
| NFR-PRV-008 | The system shall complete a data-correction request within the deadline in POL-PRV-001. | IN, AT |
| NFR-PRV-009 | The system shall complete a data-export request within the deadline in POL-PRV-001. | IN, AT |
| NFR-PRV-010 | The system shall complete a deletion or restriction request within the deadline in POL-PRV-001. | IN, AT |
| NFR-PRV-011 | Public interfaces shall not expose identity documents, identity numbers, bank data, or verification location evidence. | IN, AT |
| NFR-PRV-012 | Staff access to Restricted data shall require a permission mapped to a documented operational purpose. | IN, AT |
| NFR-PRV-013 | Each external provider payload shall contain only fields listed for that provider in POL-PRV-001. | IN, AT |
| NFR-PRV-014 | Production personal data shall not cross a national border unless the transfer is recorded and authorized under POL-PRV-001. | IN, AT |
| NFR-PRV-015 | A privacy-impact assessment shall be approved before production use of biometric verification. | IN, AT |
| NFR-PRV-016 | A privacy-impact assessment shall be approved before production use of precise location verification. | IN, AT |
| NFR-PRV-017 | A privacy-impact assessment shall be approved before production use of relay messaging. | IN, AT |
| NFR-PRV-018 | A privacy-impact assessment shall be approved before production use of payment or escrow processing. | IN, AT |
| NFR-PRV-019 | User-facing messaging claims shall match the independently verified cryptographic design documented in POL-MSG-001. | IN, AT |

## 7.3 Performance and capacity

All measurements shall use ENV-PERF-001 and the Normal load definition in CAP-001. Browser metrics shall be measured at the browser. API metrics shall be measured from request receipt at the Rello API edge through completion of the response body.

| ID | Requirement | Verification |
| --- | --- | --- |
| NFR-PER-001 | Public routes shall achieve Largest Contentful Paint of 2.5 seconds or less at p75 in ENV-PERF-001 under Normal load. | MT |
| NFR-PER-002 | Public and authenticated routes shall achieve Interaction to Next Paint of 200 milliseconds or less at p75 in ENV-PERF-001 under Normal load. | MT |
| NFR-PER-003 | Public and authenticated routes shall achieve Cumulative Layout Shift of 0.1 or less at p75 in ENV-PERF-001 under Normal load. | MT |
| NFR-PER-004 | Cached public API reads shall complete within 500 milliseconds at p95, measured at the API edge under Normal load. | MT |
| NFR-PER-005 | Uncached public API reads shall complete within 1.5 seconds at p95, measured at the API edge under Normal load. | MT |
| NFR-PER-006 | Standard authenticated mutations shall complete within 2 seconds at p95, measured at the API edge under Normal load. | MT |
| NFR-PER-007 | A user interface for an operation exceeding 1 second shall display progress or a Pending state within 1 second at p95, measured in the browser under Normal load. | MT |
| NFR-PER-008 | Search or filter input shall update visible results within 500 milliseconds at p95 after the result data reaches the browser under Normal load. | MT |
| NFR-PER-009 | The initial public route's JavaScript bundle shall not contain a module reachable only from an authenticated dashboard entry point, as verified by CI bundle analysis. | MT |
| NFR-PER-010 | Every responsive image shall include source dimensions or an aspect ratio. | MT |
| NFR-PER-011 | Every image outside the initial viewport shall use lazy loading unless a linked performance test shows that eager loading produces a lower p75 Largest Contentful Paint without violating another NFR. | MT |
| NFR-PER-012 | A list containing 1,000 locally available records shall respond to scroll or keyboard input within 200 milliseconds at p75 in ENV-PERF-001. | MT |
| NFR-PER-013 | The production system shall satisfy every throughput, concurrency, and error-rate threshold defined in CAP-001 before release. | MT |

## 7.4 Availability, resilience, and recovery

| ID | Requirement | Verification |
| --- | --- | --- |
| NFR-AVL-001 | The production marketplace shall achieve at least 99.9 percent availability per calendar month, excluding maintenance windows recorded in the operations runbook. | MT, DM |
| NFR-AVL-002 | Planned maintenance shall be announced by the notice period in the operations runbook and scheduled outside the peak intervals in CAP-001. | MT, DM |
| NFR-AVL-003 | A failure of analytics, recommendations, optional notifications, or decorative media shall not prevent core authentication, discovery, or transaction workflows. | MT, DM |
| NFR-AVL-004 | Each external call shall use the connection timeout, response timeout, maximum retry count, backoff, and circuit threshold recorded for that dependency in the operations runbook. | MT, DM |
| NFR-AVL-005 | Each non-idempotent booking, offer, payment, message, or decision command shall include an idempotency key accepted by the authoritative service. | MT, DM |
| NFR-AVL-006 | A multi-step workflow shall restore its last server-confirmed step after browser refresh, network interruption, provider timeout, or server restart. | MT, DM |
| NFR-AVL-007 | Authoritative transactional data shall be backed up at an interval that satisfies NFR-AVL-008, and restoration shall be demonstrated at least quarterly. | MT, DM |
| NFR-AVL-008 | The initial recovery point objective for authoritative transactional data shall be 15 minutes or less. | MT, DM |
| NFR-AVL-009 | The initial recovery time objective for core marketplace services shall be 4 hours or less. | MT, DM |
| NFR-AVL-010 | Relay messaging shall document the delivery-loss risk created by receive-and-delete behavior and shall implement a tested acknowledgment or recovery design before production reliance. | MT, DM |

## 7.5 Accessibility and inclusive use

| ID | Requirement | Verification |
| --- | --- | --- |
| NFR-ACC-001 | User-facing web surfaces shall conform to WCAG 2.2 Level AA. | UT, DM |
| NFR-ACC-002 | All functionality shall be operable with a keyboard without a keyboard trap. | UT, DM |
| NFR-ACC-003 | Opening a dialog, menu, drawer, or verification step shall move focus to its first task control; closing it shall return focus to its trigger. | UT, DM |
| NFR-ACC-004 | Interactive elements shall have visible focus indicators and accessible names. | UT, DM |
| NFR-ACC-005 | Text and controls shall meet WCAG 2.2 Level AA contrast thresholds in normal, hover, focus, disabled, error, and selected states. | UT, DM |
| NFR-ACC-006 | Forms shall associate labels, instructions, errors, and required state with their controls. Errors shall not be communicated by color alone. | UT, DM |
| NFR-ACC-007 | Status changes, asynchronous errors, upload progress, and successful submissions shall be announced to assistive technology without disruptive repetition. | UT, DM |
| NFR-ACC-008 | Each informative image shall have alternative text; each decorative image shall have an empty alternative; each video containing speech shall provide synchronized captions. | UT, DM |
| NFR-ACC-009 | Motion shall respect reduced-motion preferences, and essential tasks shall not depend on animation. | UT, DM |
| NFR-ACC-010 | Core content shall remain available if the introductory loading animation fails or cannot run. | UT, DM |
| NFR-ACC-011 | Interfaces shall support zoom to 200 percent and responsive reflow to 320 CSS pixels without loss of content or function. | UT, DM |
| NFR-ACC-012 | Automated accessibility checks and manual keyboard and screen-reader checks shall be part of release acceptance for critical journeys. | UT, DM |

## 7.6 Usability and product consistency

| ID | Requirement | Verification |
| --- | --- | --- |
| NFR-USA-001 | Public routes shall place property discovery before secondary marketing actions in keyboard and visual order; authenticated routes shall place the current task action before explanatory content. | AT, IN |
| NFR-USA-002 | Every action, state, and role shall use the canonical term listed in the product glossary; user-facing content shall use Rello and shall not use Keyz. | AT, IN |
| NFR-USA-003 | Rental and sale terminology, price presentation, actions, and status labels shall remain distinct and unambiguous. | AT, IN |
| NFR-USA-004 | Before a destructive, financial, identity, or binding action executes, the interface shall display the action name, target, immediate consequence, and Confirm and Cancel controls. | AT, IN |
| NFR-USA-005 | An asynchronous view shall display Loading while awaiting its first response, Empty after a successful zero-record response, Error after failure, and Retry after a recoverable failure. | AT, IN |
| NFR-USA-006 | Error messages shall state what happened and what the user can do next without exposing internal details. | AT, IN |
| NFR-USA-007 | A multi-step workflow shall display current step, total steps, completed steps, a Back control, and a Resume control that restores the last server-confirmed step. | AT, IN |
| NFR-USA-008 | A recoverable validation or network error shall retain validated non-secret text input and shall clear passwords, OTPs, payment credentials, and uncommitted identity files. | AT, IN |
| NFR-USA-009 | The interface shall not present placeholder data, mock outcomes, or future features as live production capability. | AT, IN |
| NFR-USA-010 | Critical user journeys shall be usability-tested with representative Nigerian users before general release. | AT, IN |

## 7.7 Compatibility and portability

| ID | Requirement | Verification |
| --- | --- | --- |
| NFR-COM-001 | The web application shall support the current and previous major versions of Chrome, Edge, Firefox, and Safari at release time. | AT |
| NFR-COM-002 | Core journeys shall pass on the current and previous major versions of Android Chrome and iOS Safari at release time. | AT |
| NFR-COM-003 | Layouts shall support viewport widths from 320 through 1920 CSS pixels. | AT |
| NFR-COM-004 | The application shall feature-detect IndexedDB, camera, geolocation, and media devices and shall display an Unsupported capability state when a required capability is absent. | AT |
| NFR-COM-005 | Public listing content and account-recovery instructions shall remain readable when analytics, animation, chat, and dashboard client modules fail to load. | AT |
| NFR-COM-006 | API versions and third-party integration versions shall be documented, compatibility-tested, and upgraded through controlled releases. | AT |
| NFR-COM-007 | The application shall be deployable in development, test, staging, and production environments using environment-specific configuration. | AT |

## 7.8 Scalability and efficiency

| ID | Requirement | Verification |
| --- | --- | --- |
| NFR-SCL-001 | Stateless application services shall support horizontal scaling without relying on process-local session state. | AN, MT |
| NFR-SCL-002 | Public property reads shall support caching with correct invalidation when a listing is published, changed, withdrawn, or restricted. | AN, MT |
| NFR-SCL-003 | Search, portfolio, booking, offer, message, notification, dispute, and administration collections shall use bounded pagination. | AN, MT |
| NFR-SCL-004 | Polling intervals for chat and call signaling shall be configurable and shall apply visibility, backoff, and rate-limit awareness. | AN, MT |
| NFR-SCL-005 | Media processing and verification operations that exceed the synchronous timeout in the operations runbook shall execute as asynchronous jobs. | AN, MT |
| NFR-SCL-006 | Capacity thresholds and scaling alarms shall be defined for API latency, error rate, queue depth, database connections, storage, and third-party quotas. | AN, MT |

## 7.9 Data integrity and quality

| ID | Requirement | Verification |
| --- | --- | --- |
| NFR-DAT-001 | Each user, property, listing, booking, offer, review, payment, dispute, verification, message, call, and audit record shall have a stable unique identifier. | UT, IN |
| NFR-DAT-002 | Timestamps shall be stored as UTC instants and displayed with an explicit timezone using the account locale. | UT, IN |
| NFR-DAT-003 | Monetary values shall use fixed-precision decimal representation and explicit currency. Floating-point arithmetic shall not determine financial balances. | UT, IN |
| NFR-DAT-004 | Status transitions shall be validated atomically by the authoritative service. | UT, IN |
| NFR-DAT-005 | Transaction, verification, dispute, and audit histories shall preserve prior states and shall not be silently overwritten. | UT, IN |
| NFR-DAT-006 | A repeated command, provider callback, upload completion, or relay message with the same idempotency identifier shall produce no second record or state transition. | UT, IN |
| NFR-DAT-007 | Client and API validation shall use the same versioned field constraints, and the backend shall remain authoritative. | UT, IN |
| NFR-DAT-008 | Each data migration shall be versioned and tested against representative production-scale data; an irreversible migration shall include a tested restore plan. | UT, IN |
| NFR-DAT-009 | Development and test environments shall not contain production personal data unless an inspection report demonstrates irreversible anonymization. | UT, IN |
| NFR-DAT-010 | Reports and dashboard aggregates shall identify their source, calculation rules, and last refresh time. | UT, IN |

## 7.10 Maintainability and delivery quality

| ID | Requirement | Verification |
| --- | --- | --- |
| NFR-MNT-001 | The codebase shall use strict TypeScript and shall not introduce unbounded any types except for documented unavoidable integration boundaries. | IN, UT |
| NFR-MNT-002 | Shared contracts shall have one authoritative type definition and shall be imported rather than duplicated. | IN, UT |
| NFR-MNT-003 | A production TypeScript or TSX module shall contain no more than 500 nonblank lines unless a time-bounded architecture waiver identifies owner, rationale, tests, and expiry. | IN, UT |
| NFR-MNT-004 | Each business rule used by more than one route shall have one shared implementation module and one authoritative test suite. | IN, UT |
| NFR-MNT-005 | API clients shall centralize authentication, response parsing, timeout, error mapping, and correlation behavior. | IN, UT |
| NFR-MNT-006 | The repository shall provide scripts for linting, type checking, unit tests, integration tests, and production build verification. | IN, UT |
| NFR-MNT-007 | Continuous integration shall run required static checks and tests for every proposed merge. | IN, UT |
| NFR-MNT-008 | Critical journeys shall have automated tests covering success, authorization failure, validation failure, provider failure, retry, and duplicate submission. | IN, UT |
| NFR-MNT-009 | Public API contracts shall be versioned and validated through contract tests or generated schemas. | IN, UT |
| NFR-MNT-010 | Architecture, environment variables, setup instructions, production dependencies, and operational runbooks shall remain synchronized with the implemented system. | IN, UT |
| NFR-MNT-011 | Releases shall be traceable to source revision, build result, schema version, and deployment environment. | IN, UT |
| NFR-MNT-012 | Feature flags shall be used for incomplete or high-risk production capabilities instead of presenting non-functional interfaces. | IN, UT |

## 7.11 Observability and supportability

| ID | Requirement | Verification |
| --- | --- | --- |
| NFR-OBS-001 | Services shall emit structured logs with timestamp, severity, environment, service, event, result, and correlation identifier. | DM, IN |
| NFR-OBS-002 | Monitoring shall track availability, latency, error rate, traffic, saturation, authentication failures, verification failures, payment mismatches, message queue depth, and provider health. | DM, IN |
| NFR-OBS-003 | Alerts shall have documented severity, ownership, notification route, and response runbook. | DM, IN |
| NFR-OBS-004 | Client and server errors shall be captured with release and route context after sensitive fields are removed. | DM, IN |
| NFR-OBS-005 | The health interface shall expose separate liveness and dependency-readiness results. | DM, IN |
| NFR-OBS-006 | Audit logs shall be searchable by authorized operators without granting access to unrelated sensitive content. | DM, IN |
| NFR-OBS-007 | Operational dashboards shall identify stale, partial, delayed, or estimated data. | DM, IN |
| NFR-OBS-008 | Production incidents shall support post-incident review and tracked corrective actions. | DM, IN |

## 7.12 Localization and content

| ID | Requirement | Verification |
| --- | --- | --- |
| NFR-LOC-001 | User-facing text shall be maintained separately from core business logic so future localization does not require workflow rewrites. | IN, AT |
| NFR-LOC-002 | The initial locale shall use Nigerian English and ISO 4217 NGN currency formatting. | IN, AT |
| NFR-LOC-003 | Dates shall display an unambiguous month name or ISO order; times shall include timezone; phone numbers shall use E.164 storage; and currency shall include its symbol or code. | IN, AT |
| NFR-LOC-004 | The product shall support Unicode names, addresses, and messages. | IN, AT |
| NFR-LOC-005 | Each legal, transactional, or verification content item shall store a version and publication-approval record before it becomes active. | IN, AT |

# 8. External interface requirements

| Interface | Required behavior |
| --- | --- |
| Rello or Keyz REST API | JSON over HTTPS with bearer or cookie-based authentication, standardized response envelopes, documented status codes, timeouts, idempotency, and correlation identifiers |
| Dojah | NIN, BVN, and selfie liveness verification through server-controlled requests with provider references and normalized states |
| Object storage | Private verification documents and controlled public property media using signed access where appropriate |
| AWS Textract | Server-controlled OCR of utility bills with confidence and address-match results |
| Jitsi JaaS | Private, backend-issued room credentials for live property tours and calls |
| Matterport | Validated and safely embedded 3D showcase links |
| Email service | Transactional email for verification, password recovery, security events, and material transaction notices |
| Payment and escrow provider | Provider is TBD. Integration shall support idempotent initiation, authenticated callbacks, reconciliation, refunds, escrow state, and verified payouts |
| Analytics | Privacy-reviewed event collection without identity, payment, document, message, or precise-location content |
| Waitlist service | Validated server-to-server forwarding with timeout, abuse controls, and safe error handling |

# 9. Core business rules

| ID | Rule |
| --- | --- |
| BR-001 | A Landlord may create rental listings only. |
| BR-002 | An Agent may create sale listings only. |
| BR-003 | A listing may enter Published state only when the host verification and property verification states required by POL-VER-001 are APPROVED. |
| BR-004 | A listing in Duplicate-flagged, Rejected, Withdrawn, or Unavailable state shall not appear in public discovery and shall reject booking and offer creation. |
| BR-005 | Only the authenticated owner or an authorized operator may manage a listing. |
| BR-006 | A booking may reference only a FOR_RENT listing that satisfies BR-003 and is available for the requested date range. |
| BR-007 | A purchase offer may reference only a FOR_SALE listing that satisfies BR-003 and is accepting offers. |
| BR-008 | A user may submit one review only for a completed booking owned by that user. |
| BR-009 | A payout may be initiated only when the authoritative payout-verification state is APPROVED. |
| BR-010 | The authoritative escrow service shall refuse release while a linked dispute has Blocking status under POL-DSP-001 and shall authorize release only after every condition in POL-PAY-001 passes. |
| BR-011 | Administrative actions require explicit server-side permission and an audit record. |
| BR-012 | A verification or financial state displayed by a client shall equal the state returned by its authoritative service. |

# 10. Data requirements

The logical data model shall support at least:

- User, role, profile, session, trusted device, consent, and account state.
- Property, listing status, transaction type, address, coordinates, amenities, price, media, host, and publication state.
- Identity, business, property, geofence, OCR, payout, provider reference, review decision, and verification status history.
- Booking, offer, transaction terms, status history, cancellation, and authorized actors.
- Payment intent, escrow record, provider reference, amount, currency, fees, refund, release, payout, reconciliation, and audit history.
- Conversation, participant, property context, local message identifier, relay identifier, timestamp, and delivery state.
- Tour, call, participant, room reference, property, status, and timestamps.
- Review, rating, comment, eligibility transaction, moderation state, report, and response.
- Saved listing, notification, preference, dispute, evidence, decision, appeal, and support reference.
- Administrative audit event and operational correlation identifier.

Data dictionaries shall define field name, type, format, allowed values, required state, source of truth, sensitivity classification, retention, and access policy.

## 10.1 Retention schedule baseline

POL-RET-001 shall replace every TBD below with a duration, trigger, legal or business basis, deletion method, and authorized hold exception before the corresponding production data is collected.

| ID | Data category | Retention period | Trigger | Basis |
| --- | --- | --- | --- | --- |
| RET-001 | Account and profile | TBD | Account closure or last activity | TBD |
| RET-002 | Identity and biometric verification result | TBD | Verification completion or expiry | TBD |
| RET-003 | Identity, business, and ownership documents | TBD | Decision, expiry, or account closure | TBD |
| RET-004 | Precise verification location and EXIF evidence | TBD | Verification decision | TBD |
| RET-005 | Public property media | TBD | Listing withdrawal or account closure | TBD |
| RET-006 | Booking and offer records | TBD | Transaction closure | TBD |
| RET-007 | Payment, escrow, refund, and payout records | TBD | Financial transaction closure | TBD |
| RET-008 | Disputes and evidence | TBD | Final resolution or appeal closure | TBD |
| RET-009 | Local and relay messaging records | TBD | Delivery, local deletion, or account closure | TBD |
| RET-010 | Security and administrative audit events | TBD | Event creation | TBD |
| RET-011 | Notifications and delivery records | TBD | Delivery or read state | TBD |
| RET-012 | Analytics and consent records | TBD | Collection or consent withdrawal | TBD |

# 11. Traceability

## 11.1 Requirement ID migration from v0.1

Unlisted IDs remain unchanged. A range means the former compound requirement was split into independently testable requirements.

| v0.1 ID | v0.2 replacement | Change |
| --- | --- | --- |
| FR-PUB-006 | FR-PUB-006, FR-PUB-009 through FR-PUB-011 | Split validation, in-flight control, success, and failure retention |
| FR-AUTH-015 | FR-AUTH-015, FR-AUTH-021 | Split server invalidation from client credential removal |
| FR-DET-002 | FR-DET-002 through FR-DET-013 | Split each property-detail field or field group |
| FR-DET-003 | FR-DET-005 | Rental and sale price presentation retained |
| FR-DET-004 | FR-DET-014 | Gallery accessibility retained |
| FR-DET-005 | FR-DET-011 and BR-012 | Canonical authoritative verification rule |
| FR-DET-006 | FR-DET-015 and FR-DET-016 | Split rental and sale primary actions |
| FR-DET-007 | FR-DET-017 | Property-linked conversation |
| FR-DET-008 | FR-DET-018 | Live tour action |
| FR-DET-009 | FR-DET-019 and BR-004 | Canonical non-actionable listing rule |
| FR-DET-010 | FR-DET-020 | Not-found state |
| FR-LST-004 | FR-LST-004 through FR-LST-012 | Split listing fields and authenticated identity derivation |
| FR-LST-005 | FR-LST-013 through FR-LST-015 | Split property type, amenities, and discovery location |
| FR-LST-006 | FR-LST-016 | Field validation |
| FR-LST-007 | FR-LST-017 and FR-LST-018 | Split draft save and resume |
| FR-LST-008 | FR-LST-019 and FR-LST-020 | Split completion metric and next action |
| FR-LST-009 | FR-LST-021 and BR-003 | Canonical publication rule |
| FR-LST-010 | FR-LST-022 through FR-LST-024 | Split accepted formats, progress, and failure |
| FR-LST-011 | FR-LST-025 and FR-LST-026 | Split orientation from metadata removal |
| FR-LST-012 | FR-LST-027 | Duplicate-image publication block |
| FR-LST-013 | FR-LST-028 | Review before submission |
| FR-LST-014 | FR-LST-029 | Closed lifecycle-state set |
| FR-LST-015 | FR-LST-030 and BR-005 | Ownership rule |
| FR-LST-016 | FR-LST-031 and FR-LST-032 | Split editing from re-verification |
| FR-LST-017 | FR-LST-033 and FR-LST-034 | Split withdrawal from history retention |
| FR-LST-018 | FR-LST-035 | Destructive-edit block |
| FR-LST-019 | FR-LST-036 and FR-LST-037 | Split reason from remediation |
| FR-LST-020 | FR-LST-038 and FR-LST-039 | Split multiple media from cover selection |
| FR-TRX-012 | FR-TRX-012 and FR-TRX-017 through FR-TRX-019 | Split view, accept, reject, and counteroffer |
| FR-PAY-010 | Section 14 release gate | Removed governance action from functional requirements |
| FR-DAS-002 | FR-DAS-002 through FR-DAS-006 | Split Tenant portfolio and action links |
| FR-DAS-003 | FR-DAS-007 through FR-DAS-011 | Split Landlord dashboard metrics and actions |
| FR-DAS-004 | FR-DAS-012 through FR-DAS-015 | Split Agent dashboard metrics and actions |
| FR-DAS-005 | FR-DAS-016 and FR-DAS-020 | Split data timestamp and delayed-state labeling |
| FR-DAS-006 | FR-DAS-021 | Placeholder-data prohibition |
| FR-DAS-007 | FR-DAS-023 | Defined action ordering |
| FR-DAS-008 | FR-DAS-022 | Account and role isolation |
| FR-DAS-009 | FR-DAS-017 through FR-DAS-020 | Split loading, empty, error, and partial states |
| FR-DAS-010 | FR-DAS-024 | Sidebar preference |
| NFR-SEC-006 | NFR-SEC-010 through NFR-SEC-017 | Split eight threat classes |
| NFR-PRV-003 | NFR-PRV-003 and NFR-PRV-004 | Split notice display from consent record |
| NFR-PRV-005 | NFR-PRV-006 and RET-001 through RET-012 | Replaced compound retention statement with schedule |
| NFR-PRV-007 | NFR-PRV-007 through NFR-PRV-010 | Split data-rights operations |
| NFR-PRV-008 | NFR-PRV-011 and NFR-PRV-012 | Split public exposure from staff access |
| NFR-PRV-011 | NFR-PRV-015 through NFR-PRV-018 | Split privacy-impact assessments by processing type |
| NFR-PER-004 | NFR-PER-004 and NFR-PER-005 | Split cached and uncached API reads |
| NFR-PER-005 | NFR-PER-006 and NFR-PER-007 | Split API completion from progress feedback |
| NFR-PER-007 | NFR-PER-009 | Rewritten as a CI bundle-analysis condition |
| NFR-PER-008 | NFR-PER-010 and NFR-PER-011 | Split image dimensions from lazy loading |
| NFR-PER-010 | NFR-PER-013 and Section 14 | Converted capacity approval into a measurable system target and release gate |

## 11.2 Current delivery state

| Domain | Current evidence | Delivery assessment |
| --- | --- | --- |
| Public marketplace | Landing, waitlist, property cards, and property details exist | UI present, much property data remains static |
| Authentication | Register, login, verify email, forgot password, and reset password proxy routes exist | Connected foundation present |
| Role access | Client role guards and role layouts exist | Requires server-side session and authorization design |
| Property discovery | Public and Tenant browse interfaces exist | Backend integration requires confirmation |
| Listing creation | Guided and classic host forms plus IndexedDB storage exist | Prototype storage, not a complete backend workflow |
| Verification | Tenant, Landlord, Agent, property, and payout interfaces exist | Primarily mock or local state |
| Booking and offers | Screens and API contracts exist in different degrees | End-to-end lifecycle incomplete |
| Portfolio | Backend contract and Landlord dashboard exist | Role models and live integration need alignment |
| Messaging | IndexedDB storage and chat interfaces exist | Relay integration and recovery protocol incomplete |
| Tours and calls | Backend contracts exist | Frontend workflow largely missing |
| Reviews and ratings | Some role screens exist | Submission, eligibility, retrieval, and moderation incomplete |
| Saved listings | Tenant interface and host listing reuse exist | Persistent backend contract missing |
| Escrow and disputes | Designed role pages exist | Backend and business rules unconfirmed |
| Notifications | Settings and isolated indicators exist | General event and delivery service missing |
| Administration | Preview dashboard and settings exist | Backend contract and permission model missing |
| Testing and operations | ESLint and strict TypeScript pass | Automated tests, CI, runbooks, and production SLO evidence missing |

# 12. Out of scope for this baseline

The following are excluded unless stakeholders approve a later revision:

- Native iOS or Android applications.
- Property valuation, mortgage origination, insurance brokerage, or legal conveyancing.
- Short-stay hospitality operations unless explicitly added to the booking model.
- Multi-currency settlement.
- Property management accounting beyond approved marketplace transactions.
- Public social networking between users.
- Unverified claims of end-to-end encrypted or zero-knowledge messaging.

# 13. Open decisions

| ID | Decision required |
| --- | --- |
| OD-001 | Confirm whether the initial commercial scope includes both rental and sale or uses a phased release. |
| OD-002 | Confirm whether a Tenant is both a renter and buyer and define dashboard terminology accordingly. |
| OD-003 | Confirm the complete single-property retrieval contract. |
| OD-004 | Confirm booking and offer retrieval, host-decision, cancellation, expiry, and status-transition APIs. |
| OD-005 | Confirm whether an authenticated password-change and session-management API exists. |
| OD-006 | Define the administrative API, staff roles, approval thresholds, and separation of duties. |
| OD-007 | Select the payment and escrow provider and approve fee, refund, release, settlement, and dispute policies. |
| OD-008 | Define saved-listing and notification backend contracts. |
| OD-009 | Approve messaging encryption, local retention, multi-device behavior, backup, deletion, moderation, acknowledgment, and polling strategy. |
| OD-010 | Confirm whether identity verification uses Dojah, Smile ID, or another provider and normalize naming in code and documentation. |
| OD-011 | Define verification expiry, manual review, resubmission, and appeal policies. |
| OD-012 | Define public-address precision and precise-location retention rules. |
| OD-013 | Approve launch capacity targets, availability commitments, support hours, and incident severity definitions. |
| OD-014 | Approve records retention, privacy request, biometric processing, and cross-border data policies with qualified counsel. |
| OD-015 | Define which marketing claims may be published and identify their authoritative data sources. |
| OD-016 | Confirm backend acceptance of the privacy-preserving installation identifier required by FR-AUTH-009 and remove browser fingerprint collection. |
| OD-017 | Ratify each normative reference marked TBD in Section 3.5 and assign its owner, version, approval date, and review date. |

# 14. Release acceptance baseline

A production release shall not be accepted until:

- Every Must requirement in the approved release scope has passing evidence for each Verification method or a dated waiver identifying owner, reason, risk, and expiry.
- Every Should requirement deferred from the release has a recorded product decision.
- Lint, type checking, automated tests, contract tests, security tests, accessibility tests, and production build checks pass in continuous integration.
- Server-side authentication, authorization, ownership checks, and administrative permissions pass their acceptance tests.
- Threat modeling, privacy review, accessibility review, and required penetration testing are complete.
- CAP-001 and ENV-PERF-001 are approved before performance or capacity acceptance.
- POL-ACC-001, POL-ADR-001, POL-CNT-001, POL-PRV-001, POL-RET-001, POL-SEC-001, and POL-VER-001 are approved before collection of production account, property, identity, or location data.
- POL-PAY-001 and POL-DSP-001 are approved before payment, escrow, payout, refund, settlement, or financial-dispute capability is enabled.
- POL-MSG-001 is approved before production relay messaging is enabled.
- POL-NOT-001 is approved before optional notification preferences or escalation is enabled.
- POL-RSK-001 is approved before production administrative actions are enabled.
- REG-MKT-001 contains evidence for every quantitative or trust claim shown on public pages.
- Monitoring, alerting, backups, restoration tests, and operational runbooks pass controlled demonstrations.
- Placeholder data, mock success responses, development access controls, and unsupported claims are removed or protected by non-production feature flags.
- Every open decision that affects the release scope is closed and linked to its resulting policy, contract, or requirement revision.

# 15. Approval

| Role | Name | Decision | Date |
| --- | --- | --- | --- |
| Product owner |  |  |  |
| Engineering lead |  |  |  |
| Quality assurance lead |  |  |  |
| Security or privacy reviewer |  |  |  |
| Operations lead |  |  |  |
| Business or legal approver |  |  |  |
