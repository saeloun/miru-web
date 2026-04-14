# Miru Billing Control Plane Plan

## Goal

Make Miru the product that helps service businesses send country-correct invoices and get paid without payment-ops chaos.

Miru should feel like the operating system for invoice correctness, merchant readiness, and collections visibility.

That means Miru should own:

- merchant onboarding orchestration
- invoice workflow
- collections and AR operations
- customer billing experience
- provider capability routing

And payment providers should own:

- regulated onboarding flows
- KYC and remediation
- payout rails
- hosted payment pages
- payment method collection
- processor-specific compliance

## Strategic Direction

Build for both `Stripe` and `Razorpay`.

But sequence them differently:

- `Phase 1`: deepen `Stripe`
- `Phase 2`: add `Razorpay`

Do not add `Paddle` now.

Do not try to become full merchant of record across all flows right now.

Do not position Miru as a generic wrapper around one processor.

The real product is:

`Miru = merchant onboarding + invoicing workflow + collections + provider orchestration`

But the wedge is narrower:

`Miru helps merchants send country-correct, procurement-friendly invoices with Stripe first`

That is the Phase 1 story.

Razorpay is Phase 2 because India matters, not because "more gateways" is the product.

## Immediate Priority Shift

Prioritize invoice customization for tax, compliance, and country-specific presentation before deeper AR automation.

Why:

- invoice correctness is table stakes
- country-specific invoice requirements block payment faster than fancy collections logic
- enterprise and procurement teams care about legal and tax details on the invoice itself
- this is one of the fastest ways for Miru to feel more serious than a basic processor-generated invoice

The first visible win should be:

`Miru helps merchants send invoice-complete, country-aware invoices using Stripe first`

## Initial ICP

Start with:

- agencies
- consultancies
- service businesses
- mixed domestic and cross-border invoice senders

Especially teams that hit problems like:

- procurement rejects invoices for missing fields
- tax IDs are missing or inconsistently shown
- invoice format changes by customer or country
- finance teams do manual fixes before every send

Do not optimize Phase 1 for every marketplace or platform shape.

Optimize it for businesses that already do real invoicing and feel invoice-format pain every week.

## Why This Direction Is Right

The real pain is not "can we create an invoice in Stripe?"

The real pain is:

- every merchant must connect and activate payments cleanly
- Miru must know what capabilities that merchant has
- invoice operations need one consistent product surface
- different countries need different rails
- Miru cannot trap itself in one processor if India and global flows diverge

That is a real product.

## Product Thesis

Miru should become:

`the merchant and invoice operating system, with Stripe first and Razorpay next`

Stripe and Razorpay are execution rails underneath.

Miru should own the cross-provider experience:

- connect your gateway
- finish onboarding
- see what is blocked
- create and send invoices
- follow up on collections
- handle credits and adjustments
- normalize payment state and reporting

## Primary User Story

Today:

- a merchant creates an invoice
- Stripe can collect money
- but the invoice still gets rejected for missing tax or compliance information
- ops has to patch it manually

After Phase 1:

- the merchant connects Stripe
- completes an invoice profile for their country and customer type
- sees missing compliance fields before sending
- previews the final invoice
- sends with confidence that the invoice is complete and payable

That is the whole game.

## System Model

Think of the product in three layers.

## Layer 1, Merchant Control Plane

Miru owns:

- provider connection state
- onboarding progress
- capability detection
- missing requirements
- account health
- activation checklist
- routing rules by country and merchant type

Provider owns:

- KYC forms
- identity verification
- bank verification
- compliance remediation

### Key Rule

Miru should orchestrate onboarding, not replace provider-hosted onboarding unless there is a very strong reason.

## Layer 2, Invoice And AR Operating System

Miru owns:

- invoice draft assembly
- approval workflow
- collections workflow
- reminders and due-date policies
- customer-visible vs internal notes
- credit notes and adjustments
- finance cockpit
- invoice and payment normalization across providers

## Layer 3, Provider Adapters

Start with:

- `Stripe` adapter
- then `Razorpay` adapter

Each adapter should expose Miru-level capabilities instead of leaking raw provider behavior everywhere in the app.

## Capability Model

Do not create one fake lowest-common-denominator abstraction.

Create a capability registry.

Each provider account should declare support for capabilities such as:

- merchant onboarding
- invoice creation
- hosted payment page
- payment links
- subscriptions
- ACH
- UPI
- bank transfer instructions
- saved payment methods
- credit notes
- customer portal
- split payouts
- connected accounts
- tax support
- quote support

Miru uses those capabilities to drive UI and routing.

## Where The Pay Gem Fits

## Recommendation

Use the `pay` gem narrowly if at all.

Do **not** make `pay` the foundation of Miru’s multi-gateway invoicing architecture.

## Why Not Use Pay As The Core

The current `pay` gem is strong for Rails app subscription billing and customer billing primitives, especially for a single app charging its own customers.

It supports multiple processors including Stripe and has Stripe Connect docs, but its own README warns that processors behave differently and complex payment setups are best kept on a single provider.

That warning matters here.

Miru is heading toward:

- provider-specific merchant onboarding
- invoice workflows
- connected-account / marketplace patterns
- cross-provider capability routing
- Razorpay support

That is bigger than what `pay` is optimized for.

Also, this repo already has meaningful custom Stripe and Stripe Connect logic in place.

Adding `pay` as the main billing layer now would create overlap and migration drag instead of immediate leverage.

## Where Pay Could Help

Potentially useful, later, for a narrow slice:

- Miru’s own SaaS subscription billing
- basic customer and subscription plumbing for Miru-as-a-product
- customer portal and subscription state helpers if the team wants less custom code there

Potentially not useful for:

- merchant onboarding control plane
- connected-account invoice operations
- Razorpay adapter design
- invoice AR normalization across providers
- procurement-heavy invoice workflow

## Bottom Line On Pay

`pay` can help for Miru’s own subscription plumbing.

`pay` should not be the architectural base for merchant onboarding plus Stripe-first, Razorpay-next invoicing.

## Current Repo Fit

The repo already contains:

- custom Stripe gem usage
- custom Stripe Connect onboarding flow
- `stripe_connected_accounts`
- invoice payment services
- Stripe webhook handling
- Stripe payment settings UI

So the shortest path is to build on top of existing Stripe plumbing, not replace it with `pay`.

## Existing Customer Migration

This plan requires an explicit migration path for existing customers.

Do not treat the new provider-account and compliance models as greenfield-only.

### Migration Goals

- preserve current Stripe functionality for already-connected companies
- backfill new normalized billing records from existing Stripe-linked data
- avoid forcing every existing customer through a broken re-onboarding flow
- surface missing compliance and invoice-template data as progressive tasks, not hard cutovers

### Migration Strategy

Use a staged migration.

### Stage 1, Additive Schema

Add new tables and fields without changing the existing runtime path:

- `payment_provider_accounts`
- `billing_customers`
- `billing_invoices`
- `billing_invoice_events`
- `billing_invoice_templates`
- `billing_collection_policies`
- compliance profile records for invoice presentation

At this stage:

- old Stripe tables and fields remain source-of-truth
- new records are empty or partially backfilled
- app behavior should not change yet

### Stage 2, Backfill Existing Stripe Customers

Backfill from current data such as:

- `companies`
- `stripe_connected_accounts`
- `clients.stripe_id`
- invoice Stripe payment metadata
- existing payment settings

Backfill output should create:

- one `payment_provider_accounts` row per connected Stripe company
- one `billing_customers` row per client with a Stripe customer id
- one initial compliance profile per company using the best available billing identity data
- default invoice template assignments for existing companies

### Stage 3, Progressive Read Path

Read from the new models where data exists.

Fall back to existing Stripe-linked models where it does not.

This avoids a hard flip.

### Stage 4, Progressive Write Path

New onboarding and invoice customization writes should go to the new normalized models first.

Sync adapters can still read old fields during the transition window.

### Stage 5, Activation And Cleanup

Only after:

- backfill is complete
- read paths are stable
- new admin flows are in production

Should the team start deprecating old direct model dependencies.

### Migration UX Rules

Existing customers should not land in a broken state.

Miru should show:

- `connected and migrated`
- `connected but profile incomplete`
- `connected but compliance fields missing`
- `action required to finish invoice profile`

This is much better than forcing all customers through a vague "reconnect Stripe" loop.

### Migration Priorities

Prioritize backfilling:

1. provider account state
2. customer identity mappings
3. invoice customization defaults
4. tax and compliance completeness flags

### Migration Risk

The biggest product risk is shipping the new model but making existing Stripe customers unable to pay or send invoices.

Do not do a big-bang cutover.

## Product Scope

## Phase 1, Stripe Improvements

### Goal

Turn Miru’s current Stripe integration into a real invoice correctness and merchant-readiness product.

### Phase 1 Themes

- improve merchant onboarding orchestration
- prioritize invoice customization for tax and compliance presentation
- improve Stripe invoice workflow
- add enough collections visibility to support payment follow-through
- normalize billing visibility
- keep Stripe-hosted flows where they save time and risk

### Phase 1 Product Promise

A Stripe-connected merchant can:

- see whether payments are ready
- complete a country-aware invoice profile
- preview a procurement-friendly invoice
- fix missing tax and business fields before send
- send the invoice through a Stripe-backed payment flow with confidence

### Phase 1 Workstream A, Merchant Onboarding

Build:

- provider connection dashboard
- Stripe onboarding launch and re-entry flow
- onboarding progress state in Miru
- missing requirement indicators
- charges enabled / payouts enabled / details submitted status
- activation checklist after connect

Miru should show:

- connected or not
- onboarding incomplete or complete
- capabilities available
- what is blocking live invoice collection

### Phase 1 Primary Surfaces

Keep the first release centered on three product surfaces:

`1. Payments Setup`

This answers:

`Can I collect money yet?`

It should show:

- provider connection
- onboarding progress
- charges enabled
- payouts enabled
- remediation required or not

`2. Invoice Profile`

This answers:

`Do I have the legal, tax, and business details required to send invoices correctly?`

It should show:

- country pack
- seller identity completeness
- tax registration details
- customer-facing invoice defaults
- compliance completeness state

`3. Invoice Preview And Send`

This answers:

`Will this invoice pass procurement and get paid?`

It should show:

- rendered preview
- missing fields
- warnings vs blockers
- payment methods enabled
- final send action

### Phase 1 Workstream A1, Existing Stripe Customer Migration

This is part of Phase 1, not later cleanup.

Build:

- backfill job for `payment_provider_accounts`
- backfill job for `billing_customers`
- backfill job for default invoice compliance profiles
- migration health dashboard
- company-level migration state marker
- fallback reads to current Stripe-linked records during rollout

Success means existing Stripe customers keep working while gaining the new invoice customization layer.

### Phase 1 Workstream B, Invoice Workspace

Build:

- invoice draft workspace above Stripe payment flow
- internal notes vs customer-visible notes
- invoice send checklist
- invoice summary preview
- hosted invoice page deep link
- approval and audit timeline

Important scope rule:

The invoice workspace should focus on correctness and send-readiness first.

Do not let it sprawl into a full finance cockpit before the preview and send flow feels excellent.

Keep Stripe responsible for:

- hosted invoice payment page
- PDF
- payment confirmation
- payment method capture

### Phase 1 Workstream C, Collections And AR

Build:

- reminder schedules
- due-date policy UI
- customer collection policy overrides
- overdue queues
- partially paid queue
- failed payment queue
- collections activity log

Engineering review note:

This is supporting scope in Phase 1, not the headline.

Do enough to track payment follow-through, but do not let collections features crowd out invoice correctness.

### Phase 1 Workstream D, Customer Billing Surface

Build:

- customer billing profile completeness
- outstanding invoices view
- invoice PDF access
- billing portal launch point
- saved payment method visibility where supported

### Phase 1 Workstream E, Invoice Presentation

Build:

- template assignment by customer segment
- footer / memo policy
- grouped line item presentation
- procurement-friendly invoice settings
- country-aware compliance blocks
- tax and registration fields by invoice jurisdiction
- seller and buyer identity completeness checks
- invoice preview by country template
- required field warnings before send

### Phase 1 Workstream E1, Tax And Compliance Customization

This moves to the top of Phase 1.

Build invoice customization around a structured compliance profile instead of freeform text.

Miru should support configurable invoice sections for:

- seller legal name
- seller registered address
- seller tax registration numbers
- buyer legal name
- buyer billing address
- buyer tax registration numbers
- place of supply or service location where relevant
- invoice issue date
- due date
- invoice serial / numbering format
- currency
- tax line breakdown
- subtotal, tax total, and grand total
- reverse-charge or tax-exempt notes
- payment instructions
- procurement or PO reference

Miru should support country profiles for major merchant markets first:

- United States
- United Kingdom
- European Union merchant flows
- India
- Canada
- Australia
- Singapore
- United Arab Emirates

Important product rule:

Miru should present these as configurable invoice profiles and warnings, not legal guarantees.

### Design Rule For Country Packs

Country packs should feel like opinionated presets, not giant settings forms.

The user should pick:

- seller country
- invoice customer type
- invoice style / template

Then Miru should prefill:

- labels
- tax field names
- notes
- layout defaults
- warnings

Users can override, but defaults should do most of the work.

### Country Support Model

For each country profile, Miru should support:

- default invoice template
- required seller identity fields
- required buyer identity fields
- tax ID labels
- tax display format
- currency defaults
- numbering rules where configurable
- compliance notes / footer defaults
- PO and procurement field requirements

### Suggested Country Packs

`US`

- EIN / business registration support
- sales-tax-friendly line and summary presentation
- PO and remit-to emphasis

`UK`

- VAT number display
- GBP default formatting
- VAT summary visibility

`EU`

- VAT ID support for seller and buyer
- reverse-charge note support
- intra-EU B2B template variants

`India`

- GSTIN support
- CGST / SGST / IGST display patterns
- place-of-supply support
- invoice numbering and business identity emphasis

`Canada`

- GST / HST registration support
- bilingual-friendly template fields where needed

`Australia`

- ABN support
- tax invoice labeling support
- GST summary presentation

`Singapore`

- GST registration support
- SGD formatting defaults

`UAE`

- TRN support
- VAT summary visibility

### Phase 1 UX For Compliance

Build:

- compliance profile setup wizard
- invoice template preview by country
- missing field checklist before send
- customer tax profile completeness state
- country-specific footer and note presets
- admin override with audit trail

### Design Review Notes

The UX should distinguish clearly between:

- `warning`
- `required before send`
- `recommended for this country`

Do not blur these.

Also separate:

- merchant onboarding blockers
- invoice profile blockers
- invoice-specific blockers

If these are mixed together, the product will feel confusing and heavier than it is.

### Phase 1 KPI

Track:

- invoices blocked by missing compliance fields
- invoices edited after preview due to tax/compliance errors
- payment delays caused by procurement or invoice-format rejection
- country profile adoption by merchants

### Phase 1 Success Criteria

Phase 1 is successful if:

1. existing Stripe customers continue working during migration
2. new and existing customers can complete an invoice profile without support help
3. invoice preview catches missing compliance fields before send
4. merchants can send country-aware invoices without custom manual formatting
5. the product surfaces stay simple enough that onboarding, profile setup, and send flow are obvious

### Phase 1 Workstream F, Exceptions

Build:

- credit note UI
- out-of-band payment logging
- write-off flow
- mark uncollectible flow
- invoice adjustment request flow

### Phase 1 Workstream G, Stripe Capability Surface

Plan around these Stripe-backed capabilities first:

- hosted invoice pages
- customer portal
- ACH Direct Debit
- bank-transfer-friendly invoice configuration where applicable
- quotes
- partial payments
- tax IDs and Stripe Tax
- usage billing hooks for later phases

### Phase 1 Deliverable

By the end of Phase 1, Miru should feel like a real Stripe-based merchant and invoice operating system, not a thin payment-link wrapper.

## Phase 2, Razorpay Adapter

### Goal

Add India-friendly merchant onboarding and payment collection without breaking the Stripe-first architecture.

### Phase 2 Product Promise

The same Miru product surfaces:

- Payments Setup
- Invoice Profile
- Invoice Preview And Send

Should work for India-first merchants through Razorpay with provider-specific capabilities and invoice rules.

### Why Razorpay Phase 2

Razorpay matters when:

- merchant base includes India-first businesses
- UPI is important
- local payment expectations differ from Stripe’s strengths
- Indian account onboarding is materially easier through Razorpay for the target merchant segment

### Phase 2 Workstream A, Provider Adapter

Add a Razorpay adapter with Miru-facing interfaces for:

- provider connection state
- onboarding state
- invoice creation
- payment links / hosted payment collection
- refunds and adjustments where supported
- payment event ingestion

### Phase 2 Workstream B, Merchant Onboarding

Build:

- connect Razorpay flow
- onboarding progress state
- missing requirement and activation status
- provider-specific remediation guidance

### Phase 2 Workstream C, Capability Routing

Add routing rules such as:

- default `Stripe` for global merchants
- default `Razorpay` for India-first merchants
- prefer `Razorpay` when UPI or India-local rails matter
- keep provider-specific limitations visible in UI

### Phase 2 Workstream D, Payment Normalization

Normalize into Miru:

- invoice status
- payment status
- failed collection reasons
- refund / adjustment state
- provider event history

### Phase 2 Deliverable

Miru can onboard and operate merchants on either Stripe or Razorpay while preserving one invoice and AR product surface.

## Phase 3, Quotes, Hybrid Billing, And Deeper AR

After Stripe is strong and Razorpay exists, then expand to:

- quote-to-invoice
- quote-to-subscription for retainers
- usage and hybrid billing
- advanced collections work queues
- customer payment behavior scoring
- finance-owner assignment

## Data Model Direction

Build the model around provider accounts and provider capabilities.

Recommended entities:

- `payment_provider_accounts`
  - company
  - provider
  - provider_account_id
  - connection_status
  - onboarding_status
  - charges_enabled
  - payouts_enabled
  - details_submitted
  - country
  - default_currency
  - capabilities_payload
- `billing_customers`
  - company
  - client
  - provider
  - provider_customer_id
  - billing_profile_status
  - tax_status
- `billing_invoices`
  - invoice
  - provider
  - provider_invoice_id
  - provider_payment_url
  - workflow_state
  - financial_state
  - sync_status
  - last_synced_at
- `billing_invoice_events`
- `billing_collection_policies`
- `billing_invoice_templates`

Add the missing first-class compliance model:

- `billing_compliance_profiles`
  - company
  - provider
  - country_pack
  - customer_type
  - template_style
  - seller_legal_name
  - seller_display_name
  - seller_registered_address
  - seller_tax_ids_payload
  - default_footer
  - default_notes
  - required_fields_payload
  - warning_rules_payload
  - blocker_rules_payload
  - numbering_scheme
  - default_currency
  - active

- `billing_customer_profiles`
  - company
  - client
  - legal_name
  - billing_address
  - tax_ids_payload
  - purchase_order_required
  - purchase_order_number
  - country
  - profile_completeness_state

- `billing_invoice_previews`
  - invoice
  - compliance_profile
  - rendered_payload
  - warnings_payload
  - blockers_payload
  - generated_at
  - source_version

### Compliance Model Rules

1. Compliance rules must not live only in view templates.
2. Country-pack defaults must be data-backed and overridable.
3. Warning and blocker rules must be inspectable in the backend, not recreated ad hoc in React.
4. Invoice preview generation must read from explicit profile data, not mixed legacy fields.

Keep `provider` explicit everywhere relevant.

Do not hide it.

## State Model

Separate Miru workflow from provider financial state.

Miru workflow state:

- `draft`
- `pending_approval`
- `approved`
- `ready_to_send`
- `blocked`

Provider financial state:

- `draft`
- `open`
- `paid`
- `void`
- `failed`
- `partially_paid`
- `uncollectible`

Important rule:

Miru should not invent opaque financial states that cannot be explained in provider terms.

## Architecture Rules

1. Miru orchestrates onboarding. Providers host onboarding UIs where possible.
2. Miru stores provider IDs, sync timestamps, and raw event history.
3. Webhook ingestion must be idempotent.
4. Provider adapter boundaries should live in backend service objects, not be spread across controllers and React components.
5. UI should be capability-driven, not hard-coded to Stripe forever.
6. Stripe remains primary in Phase 1 even while the architecture prepares for Razorpay.
7. Migration must be additive first, with fallback reads until the new provider-account layer is proven stable.
8. Country-pack logic should be data-driven where possible, not scattered across templates and conditionals.

## Security And Compliance Guardrails

Billing data here is not card data, but it is still high-value business and identity data.

Treat it accordingly.

### Sensitive Data Classes

Sensitive fields include:

- seller legal name where private
- seller registered address
- buyer legal name
- buyer billing address
- tax identifiers
- payment instructions
- purchase order references where confidential
- provider account identifiers
- hosted payment URLs if they act as bearer links

### Storage Rules

1. Tax identifiers and other sensitive business identifiers should be encrypted at rest.
2. UI should display masked tax identifiers by default when full display is not necessary.
3. Logs, error reports, and analytics events must not contain full tax IDs, full addresses, or hosted payment URLs.
4. Exports and admin tools must respect the same masking rules unless the user has explicit privileged access.

### Authorization Rules

Define permissions per action, not just per page.

At minimum, separate who can:

- edit provider connection state
- resume onboarding / remediation
- edit compliance profiles
- view unmasked tax identifiers
- edit payment instructions
- preview invoices
- send invoices
- issue credits or refunds
- trigger migration or sync jobs

### Tenant Isolation Rules

Every normalized billing lookup must be scoped by company first.

Required lookup discipline:

- `(company_id, provider, provider_account_id)` for provider accounts
- `(company_id, client_id, provider)` for billing customers
- `(company_id, invoice_id)` for invoice-level reads

Never resolve provider-linked records by foreign ID alone.

### Rendering Rules

Any user-controlled invoice content must be treated as untrusted input.

This includes:

- notes
- footer content
- payment instructions
- PO references
- buyer names
- seller display names

Required rules:

1. Escape HTML in preview rendering.
2. Use the same escaping contract for preview and final rendered content wherever parity is promised.
3. Disallow unsafe rich text until there is a reviewed sanitizer policy.
4. Strip or reject dangerous markup instead of attempting permissive rendering.

### Webhook Rules

For Stripe now and Razorpay later:

1. Verify provider signatures on every webhook.
2. Reject unsigned or invalidly signed payloads.
3. Store provider event IDs and treat processing as idempotent.
4. Enforce replay protection and duplicate-event detection.
5. Normalize only after signature verification passes.

### Audit Rules

Audit-log at least:

- compliance profile changes
- country-pack changes
- payment instruction changes
- invoice send actions
- provider connection / remediation state changes
- credit and refund actions

## Provider Adapter Contract

Before implementing Razorpay, define a strict provider interface.

Every provider adapter should implement methods in this shape:

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

The normalized outputs should be Miru-native objects or hashes with predictable fields.

Required normalized concepts:

- provider account state
- customer identifier
- invoice identifier
- financial status
- payment URL
- capability support
- normalized event type
- normalized failure reason

### Adapter Rule

Controllers and React components should not branch on raw provider SDK objects.

All provider-specific behavior should be hidden behind adapter services and capability checks.

## Source Of Truth During Rollout

The rollout needs explicit ownership rules.

### Phase 1 Source Of Truth

`payment_provider_accounts`

- source of truth for connection state after backfill
- fallback to legacy Stripe model only if migrated row is absent

`billing_customers`

- source of truth for normalized customer mapping after backfill
- fallback to `clients.stripe_id` only while company is not fully migrated

`billing_compliance_profiles`

- source of truth for invoice compliance and country-pack configuration immediately once the new UI launches
- no legacy field should overwrite this silently

`billing_invoice_templates`

- source of truth for template defaults once company is migrated

### Conflict Resolution Rules

1. Legacy Stripe fields may seed new records, but should not overwrite them after migration completes.
2. Once a company is marked `migrated_for_invoice_profiles`, writes to legacy invoice-profile settings should be disabled or ignored.
3. Backfill jobs must be re-runnable without duplicating or downgrading newer normalized data.
4. Company migration state must be explicit, not inferred from partial data presence.

## Migration Invariants And Verification

Backfill and rollout need hard checks.

### Required Invariants

1. At most one active `payment_provider_account` per `(company, provider, provider_account_id)`.
2. At most one active `billing_customer` per `(company, client, provider)`.
3. Every migrated Stripe company must have exactly one default active compliance profile.
4. Every invoice preview must reference a concrete compliance profile version.
5. No migrated company should lose the ability to generate a payment URL for an already-payable invoice.

### Backfill Requirements

Backfill jobs must be:

- idempotent
- resumable
- batchable
- observable

### Verification Output

Every backfill run should emit a report with:

- companies scanned
- companies migrated
- companies skipped
- duplicate mappings found
- companies missing required billing identity data
- companies still reading legacy Stripe-only state

### Rollout Safety Checks

Before turning on the new Invoice Profile UI for a company:

- provider account mapping exists
- default compliance profile exists
- customer mapping backfill completed
- payment URL generation still passes for a sample invoice

## Invoice Preview Versus Final Render

This boundary must be explicit.

### Rule

For Phase 1:

- Miru owns the compliance profile, invoice-preview validation, and send-readiness logic
- Stripe remains the final payment surface
- Miru preview must be treated as the canonical pre-send review artifact

### Engineering Requirement

If Stripe-rendered invoice output cannot faithfully reflect the Miru preview for critical fields, then one of these must happen:

1. reduce the preview to only the guaranteed Stripe-rendered subset
2. store rendered compliance content in fields that Stripe will actually use
3. mark non-rendered preview sections clearly as Miru-only reference data

Do not imply that the final Stripe invoice will contain fields that are not actually rendered there.

### Acceptance Test

For each country pack in Phase 1, verify:

- Miru preview output
- final Stripe-hosted invoice page
- final invoice PDF if used

And compare the critical fields:

- seller identity
- buyer identity
- tax IDs
- tax summary
- due date
- payment instructions
- PO reference
- legal/compliance notes

## Rollout Flags

Use feature flags instead of one global cutover.

Recommended flags:

- `billing_provider_accounts`
- `billing_compliance_profiles`
- `billing_invoice_preview_v2`
- `billing_country_packs`
- `billing_stripe_migration_reads`
- `billing_stripe_migration_writes`
- `billing_razorpay_adapter`

### Rollout Sequence

1. ship additive schema
2. enable backfill jobs
3. enable read-path fallback logic
4. enable Invoice Profile UI for internal users
5. enable preview/send flow for selected migrated companies
6. expand company rollout
7. begin Razorpay adapter behind separate flag

## Ownership By Surface

Define ownership before coding.

### Payments Setup

Owns:

- provider connection state
- onboarding progress
- remediation state
- provider capability display

Likely backend ownership:

- provider account models
- onboarding services
- payment settings controllers / serializers

Likely frontend ownership:

- organization payment settings
- provider connection cards
- onboarding status components

### Invoice Profile

Owns:

- compliance profiles
- country packs
- seller identity fields
- customer billing defaults
- invoice template defaults

Likely backend ownership:

- compliance profile models
- country-pack rules
- preview validator services

Likely frontend ownership:

- invoice profile setup wizard
- profile completeness indicators
- country template editors

### Invoice Preview And Send

Owns:

- rendered preview
- blockers and warnings
- send checklist
- hosted payment linkage

Likely backend ownership:

- preview generation service
- invoice send-readiness validator
- provider invoice creation / sync service

Likely frontend ownership:

- invoice preview screen
- blockers and warnings panel
- send confirmation flow

## Implementation Plan

## Step 1, Stabilize And Extend Existing Stripe Plumbing

Build on current repo structures:

- `stripe_connected_accounts`
- payment settings flows
- invoice payment services
- webhook processing

Do not rip this out.

Refactor toward clearer adapter boundaries instead.

## Step 2, Add Provider Account Abstraction

Introduce an internal provider-account layer that can wrap the current Stripe connected account model.

This should be additive at first.

Do not try to migrate everything in one shot.

## Step 3, Move Invoice And AR UI To Capability-Driven Rules

UI should decide what to show based on:

- provider
- connection status
- capability support
- invoice state

Not based on ad hoc `if stripe` conditionals everywhere.

## Step 4, Add Razorpay Adapter After Stripe UX Is Solid

Once Stripe flows are clean and observable, mirror the adapter structure for Razorpay.

## Recommended Immediate Build

If the team starts today, ship this exact slice:

1. provider connection dashboard
2. Stripe onboarding progress and activation checklist
3. country-aware invoice customization and compliance profile system
4. invoice workspace with hosted invoice page integration
5. customer billing profile and tax identity completeness
6. invoice preview and send flow with warnings vs blockers
7. basic provider account abstraction behind the existing Stripe implementation
8. migration backfill and fallback reads for existing Stripe customers
9. light collections visibility for overdue, failed, and partially paid views
10. data model and service boundaries that allow Razorpay to plug in next

That is enough to improve Stripe materially while setting up Phase 2 correctly.

## Gumroad Inspiration

Gumroad’s public codebase is useful here, but not because Miru should copy their product whole.

The useful lessons are narrower.

### What Stands Out

`1. Merchant onboarding and compliance are first-class`

Gumroad has a dedicated payments settings surface and extensive compliance flows around merchant onboarding, updates, remediation, payout settings, and country-specific requirements.

This is visible in their payments controller specs, which cover:

- onboarding state
- country updates
- compliance-field requests
- remediation links
- bank account setup
- payout schedule rules

That is exactly the right mental model for Miru.

Do not treat provider onboarding as one button.

Treat it as a living account-health workflow.

`2. Tax and purchase details are explicit, not hidden`

In Gumroad’s `Purchase` model, tax and transaction fields are broken out explicitly:

- seller tax amounts
- platform tax amounts
- shipping
- total charged
- taxability flags
- location validation

The lesson for Miru:

Do not collapse invoice tax/compliance data into one generic metadata blob.

Keep the important invoice and tax fields explicit enough to preview, validate, and report on.

`3. Country-aware compliance logic matters`

Gumroad has country and compliance-specific flows throughout payments and tax handling.

For Miru, that supports the plan to build country packs and compliance profiles instead of one global invoice template.

### What Miru Should Borrow

- compliance profile completeness as a real product state
- remediation and missing-field workflows
- country-aware onboarding and payout settings
- explicit tax and transaction fields
- progressive account activation instead of a binary connected/not connected model

### What Miru Should Not Copy

- Gumroad’s full commerce and creator-marketplace complexity
- marketplace-specific purchase and refund state machines
- platform-owned tax assumptions that may not match Miru’s service-business model

### Practical Translation For Miru

Borrow the posture, not the whole implementation:

- onboarding is a workflow
- compliance is ongoing, not one-time
- invoice correctness is structured data
- country-specific requirements deserve first-class product treatment

## Open Questions

These should be answered before implementation starts:

1. Will Miru support only customer-owned merchant accounts, or any Miru-owned merchant-of-record flows later?
2. Are Stripe invoices platform-owned, connected-account-owned, or both?
3. Is Razorpay needed for merchant onboarding, payment collection, or both?
4. Is UPI a must-have in Phase 2, or just a likely future requirement?
5. Does Miru need cross-provider customer billing history in one unified customer portal, or is a provider-specific portal entry point acceptable first?
6. For Miru’s own SaaS billing, do we want to evaluate `pay` separately as a narrow subscription-layer helper?

## Sources

- Pay gem README and docs index: https://github.com/pay-rails/pay
- Stripe Connect overview: https://stripe.com/connect
- Stripe Connect onboarding: https://docs.stripe.com/connect/onboarding
- Stripe Connect hosted onboarding details: https://docs.stripe.com/connect/connect-onboarding
- Stripe Connect invoices: https://docs.stripe.com/connect/invoices
- Stripe Connect payment links: https://docs.stripe.com/connect/payment-links
- Stripe direct charges: https://docs.stripe.com/connect/direct-charges
- Stripe separate charges and transfers: https://docs.stripe.com/connect/marketplace/tasks/accept-payment/separate-charges-and-transfers
- Stripe Invoicing: https://docs.stripe.com/invoicing
- Hosted Invoice Page: https://docs.stripe.com/billing/invoices/hosted
- Customer portal: https://docs.stripe.com/customer-management
- ACH Direct Debit for invoices: https://docs.stripe.com/invoicing/ach-debit
- Quotes overview: https://docs.stripe.com/quotes/overview
- Invoice rendering templates: https://docs.stripe.com/invoicing/invoice-rendering-template
- Razorpay Route: https://razorpay.com/docs/route/
- Razorpay Linked Accounts: https://razorpay.com/docs/payments/route/linked-account/
- Razorpay Payment Links: https://razorpay.com/docs/payments/payment-links/
- Razorpay Invoices API: https://razorpay.com/docs/api/payments/invoices/
