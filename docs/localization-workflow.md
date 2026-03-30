# Localization Workflow

Miru now ships with a small, maintainable first batch of product locales:

- `en`
- `hi`
- `mr`
- `es`
- `fr`
- `de`
- `pt-BR`
- `ja`
- `zh-CN`

The current product focus is:

- full product fallback in English
- native-first copy for Hindi and Marathi
- selective backfills for other high-usage global languages

## Principles

- English remains the canonical source copy.
- Hindi and Marathi are the first Indian-language quality targets.
- Other locales can ship incrementally as long as English fallback remains safe.
- We do not use runtime machine translation in the product.
- Every translated change should be reviewable in git.

## Tooling

Miru uses `i18n-tasks` to keep locale keys maintainable.

Common commands:

```bash
mise exec -- bundle exec i18n-tasks health
mise exec -- bundle exec i18n-tasks missing
mise exec -- bundle exec i18n-tasks unused
```

Use these commands before and after larger translation backfills so key drift does not accumulate.

## Browser Defaults

Miru detects and stores these browser hints on the client:

- locale
- country
- timezone

These are used to improve the first-run experience for:

- sign in and sign up locale defaults
- organization setup country selection
- organization setup timezone selection
- initial currency and date-format defaults

The browser hint is only a default. The user setting remains authoritative once saved.

## Translation Backfill Workflow

When backfilling copy:

1. add or update English source copy first
2. run `i18n-tasks missing`
3. backfill Hindi and Marathi in the same batch where practical
4. backfill the next global locales in small reviewable slices
5. run `i18n-tasks health`
6. verify changed pages in the browser

Do not bulk-translate the whole app blindly.

Ship translation batches by surface:

- auth
- navigation
- preferences
- onboarding
- invoices
- time tracking

## AI-Assisted Translation

AI can help draft translations, but the generated text still needs product review.

Recommended flow for Indian languages:

- use Sarvam OSS models for Hindi and Marathi draft generation
- keep English source and product intent next to the prompt
- review terminology for finance, billing, and time-tracking vocabulary before shipping

Recommended flow for other global languages:

- use offline or reviewable batch generation
- commit generated changes as normal source diffs
- keep fallback English in place until the translated surface is verified

## Review Expectations

Before shipping a locale batch:

- run focused specs for touched backend behavior
- run `mise exec -- timeout 30 bin/vite build`
- verify the changed UI in a real browser
- confirm language switching works without reload bugs
- confirm saved locale persists across refresh and login

## Scope Discipline

Localization is an ongoing program, not a one-time translation dump.

The preferred strategy is:

- high-quality Hindi and Marathi support first
- manageable expansion for major global languages
- steady surface-by-surface backfills instead of giant unreviewable diffs
