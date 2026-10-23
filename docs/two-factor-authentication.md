# Two-factor authentication

Users configure authenticator apps and passkeys in **Settings → Profile → Edit**.
Both can be enabled together; either completes verification after primary sign-in.
Authenticator setup includes a QR code and downloadable, single-use recovery codes.
Passkeys support device verification such as Touch ID, iCloud Keychain and Windows Hello.

Browser trust is opt-in, expires 30 days after verification, and does not extend on subsequent sign-ins.
Password, authenticator, recovery-code regeneration and passkey changes revoke existing trust.
Users can revoke all trusted browsers after confirming their password.
Google/GitHub and web phone OTP also respect the configured second factor.
Native clients that cannot complete the challenge are directed to the web app.

## Deployment

- Configure durable `ACTIVE_RECORD_ENCRYPTION_PRIMARY_KEY`, `ACTIVE_RECORD_ENCRYPTION_DETERMINISTIC_KEY` and `ACTIVE_RECORD_ENCRYPTION_KEY_DERIVATION_SALT`, or their existing Rails credentials equivalents, before migration. These are the same encryption keys used for employee records.
- Run the new migrations to create single-use login challenges, encrypt existing authenticator secrets, and add the browser-trust revocation version.
- Coordinate the backfill with application replacement: the previous code cannot read encrypted authenticator secrets. Do not leave old application instances serving authentication after the backfill, or roll back to code without encryption support.
- The encryption migration is deliberately irreversible. Preserve the encryption keys with database backups.

## Local verification

Use `http://localhost:3000` for passkey tests; WebAuthn rejects an IP address as a relying-party domain.
Automated browser verification can use a virtual WebAuthn authenticator. Physical Touch ID and iCloud Keychain approval still require a manual check.

Focused verification commands (use the repo's local test database configuration):

```sh
SKIP_VITE_TEST_BUILD=1 rtk mise exec -- bundle exec rspec spec/requests/api/v1/users/second_factor_spec.rb spec/models/user_two_factor_spec.rb
rtk mise exec -- node scripts/ci/passkeys_test.mjs
RAILS_ENV=test rtk mise exec -- timeout 30 bin/vite build
SKIP_VITE_TEST_BUILD=1 rtk mise exec -- bundle exec rspec spec/system/auth/two_factor_spec.rb
```

The authentication system spec and passkey parser check also run in CI.
