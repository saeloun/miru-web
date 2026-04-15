# Design System - Miru Web

## Product Context
- **What this is:** Miru is a multi-role operations product for service businesses that combines time tracking, projects, invoicing, payments, expenses, and reporting in one workflow.
- **Who it is for:** Owners, admins, book keepers, employees, and clients with role-specific navigation and permissions.
- **Space/industry:** B2B SaaS for agencies, consultancies, and productized service teams.
- **Project type:** Data-dense web application (Rails + React + Tailwind + shadcn-style primitives).

## Aesthetic Direction
- **Direction:** Operational Calm.
- **Decoration level:** Intentional.
- **Mood:** Clear, trustworthy, fast, and financially precise. Miru should feel like an operations cockpit, not a marketing site.
- **Reference systems:** Linear (clarity), Ramp (financial trust), Notion Calendar (calm density), Vercel dashboard (restraint).

## Information Architecture And UX Priorities

### Route Families (current product surface)
- **Core work:** `/dashboard`, `/time-tracking`, `/clients`, `/projects`, `/team`.
- **Financial ops:** `/invoices`, `/payments`, `/expenses`, `/reports`.
- **Settings:** `/settings/*` including organization, payment, billing, profile, preferences, leaves, bank info.
- **Public/auth surfaces:** sign-in/up/password, invoice public view, payment success.

### UX Priorities
1. **Decision speed over decoration:** dense pages must remain scannable.
2. **Financial confidence:** totals, statuses, and actions should be unambiguous.
3. **Role clarity:** menu visibility and call-to-actions should match permission boundaries.
4. **Desktop-first density, mobile-safe flows:** no mobile dead-ends for core actions.

## Typography
- **Display/Hero:** Geist Sans 600/700.
- **Body:** Geist Sans 400/500.
- **UI/Labels:** Geist Sans 500/600.
- **Data/Tables:** Geist Sans + `tabular-nums`.
- **Code/IDs:** Geist Mono.
- **Loading:** self-hosted Geist + Geist Mono from `app/javascript/src/styles/geist-font.css`.

### Typography Rules
- App default font is Geist Sans.
- Inter remains a temporary compatibility fallback while legacy selectors are migrated.
- Manrope usage is deprecated except explicit grandfathered `.font-manrope` cases.
- All currency, durations, and totals must use tabular numbers.

### Type Scale
- `xs`: 12/16
- `sm`: 13/18
- `base`: 14/20
- `md`: 16/24
- `lg`: 18/26
- `xl`: 20/28
- `2xl`: 24/32
- `3xl`: 30/38

## Color
- **Approach:** Balanced, restrained neutrals with a confident violet primary.
- **Primary:** `#5B34EA` (brand action, selected states).
- **Secondary:** `#EEF2FF` (soft emphasis surfaces).
- **Neutrals:** `#FFFFFF`, `#FAFAFB`, `#F4F4F5`, `#E4E4E7`, `#A1A1AA`, `#52525B`, `#27272A`, `#0A0A0A`.
- **Semantic:** success `#16A34A`, warning `#D97706`, error `#DC2626`, info `#0284C7`.

### Dark Mode Strategy
- Keep the same semantic meaning, not inverted semantics.
- Dark surfaces use neutral layering (`#09090B`, `#18181B`, `#27272A`) and reduce vivid accent usage by default.
- Preserve visible focus rings and AA contrast in both themes.

### Token Contract (canonical names)
Use these variables for all new UI work:
- `--background`, `--foreground`
- `--card`, `--card-foreground`
- `--popover`, `--popover-foreground`
- `--primary`, `--primary-foreground`
- `--secondary`, `--secondary-foreground`
- `--muted`, `--muted-foreground`
- `--accent`, `--accent-foreground`
- `--destructive`, `--destructive-foreground`
- `--border`, `--input`, `--ring`
- `--sidebar`, `--sidebar-foreground`, `--sidebar-primary`, `--sidebar-accent`, `--sidebar-border`, `--sidebar-ring`

## Spacing
- **Base unit:** 4px.
- **Density:** Comfortable-compact for data workflows.
- **Scale:** `2xs=2`, `xs=4`, `sm=8`, `md=12`, `lg=16`, `xl=24`, `2xl=32`, `3xl=48`, `4xl=64`.

## Layout
- **Approach:** Grid-disciplined application shell with optional high-density tables.
- **Desktop shell:** persistent sidebar + top context row + padded content area.
- **Mobile shell:** collapsible left nav with sheet/overlay pattern and persistent page context.
- **Content widths:**
  - dashboards and forms: `max-w-7xl`
  - dense reports/tables: full width within content padding
  - focused forms/details: `max-w-3xl`

### Grid By Breakpoint
- `sm` (>=640): 4-column mental model.
- `md` (>=768): 8-column mental model.
- `lg` (>=1024): 12-column app layout.
- `2xl` (>=1400): retain 12 columns, increase whitespace not component sprawl.

### Radius
- `sm`: 6px
- `md`: 8px
- `lg`: 12px
- `xl`: 16px
- `full`: 9999px

## Motion
- **Approach:** Minimal-functional with intentional feedback on navigation/state changes.
- **Easing:** enter `ease-out`, exit `ease-in`, move `ease-in-out`.
- **Duration:** micro `75-120ms`, short `160-220ms`, medium `240-320ms`, long `360-520ms`.

### Motion Rules
- Avoid decorative perpetual motion on data-heavy screens.
- Prioritize transitions for: sidebar open/close, dialogs, inline table state updates, and optimistic save feedback.
- Respect `prefers-reduced-motion`.

## Component System Rules

### Source Of Truth
- Prefer primitives under `app/javascript/src/components/ui/*`.
- Use Tailwind semantic tokens (`bg-background`, `text-foreground`, `border-border`, `bg-primary`) over hardcoded hex values.
- Legacy `StyledComponents` usage should be migrated incrementally toward tokenized primitives.

### Core Patterns
- **Navigation:** grouped sidebar sections with clear section labels and role-aware visibility.
- **Tables:** sticky headers where needed, explicit empty/loading/error states, stable row actions.
- **Forms:** top-aligned labels, predictable validation placement, semantic helper text.
- **Dialogs/Side panels:** one primary action, one secondary action, destructive action always explicit.
- **Status messaging:** success/warning/error/info badges and toast variants must map to semantic tokens.

## Accessibility And Internationalization
- Minimum contrast target: WCAG AA for all text and interactive states.
- All focusable controls require visible focus ring using `--ring`.
- Hit target minimum: 40x40 on touch surfaces.
- Avoid color-only status encoding; pair with icon or label.
- Copy length and layout must tolerate localization expansion.

## Current Gaps Found In Repo (Design Debt)
1. Token definitions exist in both `app/javascript/packs/application.css` and `app/javascript/stylesheets/application.scss`, with conflicting values.
2. Typography defaults are split across Geist, Inter, and some Manrope selectors.
3. Some controls still use hardcoded color values instead of semantic tokens.
4. Layout patterns are evolving (`DashboardLayout`, `Sidebar`, newer `ui/*` primitives) but not yet fully unified.

## Migration Plan
1. **Token unification:** keep one canonical token source; convert other files to reference-only.
2. **Font unification:** standardize on Geist and remove incidental font overrides.
3. **Semantic color cleanup:** replace hardcoded UI colors with token classes.
4. **Component convergence:** prioritize high-traffic surfaces (time tracking, invoices, reports, expenses) for primitive alignment.
5. **Visual regression checks:** run browser QA after each migration batch.

## Gstack Optimization Contract
This section defines how gstack skills should consume this file with minimal context overhead.

### Skill Inputs
- `/design-shotgun`: use `Aesthetic Direction`, `Typography`, `Color`, `Layout`, `Motion`.
- `/plan-design-review`: score against `Component System Rules`, `Accessibility`, and `Current Gaps`.
- `/design-html`: implement directly from `Token Contract`, `Spacing`, `Grid`, and `Radius`.
- `/design-review`: verify built UI against `UX Priorities`, `Core Patterns`, and contrast/focus rules.

### Review Checklist For Agent Runs
- Uses semantic tokens only (no new hardcoded palette values).
- Uses approved type scale and tabular numerics for financial data.
- Preserves role clarity in navigation and action visibility.
- Includes explicit empty/loading/error states for data surfaces.
- Passes dark mode readability and keyboard focus checks.

## Decisions Log
| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-15 | Created initial Miru design system | Establish one implementation-ready source of truth for UI consistency and gstack skill alignment |
| 2026-04-15 | Chosen direction: Operational Calm | Product is operations-heavy and finance-adjacent; trust and speed matter more than visual novelty |
| 2026-04-15 | Set gstack optimization contract | Ensures consistent, low-noise consumption by plan/design/build/review skill workflows |
