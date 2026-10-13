# Native Google authentication

Implementation baseline: `bc0443ca6358de172f9e7a93498a12d3a09d5344`.

The isolated native iOS contract reuses the existing Google HTTPS registration
and callback. Native browser handoff is fixed to
`miru-native-ios://auth/google` and carries only request_id, code and state.
API credentials are returned only through a PKCE-protected one-use JSON exchange.
Workspace onboarding and additional verification outcomes carry no API token.
Production migration, provider-console changes, push and deployment are excluded.

## Request and browser handoff

POST `/api/v1/native/auth/google/requests` with JSON:

```json
{"platform":"ios","intent":"login","code_challenge_method":"S256","code_challenge":"<43 URL-safe characters>","state":"<32 to 128 URL-safe characters>"}
```

`intent` is `login` or `signup`. Optional `invitation_token` binds an existing,
valid invitation; role, company and redirect parameters are rejected. Native
clients generate a fresh random state and RFC 7636 verifier for each request.
The 201 response has exactly `request_id`, `authorization_url`, and `expires_at`.
Request IDs and callback codes are 64 lowercase hexadecimal characters.
The authorization URL is the current host's `/native/auth/google/<request_id>`,
with no query, fragment or credentials. Production HTTPS configuration applies;
localhost test browser checks use HTTP only.

The browser bridge binds the request to a one-use session nonce and renders a
CSRF-protected POST to the existing `/users/auth/google_oauth2` strategy with
`prompt=select_account`. It reuses `GOOGLE_OAUTH_CLIENT_ID` and
`GOOGLE_OAUTH_CLIENT_SECRET`; no provider registration or redirect changes are
required. Successful browser callbacks redirect to
`miru-native-ios://auth/google?request_id=<id>&state=<state>&code=<code>`.
Failure callbacks replace `code` with a bounded `error` value. The native client
must validate the exact scheme, host, path, request ID and state before exchange.
Native provider failure dispatch requires the pinned middleware's
`omniauth.error.strategy` to identify Google; GitHub failures keep existing web
handling even after an abandoned native request. A missing authoritative strategy
returns 400 without consuming that request. Provider query parameters are ignored.

## Exchange

POST `/api/v1/native/auth/google/exchanges` with JSON:

```json
{"request_id":"<64 lowercase hex>","code":"<64 lowercase hex>","code_verifier":"<43 to 128 RFC 7636 characters>"}
```

Requests expire after ten minutes; callback codes after one minute, bounded by
request expiry. PostgreSQL row locks ensure one accepted exchange, including
simultaneous requests. Only hashes of request IDs, codes, browser binding and
the account authentication state are stored. Exchange rechecks confirmation,
active authentication state, SSO restrictions, current kept workspace membership,
role, and factor policy before issuing credentials. Responses disable caching.

The 200 `signed_in` response adds `status: "signed_in"` to the unchanged mobile
auth payload: `user` (including API `token`), `company`, and `company_role`.
Existing `X-Auth-Email` / `X-Auth-Token` headers continue to work. The 200 pending
responses contain exactly these fields and no user, workspace or API token:

```json
{"status":"needs_workspace","continuation_url":"https://<current-host>/","notice":"Continue in Miru web to create or join a workspace."}
```

```json
{"status":"additional_verification_required","continuation_url":"https://<current-host>/","notice":"Sign in to Miru web with your configured verification method."}
```

The root continuation has no query, fragment or credentials and does not transfer
browser authentication or complete MFA. Users authenticate through existing web
onboarding/verification. The native flow neither changes an unrelated existing
web session nor adds Google identities or accepts invitations before MFA.

Malformed starts return 422 `failed` / `invalid_request`; unknown or used
invitations return `invitation_unavailable`. Exchanges uniformly return 422
`failed` / `invalid_handoff` for invalid, expired, cancelled, stale or replayed
grants. Cross-origin JSON requests return the existing auth guard's 403 response.
Native start, exchange and browser GET share a ten-per-minute IP throttle and
return the existing 429 shape. A discarded/expired browser request returns 410.

Browser identity failures use `invalid_identity`, `identity_conflict`,
`account_unavailable`, `signup_required`, `signup_unavailable`, `sso_not_allowed`,
`workspace_unavailable`, or `invitation_unavailable`; provider cancellation/errors
use `provider_error`. No error URL carries identity or bearer data.

## Identity, invitations and compatibility

Only a verified Google email (`email_verified == true`) and stable subject may
resolve a confirmed, active account. An existing Google subject must have one
owner and match that account's verified email; different existing Google subjects
are rejected. A native PostgreSQL advisory subject lock and user lock serialize
native linking. Existing web/RN authentication behavior is preserved; this change
does not add a global identity uniqueness constraint or redesign legacy linking.

Login cannot create users. Signup preserves User validation and produces a
confirmed Google account with no workspace token until onboarding is complete.
Invitations use the existing recipient, expiry, seat and role checks through
CreateInvitedUserService; failed acceptance rolls back. Explicit valid invitation
acceptance selects that invited workspace through the existing service. Normal
login preserves the selected workspace and rejects foreign pointers.
SSO is checked again after invitation acceptance inside the same transaction,
before linking or issuing a code, so disallowed target domains also roll back the
invitation, membership, roles, workspace selection and any new signup.

Native broker path IDs and custom callback query values are redacted in Rails
request/redirect logs. The pinned structured Console adapter receives a redacted
notification response copy because it reads raw Location headers; actual response
headers and callback routing stay intact. Non-native request and redirect logging
keeps its existing behavior. Infrastructure access logging is outside this patch.

The reversible migration creates only `native_google_auth_requests`; cascading
foreign keys invalidate grants when their account/workspace/invitation is hard
deleted. Expiry is enforced on every operation. Automatic expired-row pruning is
not introduced here and is a future operational maintenance item.

## Validation and limitations

Run the relevant auth specs with an exclusively task-owned synthetic database:

```sh
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1/miru_native_google_test_20261013 RAILS_ENV=test SKIP_VITE_TEST_BUILD=1 bundle exec rspec spec/models/native_google_auth_request_spec.rb spec/requests/api/v1/native/google_auth_spec.rb spec/requests/users/omniauth_callbacks spec/lib/authentication spec/lib/native_google_auth_log_redaction_spec.rb spec/services/sso_enforcement_spec.rb spec/requests/api/v1/users/sessions spec/controllers/api/v1/users/sessions_controller_spec.rb spec/requests/api/v1/users/registrations/create_spec.rb spec/requests/api/v1/users/totp_spec.rb spec/requests/api/v1/users/passkeys_spec.rb spec/services/passkeys/challenge_token_spec.rb spec/requests/api/v1/sso_settings_spec.rb spec/requests/rack_attack/auth_throttle_spec.rb
```

150 examples passed, including real concurrent exchange, fixed callback scope,
CSRF, rate limit, PKCE/replay/expiry, verified identity, invitation policy,
tenant/factor constraints, rejected-invitation rollback, mixed-provider failures,
captured-log redaction/non-native compatibility and legacy auth regressions. The supported Vite skip
avoids unrelated frontend building; no frontend assets changed. Signup jobs and
provider results are synthetic. Changed-file RuboCop passed (15 files).
Brakeman has one unchanged baseline warning and zero new warning fingerprints or
errors. Offline bundler-audit reports the unchanged baseline rack-proxy 0.7.7
advisory GHSA-42qh-8mx8-7wqm; Gemfile/lock are unchanged.

No live Google login, production migration, account mutation or deployment was
performed. Five independent source reviews and the parent's integration gates
remain required before any commit/push.

Local Playwright rendered the actual bridge at 390 by 844 and submitted its
provider POST with CSRF enabled and all non-localhost network disabled. A mocked
verified signup created a durable `needs_workspace` code. Chromium could not open
the unregistered native custom scheme; this is a desktop test limitation, not a
claim that the production iOS session or live provider was exercised. Request
specs independently verify the exact custom callback and PKCE exchange.
