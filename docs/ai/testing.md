# Repo Testing

## General

- Run the smallest relevant test set first, then widen if needed.
- For list pages and report surfaces, verify loaded counts, ordering, and continued loading behavior in the browser.
- Do not assume an API sort change fixed the UI if the frontend can still re-sort or truncate the data.

## Frontend

- After frontend changes, run `rtk mise exec -- timeout 30 bin/vite build`.
- For authorization or role changes, verify with real user flows in the browser when practical.
- For browser crashes, verify the affected page, perform the crashing action, check console errors, and capture a meaningful screenshot checkpoint.

## Ruby

- For Ruby changes, run focused `rspec` files related to the touched code.

## Mailers

- Run focused mailer specs.
- Verify rendered previews in the browser for representative desktop and mobile widths.
