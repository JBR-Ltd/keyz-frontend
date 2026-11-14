# Authentication Hardening TODO

## Goal

Move browser authentication away from readable local storage and keep login, logout, expiry, revocation, role changes, and account changes synchronized across the application and browser tabs.

## Approved Decisions

- Keep the existing revocable 24-hour JWT session model.
- Store the JWT in a persistent HttpOnly cookie managed by the Next.js server.
- Require existing users to sign in again after migration.
- Do not add refresh-token rotation in this phase.
- Preserve the backend bearer-token interface for trusted direct API clients.

## Secure Session Storage

- [ ] Store the JWT in an HttpOnly, SameSite Lax cookie with Path `/` and Secure enabled in production.
- [ ] Derive the cookie expiry from the backend token expiry.
- [ ] Strip `accessToken` from browser-facing authentication responses.
- [ ] Set the cookie after password login, Google login, email verification, and two-factor verification.
- [ ] Clear the cookie after logout, account deletion, deactivation, expiry, or backend session rejection.
- [ ] Remove bearer tokens, roles, and legacy verification state from local storage.
- [ ] Keep the non-sensitive installation identifier in local storage.

## Next.js Authentication Boundary

- [ ] Add server-only helpers for reading, setting, and clearing the session cookie.
- [ ] Add `GET /api/auth/session` using `/api/users/me` as its source of truth.
- [ ] Inject the cookie token into backend Authorization headers inside Next.js proxies.
- [ ] Stop accepting browser-supplied bearer tokens as the frontend session credential.
- [ ] Clear the cookie on backend `401` responses but preserve it on `403` responses.
- [ ] Apply `Cache-Control: no-store` to authentication and authenticated account responses.
- [ ] Validate Origin and Sec-Fetch-Site for cookie-authenticated mutations.
- [ ] Clear the frontend cookie during logout even if backend revocation fails.

## Frontend Synchronization

- [ ] Add one authentication provider with checking, authenticated, and unauthenticated states.
- [ ] Hydrate authentication from `/api/auth/session`.
- [ ] Replace the current RoleGuard local-storage snapshot with shared authentication state.
- [ ] Revalidate on document visibility and window focus.
- [ ] Synchronize tabs using BroadcastChannel with a non-sensitive storage-event fallback.
- [ ] Make receiving tabs re-fetch session state rather than trusting event data.
- [ ] Scope request caching and deduplication by session generation and user ID.
- [ ] Reject late responses after an account or session change.
- [ ] Centralize `401` handling, cache clearing, and one-time login redirection.
- [ ] Remove manual bearer-header construction throughout frontend API clients.
- [ ] Preserve only explicitly non-sensitive recoverable work after session expiry.

## Backend Session Authority

- [ ] Add the precise token expiry to `AuthResponse`.
- [ ] Require the UserSession record to persist before authentication completes.
- [ ] Require a matching active, unexpired, non-revoked session for every JWT request.
- [ ] Load the current user and derive role authority from the database.
- [ ] Reject sessions for inactive or deleted accounts.
- [ ] Make logout transactional and idempotently revoke the current session.
- [ ] Revoke all sessions after password recovery.
- [ ] Preserve the current session and revoke other sessions after password change.
- [ ] Revoke all sessions during account deactivation or deletion.
- [ ] Retain the existing token blacklist during the migration.

## Verification

- [ ] Cover password, Google, email-verification, and two-factor login.
- [ ] Confirm no bearer token is exposed to JavaScript, local storage, or session storage.
- [ ] Cover missing, expired, revoked, blacklisted, inactive-account, deleted-account, and missing-session JWTs.
- [ ] Cover logout, repeated logout, remote revocation, password changes, password recovery, deactivation, and deletion.
- [ ] Cover tenant, landlord, agent, and administrator authorization.
- [ ] Cover same-tab and cross-tab synchronization, focus revalidation, browser reopening, and late responses.
- [ ] Confirm `401` signs out while `403` preserves the session.
- [ ] Confirm cross-site mutations fail and same-origin JSON, multipart, download, and public requests continue working.
- [ ] Run backend authentication tests, frontend TypeScript, focused ESLint, production build, and browser tests for every role.
