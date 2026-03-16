# Launch Matrix

This repo uses a browser-driven launch matrix to keep role, route, and theme verification repeatable.

The matrix lives in:

- [config/launch_matrix.yml](/Users/sward/saeloun/miru-web/config/launch_matrix.yml)

The runner is:

- [bin/verify-launch-matrix](/Users/sward/saeloun/miru-web/bin/verify-launch-matrix)

The browser implementation is:

- [script/launch_matrix/verify.mjs](/Users/sward/saeloun/miru-web/script/launch_matrix/verify.mjs)

## What it checks

- unauthenticated auth pages
- role-aware redirects
- owner, employee, and client surfaces
- light and dark mode expectations
- visible button and input minimums
- expected text on the page

## Run it

Run all configured checks:

```bash
mise exec -- ./bin/verify-launch-matrix
```

Run specific groups:

```bash
mise exec -- ./bin/verify-launch-matrix auth owner_core
mise exec -- ./bin/verify-launch-matrix employee_core client_core
```

Use a different base URL:

```bash
LAUNCH_MATRIX_BASE_URL=https://miru-production.onrender.com mise exec -- ./bin/verify-launch-matrix auth
```

Write results somewhere else:

```bash
LAUNCH_MATRIX_OUTPUT=tmp/launch_matrix/render.json mise exec -- ./bin/verify-launch-matrix auth
```

## Output

The runner writes:

- `tmp/launch_matrix/results.json`
- `tmp/launch_matrix/results.md`

Failed checks also save screenshots under:

- `tmp/launch_matrix/screenshots/`

## How to use it during launch cleanup

1. Run one or more groups.
2. Fix only real failures.
3. Re-run the same groups.
4. Commit verified fixes immediately.

This is meant to complement focused system specs, not replace them.
