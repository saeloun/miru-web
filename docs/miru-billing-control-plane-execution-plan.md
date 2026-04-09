# Miru Billing Control Plane Execution Plan

## Objective

Ship Phase 1 of Miru billing as a focused Stripe-first product that helps service businesses send country-correct, procurement-friendly invoices without breaking existing customers.

This plan assumes the strategy in [miru-stripe-invoicing-ar-plan.md](/Users/sward/saeloun/miru-web/docs/miru-stripe-invoicing-ar-plan.md).

## Phase 1 Product Promise

A Stripe-connected merchant can:

- see whether payments are ready
- complete an invoice profile for their country
- preview a procurement-friendly invoice
- catch missing compliance fields before send
- send the invoice with a Stripe-backed payment flow

Phase 1 country packs:

- `US`
- `EU`
- `India`
- `Singapore`
- `UAE / Dubai`

Still not “global from day one.” But this is now the real required launch set.

## Non-Goals

Do not build these in Phase 1:

- full merchant-of-record flows
- Paddle support
- quotes
- usage billing
- deep collections automation
- marketplace-grade multi-party settlement abstraction
- all-country invoice packs

## Primary Surfaces

The first release is centered on three surfaces only.

## 1. Payments Setup

Question answered:

`Can I collect money yet?`

Must show:

- Stripe connected or not
- onboarding incomplete or complete
- charges enabled
- payouts enabled
- remediation required
- migration state for existing customers

## 2. Invoice Profile

Question answered:

`Do I have the business, tax, and invoice defaults required to send invoices correctly?`

Must show:

- country pack
- seller legal identity fields
- tax registration details
- customer profile defaults
- compliance completeness state
- template defaults

## 3. Invoice Preview And Send

Question answered:

`Will this invoice pass procurement and get paid?`

Must show:

- rendered preview
- warnings
- blockers
- payment methods enabled
- final payment link / hosted invoice path

## Engineering Verdict

This plan is viable.

The main trap is overbuilding the abstraction layer before the Stripe-first wedge works.

The right architecture is:

- additive schema
- Stripe remains the only live provider in Phase 1
- adapter boundary introduced now
- capability-driven UI
- migration with fallback reads
- explicit compliance profile model

The wrong architecture is:

- rewriting existing Stripe logic wholesale
- introducing a fake universal payment abstraction that hides provider differences
- shipping all country packs at once
- trying to solve collections, quotes, and provider expansion together

## Existing Repo Fit

Miru already has useful billing primitives:

- Stripe gem integration in [Gemfile](/Users/sward/saeloun/miru-web/Gemfile)
- Stripe connected account model in [stripe_connected_account.rb](/Users/sward/saeloun/miru-web/app/models/stripe_connected_account.rb)
- payment settings controllers in [payment_settings_controller.rb](/Users/sward/saeloun/miru-web/app/controllers/api/v1/payment_settings_controller.rb)
- Stripe invoice payment services in [app/services/invoice_payment](/Users/sward/saeloun/miru-web/app/services/invoice_payment)
- Stripe webhook handling in [stripe_controller.rb](/Users/sward/saeloun/miru-web/app/controllers/webhooks/stripe_controller.rb)

This matters.

Phase 1 should extend and wrap these, not replace them.

## Delivery Strategy

Implement in five phases:

1. additive schema and provider-account foundation
2. migration and fallback reads
3. Payments Setup
4. Invoice Profile
5. Invoice Preview And Send

Collections visibility is supporting scope and should be added only after preview/send is solid.

## Phase 0, Foundations

### Goal

Introduce the minimum normalized billing layer without breaking the current Stripe path.

### Build

- `payment_provider_accounts`
- `billing_customers`
- `billing_compliance_profiles`
- `billing_customer_profiles`
- `billing_invoice_templates`
- `billing_invoice_previews`

### Migrations

Add schema only.

No runtime cutover.

### Flags

- `billing_provider_accounts`
- `billing_compliance_profiles`
- `billing_country_packs`

### Acceptance

- migrations run cleanly
- no existing Stripe flow changes
- new tables are unused by default

## Phase 1, Migration And Fallback Reads

### Goal

Backfill existing Stripe customers into the new model safely.

### Build

- backfill `payment_provider_accounts` from `stripe_connected_accounts`
- backfill `billing_customers` from `clients.stripe_id`
- seed one default compliance profile per migrated company
- create company migration state markers
- fallback read services for provider account and billing customer lookup
- migration health report job

### Migration Rules

- jobs must be idempotent
- jobs must be resumable
- new records may be seeded from legacy records
- legacy records must not overwrite newer normalized data after migration state flips

### Acceptance

- one provider account row per connected Stripe company
- one billing customer row per `(company, client, provider)`
- no duplicate active mappings
- sampled existing invoices still produce payment URLs

## Phase 2, Payments Setup

### Goal

Ship the first primary surface.

### Backend

- provider account query layer
- onboarding status presenter
- remediation status support
- capability display payload

### Frontend

- provider connection card
- onboarding progress panel
- charges/payouts state display
- remediation CTA
- migration state badge

### API Contract

Response must include:

- provider
- connection_status
- onboarding_status
- charges_enabled
- payouts_enabled
- details_submitted
- remediation_required
- capabilities
- migration_state

### Acceptance

- internal users can distinguish connected vs ready vs blocked
- existing Stripe-connected customers show a valid state after migration

## Phase 3, Invoice Profile

### Goal

Ship the second primary surface and the main product wedge.

### Backend

- compliance profile CRUD
- country-pack rule service
- completeness evaluator
- seller identity validator
- customer billing profile defaults

### Frontend

- Invoice Profile wizard
- country pack selector
- seller legal/tax form
- template defaults editor
- completeness status UI

### Country Packs To Ship

`US`

- seller legal name
- remit-to address
- EIN label support
- sales-tax-friendly summary labels
- PO reference support

`EU`

- legal entity details
- VAT ID support for seller and buyer
- reverse-charge note support
- intra-EU B2B presentation defaults
- VAT summary visibility
- EUR-first defaults where applicable

`India`

- legal entity details
- GSTIN support
- place of supply
- CGST / SGST / IGST line display support
- invoice numbering emphasis

`Singapore`

- legal entity details
- GST registration support
- SGD defaults
- procurement-friendly footer defaults

`UAE / Dubai`

- legal entity details
- TRN support
- VAT summary visibility
- invoice footer defaults for UAE business context

### Data Rules

- country-pack defaults are data-backed
- warning rules are backend-generated
- blocker rules are backend-generated
- React consumes normalized completeness payload, it does not recreate compliance logic

### Acceptance

- admin can save a compliance profile for US, EU, India, Singapore, or UAE / Dubai
- completeness state updates correctly
- missing required fields are visible before send

## Phase 4, Invoice Preview And Send

### Goal

Ship the third primary surface.

### Backend

- invoice preview generator
- send-readiness validator
- warning/blocker classifier
- hosted invoice link resolver
- Stripe-backed invoice sync hook

### Frontend

- invoice preview page
- warnings panel
- blockers panel
- final send CTA
- payment methods summary

### Source Of Truth Rule

For Phase 1:

- Miru owns compliance profile, validation, and preview
- Stripe owns final hosted payment surface

The preview may only promise parity for guaranteed critical fields:

- seller identity
- buyer identity
- tax IDs
- tax summary
- due date
- payment instructions
- PO reference
- compliance notes

### Acceptance

- preview renders from the compliance profile
- blockers prevent send
- warning-only invoices can still be sent
- final hosted invoice path remains functional

## Phase 5, Supporting Collections Visibility

### Goal

Add enough AR visibility to support follow-through.

### Build

- overdue view
- failed payment view
- partially paid view
- reminder schedule summary
- collection activity log

### Important Rule

This is support scope. Do not let it delay Invoice Profile or Preview And Send.

## Provider Adapter Contract

Adapters should expose one internal interface.

Required methods:

- `account_status(company:)`
- `account_capabilities(company:)`
- `onboarding_url(company:, return_url:, refresh_url:)`
- `upsert_customer(company:, client:)`
- `create_invoice(invoice:)`
- `sync_invoice(invoice:)`
- `payment_url(invoice:)`
- `issue_credit(invoice:, amount:, reason:)`
- `record_refund(payment:, amount:, reason:)`
- `normalize_event(payload:)`
- `supports?(capability, company:)`

In Phase 1, only Stripe uses this contract in production.

Razorpay should implement the same interface in Phase 2.

### Webhook And Event Security Requirements

Adapters must not normalize untrusted events directly.

Each provider implementation must define:

- signature verification
- event ID extraction
- replay protection strategy
- duplicate-event handling
- idempotent processing key

Processing order must be:

1. verify signature
2. parse event safely
3. check replay / duplicate state
4. normalize event
5. apply state transition idempotently

## Security Requirements

### Data Protection

Encrypt at rest where appropriate for:

- tax identifiers
- sensitive business identity fields
- provider-linked identifiers if operationally sensitive

Mask by default in UI and logs:

- tax IDs
- hosted payment URLs
- confidential payment instructions

### Authorization

Define explicit policy checks for:

- provider connect / remediation
- compliance profile edit
- tax ID view
- payment instruction edit
- invoice preview
- invoice send
- credit / refund actions
- migration job triggers

### Rendering Safety

Preview rendering must escape all user-controlled content.

Phase 1 should avoid rich text unless a reviewed sanitizer policy exists.

Do not allow preview and final render paths to diverge on escaping rules for guaranteed-parity fields.

### Tenant Isolation

All normalized billing reads and writes must be scoped by company first.

Do not resolve:

- customers
- provider accounts
- invoice mappings

By foreign IDs alone.

## Code Ownership By Surface

## Payments Setup

Backend ownership:

- provider account models
- onboarding services
- payment settings serializers/controllers

Frontend ownership:

- payment settings page
- provider connection components
- onboarding status components

## Invoice Profile

Backend ownership:

- compliance profile models
- country-pack services
- completeness evaluator

Frontend ownership:

- invoice profile wizard
- completeness UI
- country/template editor

## Invoice Preview And Send

Backend ownership:

- preview generation service
- send-readiness validator
- provider invoice sync / payment URL services

Frontend ownership:

- preview page
- warning/blocker panels
- send confirmation flow

## Rollout Flags

- `billing_provider_accounts`
- `billing_compliance_profiles`
- `billing_country_packs`
- `billing_invoice_preview_v2`
- `billing_stripe_migration_reads`
- `billing_stripe_migration_writes`
- `billing_razorpay_adapter`
- `billing_country_pack_us`
- `billing_country_pack_eu`
- `billing_country_pack_india`
- `billing_country_pack_singapore`
- `billing_country_pack_uae`

## Rollout Sequence

1. ship additive schema
2. deploy app code with all new flags default-off
3. run provider-account and billing-customer backfill
4. inspect migration health report and invariants
5. enable fallback reads
6. enable Payments Setup internally
7. enable Invoice Profile internally
8. enable Invoice Preview And Send for selected migrated companies
9. enable country packs in batches:
   - `US`, `EU`, `India` first
   - `Singapore`, `UAE / Dubai` after the same QA matrix passes
10. expand rollout
11. start Razorpay adapter work behind flag

## Ticket Breakdown

## Epic 1, Billing Schema Foundation

### Ticket 1.1

Create migrations for:

- `payment_provider_accounts`
- `billing_customers`
- `billing_compliance_profiles`
- `billing_customer_profiles`
- `billing_invoice_templates`
- `billing_invoice_previews`

### Ticket 1.2

Add model validations and uniqueness constraints for:

- provider accounts
- billing customers
- default active compliance profile

### Ticket 1.3

Add factories for new billing models.

## Epic 2, Migration And Fallback

### Ticket 2.1

Backfill `payment_provider_accounts` from existing Stripe connected accounts.

### Ticket 2.2

Backfill `billing_customers` from client Stripe ids.

### Ticket 2.3

Seed default compliance profiles for migrated companies.

### Ticket 2.4

Add migration state markers and a migration health report.

### Ticket 2.5

Implement fallback reads for provider accounts and billing customers.

## Epic 3, Payments Setup

### Ticket 3.1

Create provider account presenter / serializer.

### Ticket 3.2

Add Payments Setup backend endpoint.

### Ticket 3.3

Build Payments Setup UI with:

- connection state
- onboarding progress
- charges/payouts state
- remediation CTA

## Epic 4, Invoice Profile

### Ticket 4.1

Implement country-pack rule service for `US`, `EU`, `India`, `Singapore`, and `UAE / Dubai`.

### Ticket 4.2

Implement compliance profile CRUD.

### Ticket 4.3

Implement completeness evaluator with warnings and blockers.

### Ticket 4.4

Build Invoice Profile wizard UI.

### Ticket 4.5

Add customer billing defaults and tax profile support.

## Epic 5, Invoice Preview And Send

### Ticket 5.1

Implement preview generation service.

### Ticket 5.2

Implement send-readiness validator.

### Ticket 5.3

Build preview page with warnings vs blockers.

### Ticket 5.4

Integrate hosted invoice link resolution and final send path.

## Epic 6, Collections Visibility

### Ticket 6.1

Add overdue, failed, and partially paid summary queries.

### Ticket 6.2

Build light collections visibility UI.

## Epic 7, Razorpay Phase 2 Prep

### Ticket 7.1

Create provider adapter base contract and Stripe implementation wrapper.

### Ticket 7.2

Add Razorpay adapter skeleton behind feature flag.

## Testing Plan

### Model / Service Specs

Add focused RSpec coverage for:

- compliance profile validation
- country-pack completeness rules
- migration backfill services
- adapter contract behavior
- webhook verification and replay handling
- authorization policies for billing actions
- masking / redaction behavior for sensitive fields
- preview generation
- send-readiness validation

### Request Specs

Add request coverage for:

- Payments Setup API
- Invoice Profile CRUD
- preview and send-readiness endpoints

### Browser Verification

For each shipped country pack:

- configure profile in browser
- verify masked / unmasked tax ID behavior where applicable
- preview invoice
- verify missing fields block send
- verify warning-only fields do not
- verify final payment path still works
- verify final Stripe-hosted page reflects guaranteed critical fields

### QA Matrix

For each country pack, run at minimum:

1. missing required seller tax field, blocked
2. missing required buyer field, blocked when profile requires it
3. warning-only missing optional field, send still allowed
4. successful preview and send
5. final hosted invoice verification

Run this for:

- `US`
- `EU`
- `India`
- `Singapore`
- `UAE / Dubai`

### Migration Verification

Before rollout:

- run backfill on staging-like data
- inspect migration health report
- verify sample existing Stripe customers still show working payment state
- verify acceptance thresholds:
  - `0` duplicate active provider accounts
  - `0` duplicate active billing customers
  - `100%` migrated companies have a default compliance profile
  - sampled existing invoices retain payment URL behavior

## DevOps Launch Checklist

### Pre-Deploy

- additive schema reviewed for online migration safety
- feature flags created and defaulted off
- backfill jobs tested in staging-like data
- rollback owner assigned
- deploy owner assigned
- QA owner assigned

### Deploy Order

1. deploy schema
2. deploy app code with flags off
3. run backfill jobs
4. review migration health report
5. enable fallback reads
6. enable internal Payments Setup / Invoice Profile / Preview
7. run browser QA matrix
8. enable `US`, `EU`, `India`
9. rerun smoke checks
10. enable `Singapore`, `UAE / Dubai` only if prior matrix passes

### Rollback Triggers

Roll back or disable flags if any of these occur:

- migration report shows duplicate active mappings
- sample existing Stripe invoices lose payment URL access
- preview/send produces mismatched critical fields
- webhook processing creates duplicate or incorrect state transitions
- company-scoped billing data appears cross-tenant

### Post-Deploy Smoke Checks

- existing Stripe-connected company shows correct Payments Setup state
- migrated company can open Invoice Profile
- each enabled country pack can reach preview
- blocked invoice cannot send
- valid invoice can send
- final hosted invoice path works
- no fresh error spikes in logs or Sentry for billing paths

## Success Metrics

- percentage of migrated Stripe companies with active compliance profiles
- invoices blocked before send due to missing compliance data
- reduction in manual invoice edits before send
- reduction in invoice rejections due to format/compliance issues
- support volume for invoice-format problems

## Exit Criteria For Phase 1

Phase 1 is complete when:

1. `US`, `EU`, `India`, `Singapore`, and `UAE / Dubai` country packs are live
2. existing Stripe customers can be migrated without payment regression
3. the three primary surfaces are live
4. preview/send catches missing compliance fields before send
5. Stripe remains functional as the only live provider adapter
6. launch checklist passes with no blocking migration or tenant-isolation failures

## Phase 2 Entry Criteria

Only start Razorpay implementation after:

- Phase 1 migration is stable
- country-pack model is proven
- provider adapter contract is used cleanly by Stripe
- preview/send flow is trusted by merchants
