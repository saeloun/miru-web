# Miru Billing Launch Week Plan

## Objective

Ship all of Phase 1 billing today, `Thursday, April 09, 2026`, with `Razorpay` as the only deferred item.

This is now the working plan:

- ship all Stripe-first billing work
- ship all Phase 1 country packs
- ship all three primary surfaces
- ship migration support for existing Stripe customers
- do not ship Razorpay today

This document combines:

- ICP memo
- 30-day MVP cut
- founder pitch
- user-flow spec
- launch-week delivery focus

It assumes the strategy and execution plans in:

- [miru-stripe-invoicing-ar-plan.md](/Users/sward/saeloun/miru-web/docs/miru-stripe-invoicing-ar-plan.md)
- [miru-billing-control-plane-execution-plan.md](/Users/sward/saeloun/miru-web/docs/miru-billing-control-plane-execution-plan.md)

## Launch Day Truth

Today is `Thursday, April 09, 2026`.

The plan changed.

We are not optimizing for a narrow Friday demo anymore.

We are shipping all non-Razorpay Phase 1 scope today.

That means:

- `Stripe` only in production
- full `Payments Setup`
- full `Invoice Profile`
- full `Invoice Preview And Send`
- migration support for existing Stripe customers
- supporting collections visibility
- all Phase 1 country packs:
  - `US`
  - `EU`
  - `India`
  - `Singapore`
  - `UAE / Dubai`

Only `Razorpay` is out of scope for today.

Operationally, this should still be staged.

Do not flip every country pack live in one blind move.

## ICP Memo

## Best Initial Customer

Miru billing should start with:

- agencies
- consultancies
- dev shops
- design studios
- service businesses with cross-border invoicing

Especially teams where:

- invoices are built from project or service work
- procurement or finance rejects invoices for missing fields
- tax IDs and legal entity details vary by customer or country
- someone manually fixes invoice formatting before send

## Bad Early Customer

Do not optimize first for:

- pure self-serve SaaS companies
- marketplaces needing complex multi-party settlement now
- freelancers with very low invoice volume
- enterprise ERP replacement buyers

## Why This ICP Is Right

These teams already feel the pain.

They do not need to be convinced that invoice mistakes delay payment.

They already know. They are living it.

That makes the pitch much simpler:

`Miru helps your team send invoices that do not get bounced for missing tax, legal, or procurement details.`

## Core Problem Statement

The problem is not “how do we take payments?”

The problem is:

- work gets done
- invoice gets drafted
- invoice is incomplete for the customer or country
- finance or procurement rejects it
- ops fixes it manually
- payment gets delayed

That is the pain to kill first.

## 30-Day MVP Cut

## MVP Outcome

A Stripe-connected service business can:

- connect payments
- choose a country pack
- complete an invoice profile
- preview the invoice with warnings and blockers
- send through a Stripe-backed path

## 30-Day Arc

The 30-day plan still matters, but it is no longer the ship decision for today.

It becomes the stabilization and extension plan after the same-day ship.

### Week 1

- additive schema
- Stripe provider account abstraction
- migration backfill for existing Stripe customers
- Payments Setup MVP

### Week 2

- compliance profile model
- country-pack rule engine for:
  - `US`
  - `EU`
  - `India`
  - `Singapore`
  - `UAE / Dubai`
- Invoice Profile CRUD

### Week 3

- completeness evaluator
- Invoice Preview generator
- warnings vs blockers logic
- preview/send UI

### Week 4

- browser QA on all shipped country packs
- migration verification on existing Stripe customers
- polish on copy, warnings, and send-readiness
- light collections visibility only if the main path is already solid

## Hard Scope Cuts

Do not ship in the first 30 days:

- Razorpay live support
- quotes
- usage billing
- heavy AR workflow
- provider-agnostic deep abstractions
- all-country compliance packs
- legal-rule engine ambitions

## Today Scope

Ship today:

- Payments Setup
- Invoice Profile
- Invoice Preview And Send
- migration and fallback reads for existing Stripe customers
- all Phase 1 country packs
- light collections visibility
- Stripe-backed payment path verification

Do not ship today:

- Razorpay
- quotes
- usage billing
- deeper AR automation
- any second billing system

## Safe Launch Order

Ship today in this order:

1. deploy schema and app code with flags off
2. run Stripe migration backfill
3. verify migration report
4. enable Payments Setup, Invoice Profile, and Preview internally
5. run the QA matrix for `US`, `EU`, and `India`
6. enable `US`, `EU`, and `India`
7. rerun smoke checks
8. enable `Singapore` and `UAE / Dubai` only after the same matrix passes

This still counts as shipping today.

It is just not reckless.

## Founder Pitch

## One-Liner

Miru helps service businesses send country-correct, procurement-friendly invoices and get paid faster.

## Slightly Longer

Stripe can collect money, but it does not solve the messy part for service businesses:
getting the invoice right before it is sent.

Miru sits above Stripe and helps teams:

- set up invoice requirements by country
- catch missing tax and business details
- preview the final invoice before send
- avoid invoice rework and payment delays

Stripe stays the payment rail.

Miru becomes the invoice correctness and billing operations layer.

## Why Now

Cross-border service work is normal now.

The invoice still breaks in boring ways:

- missing VAT or GST info
- bad buyer legal name
- wrong address block
- missing PO
- incorrect tax notes

That is not glamorous. That is why it is valuable.

## Why Miru

Miru already understands:

- projects
- clients
- invoices
- payments

That means Miru can do something Stripe alone cannot do well:

connect the work context to the invoice correctness workflow.

## Product Positioning

Do not pitch this as:

- “multi-gateway billing orchestration”
- “payment infrastructure”
- “tax compliance automation”

Pitch it as:

`the invoice readiness layer for service businesses`

That is much easier to understand and buy.

## User-Flow Spec

## Flow 1, Payments Setup

### User Goal

Understand whether the business can collect money right now.

### Entry Point

- organization settings
- billing onboarding prompt
- invoice send blocked state

### Screen Requirements

Show:

- Stripe connected or not
- onboarding complete or not
- charges enabled
- payouts enabled
- remediation required
- migration status for existing customers

### Primary Actions

- connect Stripe
- resume Stripe onboarding
- resolve remediation
- view readiness checklist

### Success State

User sees:

- `Ready to collect payments`

or a very specific blocker:

- `Stripe connected, but payouts are not enabled`
- `More business details required`

## Flow 2, Invoice Profile

### User Goal

Set the invoice defaults needed for the merchant’s country and customer type.

### Entry Point

- after Payments Setup
- from invoice send blockers
- from billing settings

### Step 1

Pick:

- seller country
- customer type
- template style

### Step 2

Fill seller details:

- legal name
- registered address
- tax IDs
- default notes
- payment instructions

### Step 3

Set buyer-facing defaults:

- PO expectations
- invoice notes
- buyer tax ID expectations
- invoice numbering or label settings where relevant

### Completion State

Show:

- complete
- warning
- blocked

Do not show one vague score.

Be explicit about what is missing.

## Flow 3, Invoice Preview And Send

### User Goal

See whether the invoice is complete enough to send and get paid.

### Entry Point

- invoice draft
- send action

### Screen Layout

Left side:

- invoice preview

Right side:

- blockers
- warnings
- payment methods
- send CTA

### Rules

Block send for:

- missing required seller identity
- missing required tax registration details
- missing buyer fields when required by profile
- missing payment instructions if profile requires them

Warn only for:

- recommended notes
- optional procurement references
- non-critical formatting suggestions

### Success State

User can click:

- `Send invoice`

Only when blocker count is zero.

## Country-Pack Launch Guidance

## US

Optimize for:

- legal entity + remit-to correctness
- EIN label support
- PO and buyer reference
- sales-tax-friendly labeling

## EU

Optimize for:

- VAT IDs for seller and buyer
- reverse-charge note support
- intra-EU B2B defaults
- VAT summary visibility

Keep this to a practical EU B2B pack first.

Do not pretend you solved every local EU nuance.

## India

Optimize for:

- GSTIN
- place of supply
- CGST / SGST / IGST presentation
- invoice numbering discipline

## Singapore

Optimize for:

- GST registration
- SGD defaults
- clean procurement-friendly notes

## UAE / Dubai

Optimize for:

- TRN
- VAT summary
- legal identity and footer defaults

## Same-Day Ship Cut

If this has to ship today, `Thursday, April 09, 2026`, the plan is:

## Must Ship Today

- Payments Setup state card
- full Invoice Profile
- Preview screen with blockers vs warnings
- all Phase 1 country packs
- Stripe-backed payment path still functional
- existing Stripe customers do not regress
- migration state visibility
- seller and buyer identity completeness
- light collections visibility

## Can Slip Past Today

- visual polish beyond functional clarity
- advanced customer-profile defaults
- extra admin convenience features
- any Razorpay prep that is not needed for future architecture

## Realistic Same-Day Demo

By Thursday, April 09, 2026, the believable demo is:

1. open Payments Setup
2. show Stripe readiness
3. open Invoice Profile
4. pick a country pack
5. leave required tax fields blank and show blockers
6. fill them in
7. open Invoice Preview And Send
8. show warning vs blocker logic
9. send through the Stripe-backed path

That demo should include at least one invoice pack each from:

- `US`
- `EU`
- `India`
- `Singapore`
- `UAE / Dubai`

Razorpay is the only explicit defer.

## QA And DevOps Gate

Before calling this shipped today:

- migration health report has no duplicate active mappings
- sampled existing Stripe customers still have working payment links
- `US`, `EU`, and `India` pass the browser QA matrix
- `Singapore` and `UAE / Dubai` pass before they are enabled
- blocked invoices fail correctly
- valid invoices send correctly
- no cross-tenant billing data appears
- no fresh billing-path error spike appears after rollout

## Decision

For today:

- ship all Stripe-first Phase 1 work
- ship the country-pack layer
- ship migration support
- leave Razorpay out

The wedge is:

`Miru prevents bad invoices before they get sent`

That is worth shipping.
