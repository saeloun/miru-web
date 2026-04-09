# Miru AI Agent Billing Autoplan

## Goal

Make Miru the system of record for billable AI work from any agent runtime.

Not "AI features."

Real agent labor:

- tracked
- reviewed
- approved
- invoiced
- paid

## Product Thesis

AI agents are starting to do real client work.

That work still needs the boring grown-up layer:

- who did the work
- what project it belonged to
- how long it ran
- what output it produced
- whether it should be billed
- how it turns into an invoice

Miru already has the back half:

- time entries
- billable state
- invoices
- payments
- client and project structure

The wedge is obvious:

`Miru is where AI labor becomes revenue.`

## Autoplan Verdict

### CEO Review

Selective expansion.

Do not build "AI everywhere."

Do build one sharp new category:

- agents are first-class workers
- their work is reviewable
- their work is invoiceable

This is good because it turns Miru from a generic tracker into a ledger for mixed human and agent teams.

### Design Review

The UI must answer four questions fast:

1. which agent did this
2. what did it work on
3. can I trust and approve this work
4. can I invoice it now

That means:

- agent identity must be visible on every entry
- proof links and metadata must be compact, not hidden
- billing status must sit next to agent status
- invoice handoff must be one flow, not three disconnected screens

Design scorecard:

- identity clarity: `8/10`
- review flow clarity: `6/10`
- billing handoff clarity: `6/10`
- mixed human + agent readability: `7/10`

What gets this to `9/10`:

- keep human and agent work in one timeline, but make the actor obvious in the first scan line
- show review state before billing state, because trust comes before money
- put proof, run id, and provider in a compact secondary row, not inside hidden drilldowns
- make invoice handoff start from approved entries, not from a separate reporting screen
- make the first release three screens, not a scattered set of badges

### Engineering Review

Build this on top of the current timesheet and invoice model.

Do not create a second billing system for agents.

Add first-class actor metadata, agent-key auth, review state, and invoice grouping. Keep the existing invoice pipeline.

Engineering scorecard:

- data model fit with current Miru: `7/10`
- invoice pipeline fit: `8/10`
- auth and trust boundary clarity: `6/10`
- rollout safety: `7/10`

What gets this to `9/10`:

- keep `timesheet_entries.user_id` as the accounting anchor
- use `agent_id` for attribution, not a second ownership model
- lock `review_status` transitions before building UI
- define pricing-enforcement touchpoints up front
- add indexes and token-audit fields in Phase 1, not later

## Pricing Recommendation

Recommend:

- Free:
  - `1 user`
  - `5 projects`
  - `2 clients`
  - `1 active agent`
- Pro:
  - unlimited users
  - unlimited projects
  - unlimited clients
  - `$1 / active agent / month`

`Active` means the agent logged billable or reviewable work during the billing period.

Why this is better than a looser free tier:

- the free tier stays usable for solo evaluation
- agencies hit the limits quickly once real client work starts
- projects and clients become the clean upgrade trigger
- active-agent pricing still scales with actual value

## Packaging Rules

Free is for trying Miru, not running an agency on it.

Upgrade to Pro when any of these are exceeded:

- more than `1 user`
- more than `5 projects`
- more than `2 clients`
- more than `1 active agent`

That keeps the rule legible.

## Scope

## Phase 1, Agent Ledger

### Build

- `Agent` as a first-class entity
- agent-key auth for agent time ingestion
- agent-attributed timesheet entries
- review state on agent work
- proof metadata on entries

### Data Model

Add:

- `agents`
  - `company_id`
  - `user_id`
  - `name`
  - `slug`
  - `provider`
  - `status`
  - `default_project_id`
  - `billable_rate`
  - `active_at`
- `agent_keys`
  - `agent_id`
  - `token_digest`
  - `created_by_id`
  - `last_used_at`
  - `revoked_at`
- extend `timesheet_entries`
  - `agent_id`
  - `review_status` = `not_required`, `pending_review`, `approved`, `rejected`
  - `external_run_id`
  - `external_session_id`
  - `proof_url`
  - `proof_metadata`

Reuse existing fields where possible:

- `source`
- `source_metadata`
- `bill_status`

Important modeling rule:

- `timesheet_entries.user_id` remains the ownership and accounting anchor
- `timesheet_entries.agent_id` marks that the work was performed by an agent
- every agent maps to a real backing `user` record in the workspace

That keeps reports, policies, invoice joins, and ownership logic aligned with the current app instead of creating a second parallel worker system.

Add indexes up front:

- `timesheet_entries.agent_id`
- `timesheet_entries.review_status`
- composite index on `timesheet_entries` for `user_id, work_date`
- composite index on `timesheet_entries` for `agent_id, review_status`

### API

Add a narrow ingestion API:

- `POST /api/v1/agent/timesheet_entries`
- `PATCH /api/v1/agent/timesheet_entries/:id`
- `GET /api/v1/agent/capabilities`

Payload:

- `project_id`
- `work_date`
- `duration`
- `note`
- `billable`
- `external_run_id`
- `proof_url`
- `source_metadata`

Security rules:

- agent key only
- key scoped to one agent
- key can be revoked
- key use is auditable through `created_by_id` and `last_used_at`
- server allowlists metadata keys
- server does not trust caller-supplied billing status beyond permitted transitions
- server derives agent identity from the key, not caller input alone

Review state rules:

- human manual entries default to `not_required`
- agent-ingested entries default to `pending_review`
- invoice selection only includes `approved` and `unbilled`
- rejected agent entries should become `non_billable` unless explicitly reopened

## Phase 2, Review Surface

### Build

- filter time entries by `Humans`, `Agents`, `All`
- agent badge and provider badge on entry cards
- review queue for `pending_review`
- approve and reject actions
- proof links inline on entry cards

### UX

On time tracking:

- show `Agent`, `Provider`, `Run`, `Proof`
- show `Pending Review` before an entry can move to billing
- keep human and agent entries in one surface, but clearly labeled

Primary screen hierarchy:

1. who did the work
2. what client and project it belongs to
3. whether it is pending, approved, or rejected
4. whether it is billable, unbilled, or billed
5. proof and run metadata

Target entry layout:

- line 1: `Agent Name` + `Agent` badge + `Pending Review`
- line 2: `Client / Project` + duration + work date
- line 3: note preview
- line 4: compact metadata row with `Provider`, `Run`, `Proof`
- line 5: primary actions, `Approve`, `Reject`, `Add to Invoice`

Do not do this:

- do not put proof behind a modal by default
- do not make provider branding louder than client/project context
- do not split review and invoicing into separate disconnected tabs in v1
- do not make agent entries feel like debug logs

## Phase 3, Invoice Handoff

### Build

- unbilled agent work filter
- group by client, project, agent, task type
- create invoice draft from selected approved entries
- invoice line metadata showing agent contribution

### Principle

Do not auto-invoice raw runs.

Only approved agent work becomes invoiceable.

That means invoice eligibility is:

- `agent_id.present?`
- `review_status = approved`
- `bill_status = unbilled`
- not discarded

## Phase 4, Generic Agent Integrations

### First Integration Shape

The integration model must stay generic from day one.

Miru should work with:

- Claude Code
- Codex
- OpenClaw
- custom internal runners
- hosted agent platforms

### Build

- one narrow HTTP contract for all runtimes
- one simple agent-key ingestion path that any runtime can call
- one reference CLI/HTTP adapter that proves the end-to-end workflow
- send:
  - duration
  - project/client mapping
  - task note
  - run/session ids
- proof links or transcript artifacts

Do not make provider-specific concepts part of the core accounting model.

The key is the integration surface, not the vendor.

Phase 1 should prove one path:

- an agent key
- one HTTP ingestion contract
- one reference adapter

That is enough to support Claude Code, Codex, OpenClaw, or a custom runner without exploding scope on day one.

### Reference Prompt

Use this shape for a generic agent-key workflow:

```text
Pull all work I did in Jira today, summarize it hour by hour when the issue history supports that, or collapse it into one full-day summary when it does not. Match each block to the best Miru project you can find. Draft the Miru time entries first, include proof links back to Jira, and only submit them after explicit approval.
```

For a fully automated agent run after approval:

```text
Pull all work completed in Jira for this user today. Group it hour by hour when the evidence is strong, otherwise create one full-day summary. Match each block to a Miru project, then create draft agent-attributed time entries with Jira links in proof metadata. Do not generate or send invoices automatically.
```

### Success

- an agent finishes a task
- the work shows up in Miru as `Pending Review`
- an owner approves it
- it moves into invoice draft selection

## Phase 5, Ecosystem

### Later Integrations

- Codex-specific helper adapter
- Claude-based local workflow adapter
- OpenClaw adapter
- custom MCP or CLI runners

### Do Not Build First

- token-based cost accounting as billing truth
- automatic labor estimation from random chat usage
- desktop/browser scraping for generic AI apps

Those are noisy and hard to trust.

## UI Direction

### Screen 1, Time Tracking Feed

Show:

- actor badge: `Agent` or `Human`
- agent name
- provider badge
- run id
- proof link
- bill status
- review status

This is the main operating surface.

People should be able to scan one mixed feed and immediately separate:

- human work
- agent work
- ready to review
- ready to invoice

### Screen 2, Review Queue

This should be a focused filter state, not a new product area.

Default grouping:

- `Pending Review`
- `Rejected`
- `Approved but Unbilled`

Each row should let an owner finish the decision without leaving the list.

### Screen 3, Invoice Draft Builder

Start from `Approved and Unbilled`.

Show:

- client
- project
- agent
- duration
- billable amount
- proof count

The right model is selection first, invoice second.

### Billing Page

Add:

- `Agent Work` section
- `Approved and Unbilled`
- grouped invoice draft creation

### States

Every agent entry should have one obvious state combination:

- `Pending Review` + `Unbilled`
- `Approved` + `Unbilled`
- `Approved` + `Billed`
- `Rejected` + `Non-billable`

Avoid ambiguous combinations in the UI.

### Empty States

- no agents yet:
  - explain what agents are
  - offer `Create Agent`
  - show the ingestion endpoint/token path
- no work pending review:
  - say `No agent work waiting for review`
- no approved work:
  - say `Approve agent work to prepare an invoice draft`

### Mobile Constraint

Do not design v1 around dense tables.

The card layout above must collapse cleanly to stacked rows because this feature will need mobile parity later, even if the first release is web-first.

## Recommended First Release

Ship this in one narrow release:

1. agent model
2. ingestion API
3. time-entry display for agents
4. review queue
5. invoice draft from approved agent work
6. generic agent-key integration

That is the lake.

Do not dilute it with:

- reminders
- generic AI dashboards
- token analytics
- mobile support
- speculative desktop capture

## Risks

- fake or low-quality agent work being marked billable
- provider-specific metadata leaking into core domain design
- confusing human and agent labor in the same list
- approvals becoming a bottleneck if the review UI is weak

## Stripe And Crypto

Do not make Bitcoin or crypto a dependency for phase 1.

Phase 1 should use the existing Stripe subscription flow that Miru already has.

If Miru later adds crypto checkout:

- treat it as an optional billing expansion
- use Stripe's supported `crypto` payment method path, not Bitcoin-specific core logic
- gate it behind account eligibility and explicit configuration

Crypto can be a later checkout option.

It is not required to make agent billing work.

## Guardrails

- every agent entry starts as `pending_review`
- invoice flow only includes `approved`
- agent keys are per-agent and revocable
- metadata is allowlisted
- proof link is optional but strongly encouraged for premium workflows

## Enforcement Points

The free and Pro limits need hard enforcement in product code, not just pricing copy.

Enforce at:

- user creation and invitation
- project creation
- client creation
- agent creation
- agent activation

The upgrade trigger should happen before the object is created, not after the workspace drifts out of plan compliance.

## Success Metrics

- number of active agents per workspace
- approved agent hours per week
- invoice drafts created from agent work
- time from agent completion to invoice draft
- share of mixed human + agent workspaces

## What To Do Next

1. add the `Agent` and agent-key data model
2. build the ingestion API
3. render agent entries in time tracking
4. add review status and approval UI
5. publish generic agent-key adapters first

Implementation order inside Phase 1:

1. schema and model changes
2. agent-key-backed ingestion API
3. time-tracking feed rendering
4. pending review filter and actions
5. invoice draft eligibility and handoff

## Sequencing Note

Push the current time-tracking parity fixes before starting this implementation batch.

That means shipping the active parity work on:

- favorites above recents
- resume timer from an existing row
- all-entries review mode for the active week

Reason:

Agent work will live inside the same time-tracking surface.

If that surface is still mid-rewrite, Phase 1 agent work will either duplicate UI effort or harden the wrong structure.

That is the whole move.
