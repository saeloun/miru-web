# Deploying Miru on Render

Miru 3.0 is designed to run on Render with:

- one web service
- one worker service
- one Postgres database
- one Render Key Value instance

For the fastest setup, use the repository Blueprint at the root of the repo:

- [`render.yaml`](../../../../render.yaml)

Or use the one-click button from the main repository README.

## Branch model

- `production`: deploy branch for `app.miru.so`
- `develop`: integration branch
- `stable-3-0`: release preparation branch

## One-click deploy

1. Open the Deploy to Render button from the README.
2. Confirm the Blueprint resources.
3. Fill in the required secret values.
4. Create the stack.
5. Set `APP_BASE_URL` to your Render hostname first, then to your custom domain when DNS is ready.

## Services created by the Blueprint

- `miru-web`
- `miru-worker`
- `miru-db`
- `miru-redis`

## Required environment variables

These should be provided during Blueprint setup or immediately after first deploy:

- `APP_BASE_URL`
- `DEFAULT_MAILER_SENDER`
- `DEFAULT_FROM_EMAIL`
- `REPLY_TO_EMAIL`
- `EMAIL_DELIVERY_METHOD`
- `POSTMARK_API_TOKEN`
- `SENTRY_DSN`
- `STRIPE_SECRET_KEY`
- `STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_ENDPOINT_SECRET`
- `STRIPE_MONTHLY_PRICE_ID`
- `STRIPE_YEARLY_PRICE_ID`
- `STRIPE_PLAN_PAGE_URL`
- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `CLOUDFLARE_R2_ACCESS_KEY_ID`
- `CLOUDFLARE_R2_SECRET_ACCESS_KEY`
- `CLOUDFLARE_R2_BUCKET_NAME`
- `CLOUDFLARE_R2_ENDPOINT`
- `CLOUDFLARE_R2_REGION`

## Custom domain

For production:

1. Add `app.miru.so` as a custom domain in Render.
2. Point DNS at the Render web service.
3. Verify `https://app.miru.so/health`.
4. Verify email/password login.
5. Verify Google OAuth after the callback host changes to the custom domain.

## Worker

The worker runs:

```bash
bundle exec rake solid_queue:start
```

Make sure the worker has the same shared app secrets as the web service.

## Verification after deploy

Run these checks before cutover:

1. `https://<your-domain>/health`
2. log in with a real owner account
3. verify one worker-backed action
4. verify one mailer flow
5. check Sentry for new unresolved errors
