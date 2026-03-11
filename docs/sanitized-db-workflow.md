# Sanitized DB Subset Workflow

This repo uses a sanitized PostgreSQL subset for realistic local and staging data without committing dumps or leaking production data.

## What lives in git

- `config/data_subsets/miru.yml`
- `script/data_subsets/build.rb`
- `script/data_subsets/r2.rb`
- `bin/build-sanitized-subset`
- `bin/restore-sanitized-subset`
- this document

Actual dump files do not belong in git. `tmp/migration/*.dump` and `tmp/data_subsets/*.dump` are ignored.

## Current subset rules

- source: production dump restored into a temporary database
- tenant: `company_id = 2` (`Saeloun Inc`)
- date window: `2025-01-01` onward
- internal users: rewritten to `@saeloun.com`
- client users: rewritten to `@example.com`
- attachments, Ahoy data, Solid Queue data, and similar operational tables are stripped

## Required tools

- PostgreSQL CLI tools: `createdb`, `dropdb`, `pg_restore`, `pg_dump`
- project runtime via `mise`

## Required environment

For bucket creation and artifact upload/download through Wrangler:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- optional `SANITIZED_SUBSET_R2_BUCKET`
- optional `SANITIZED_SUBSET_R2_PREFIX`

## Build a sanitized subset

1. Place the source production dump on disk.
2. Point `config/data_subsets/miru.yml` or `SOURCE_DUMP` at that file.
3. Run:

```bash
mise exec -- ./bin/build-sanitized-subset
```

This will:

- create a temporary working database
- restore the source dump
- run schema migrations against the working database
- prune to the selected tenant and date window
- sanitize emails and selected business fields
- write a sanitized dump to `tmp/data_subsets/`

To upload the generated artifact to R2:

```bash
UPLOAD_TO_R2=1 mise exec -- ./bin/build-sanitized-subset
```

## Restore locally

From an existing local artifact:

```bash
mise exec -- ./bin/restore-sanitized-subset miru_development
```

From the latest artifact in R2:

```bash
DOWNLOAD_FROM_R2=1 mise exec -- ./bin/restore-sanitized-subset miru_development
```

The restore script recreates the target database, restores the dump, then runs:

- `rails db:migrate`
- `rails data:migrate`
- `script/data_subsets/post_restore.rb`

The post-restore step normalizes the dataset for testing:

- sets every user password to `password`
- confirms any unconfirmed users
- clears reset-password tokens

To use a different shared password:

```bash
SANITIZED_SUBSET_TEST_PASSWORD=secret123 mise exec -- ./bin/restore-sanitized-subset miru_development
```

To skip user normalization:

```bash
POST_RESTORE_NORMALIZE_USERS=0 mise exec -- ./bin/restore-sanitized-subset miru_development
```

## Restore to staging

1. Download the latest sanitized dump locally or from R2.
2. Restore it into the staging database from a trusted environment.
3. Run application migrations after restore.
4. Run the post-restore normalization step so test logins work.

If staging already has the app code deployed, the same artifact can be restored using:

```bash
DOWNLOAD_FROM_R2=1 TARGET_DATABASE_URL=<staging database url> mise exec -- ./bin/restore-sanitized-subset <db_name>
```

For Render or another remote app where the database host is only reachable from inside the service network:

1. Copy the sanitized dump to the app instance.
2. Reset the target schema.
3. Restore the dump.
4. Run:

```bash
cd /rails/app
bundle exec rails runner script/data_subsets/post_restore.rb
```

That avoids the broken ad hoc password-reset path and makes deployed subset users immediately testable.

Only use sanitized subset artifacts for staging, never raw production dumps.

## Bucket bootstrap

Create the bucket once with Wrangler:

```bash
CLOUDFLARE_API_TOKEN=... CLOUDFLARE_ACCOUNT_ID=... mise exec -- npx -y wrangler r2 bucket create miru-sanitized-subsets
```

The upload script stores:

- an immutable timestamped dump
- `latest.dump` for simple restore automation

## Safety rules

- never commit dump files
- never commit real production credentials
- do not restore raw production data into local or staging app databases
- keep the subset build deterministic and scriptable
- validate the generated subset counts before uploading or restoring

## Expected verification after build

Check the working database or restored database for:

- only one company
- all internal users on `@saeloun.com`
- all client users on `@example.com`
- data starting from `2025-01-01`
- no Active Storage blobs or attachments
- no Ahoy visit/event data
- invoice-linked timesheets may include pre-2025 work dates when they are needed to preserve kept invoice history

## Typical commands

Build locally:

```bash
mise exec -- ./bin/build-sanitized-subset
```

Build and upload:

```bash
UPLOAD_TO_R2=1 mise exec -- ./bin/build-sanitized-subset
```

Restore latest locally:

```bash
DOWNLOAD_FROM_R2=1 mise exec -- ./bin/restore-sanitized-subset miru_development
```
