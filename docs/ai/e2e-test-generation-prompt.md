# Prompt: Generate Manual Test Suite + Playwright E2E Tests for a Page

Use this prompt with any AI model to generate a complete manual test suite and parallel-safe Playwright E2E tests for a given page in this repo.

---

## Prompt (copy everything below this line)

```
You are working in a Rails + React monorepo. Your task is to generate TWO deliverables for the page at `http://127.0.0.1:3000/{PAGE_PATH}`:

1. A **manual test suite** (Markdown file)
2. A **Playwright E2E test suite** (TypeScript files)

Follow these steps IN ORDER. Do not skip any step.

---

### STEP 1: Gather Context

Read these files to understand the existing patterns:

- `playwright.config.ts` — understand the project structure, auth setup, testDir pattern
- `e2e/global-setup.ts` — understand the auth flow
- `e2e/projects/helpers.ts` — understand the helper pattern (API helpers, navigation, toast, contrast)
- `e2e/projects/01-list.spec.ts` — understand the spec file pattern
- `e2e/time-tracking/12-contrast.spec.ts` — understand the WCAG contrast testing pattern
- `e2e/time-tracking/helpers.ts` — understand the contrast ratio helper functions
- `package.json` (search for `test:e2e`) — understand the script naming pattern

Then read ALL React components, Rails controllers, models, API views, and routes related to `{PAGE_PATH}` to understand every feature on the page. Read the actual component source code — do not guess.

---

### STEP 2: Write the Manual Test Suite

Create `docs/manual_tests/{page_name}_tab.md` with:

- **URL** and **test login credentials** (`vipul@saeloun.com / password` for admin)
- Numbered sections grouped by feature area (e.g., Page Load, Navigation, CRUD, Search, etc.)
- Each section is a Markdown table with columns: `#`, `Test Case`, `Steps`, `Expected Result`
- Cover ALL of these categories:
  - Page load, loading state, error state
  - All visible UI elements and their data
  - All user interactions (clicks, forms, dropdowns, toggles)
  - CRUD operations (create, read, update, delete)
  - Search/filter/sort/pagination if present
  - Navigation between views/pages
  - Role-based access (admin vs employee vs book_keeper)
  - Empty states and edge cases
  - Data refresh after mutations
  - Responsive/mobile behavior
  - Accessibility (keyboard nav, aria attributes, screen reader labels)
  - WCAG AA color contrast on key elements (text, buttons, selected/hover states)
- End with a **Test Data Prerequisites** section listing what seed data is needed

---

### STEP 3: Write the Playwright E2E Test Suite

Create these files:

#### 3a. `e2e/{page-name}/helpers.ts`

Follow the exact pattern from `e2e/projects/helpers.ts` and `e2e/time-tracking/helpers.ts`:

- **API helpers**: Functions to create/delete test data via the API (e.g., `createEntry()`, `deleteEntry()`)
  - Use `page.request.post/delete/get` for API calls
  - Use `expect(res.ok()).toBeTruthy()` for assertions
  - Generate unique names/notes with `Date.now()` to avoid collisions
- **Navigation helper**: `goToPage(page)` that navigates and waits for the page to settle
- **Toast helper**: `expectToast(page, text)` using `[data-sonner-toast]` selector
- **Contrast helpers** (copy from `e2e/time-tracking/helpers.ts`):
  - `parseColor(color)` — parse rgb/rgba/hex to {r,g,b}
  - `relativeLuminance({r,g,b})` — WCAG 2.1 luminance
  - `contrastRatio(fg, bg)` — WCAG contrast ratio
  - `WCAG_AA_NORMAL = 4.5` and `WCAG_AA_LARGE = 3`
  - `getElementContrast(page, locator)` — evaluate computed styles

#### 3b. Spec files: `e2e/{page-name}/01-*.spec.ts` through `e2e/{page-name}/NN-*.spec.ts`

**CRITICAL RULES for every spec file:**

1. **Full parallel isolation**: Every single `test()` creates its own data and cleans up after itself. NO `test.beforeAll`, NO shared `let` variables, NO test ordering dependencies.
2. **try/finally for cleanup**: Any test that creates data must use `try { ... } finally { deleteViaApi() }`.
3. **Unique data**: Use `Date.now()` or similar in names/notes to avoid collisions between parallel workers.
4. **No flaky waits**: Use `await expect(locator).toBeVisible({ timeout: N })` instead of arbitrary `waitForTimeout`. Only use `waitForTimeout` for debounced inputs (300ms max).
5. **Locator strategy**: Prefer `data-testid`, `role`, `aria-label`, and text content. Avoid fragile CSS class selectors.
6. **Mock for edge cases**: Use `page.route()` to mock API responses for error states and empty states instead of mutating real data.
7. **Import from local helpers**: `import { ... } from "./helpers"`.

**Spec file organization** (one file per feature area):
- `01-page-load.spec.ts` — page load, layout, error state
- `02-*.spec.ts` through `NN-*.spec.ts` — one file per feature area from the manual test suite
- Last file: `NN-contrast.spec.ts` — WCAG AA contrast checks

**Contrast spec pattern** (from `e2e/time-tracking/12-contrast.spec.ts`):
- For each key element (headings, labels, buttons, selected states, hover states):
  - Get computed `color` and `backgroundColor` (walk up DOM for transparent bg)
  - Compute contrast ratio
  - Assert `ratio >= 4.5` for normal text or `ratio >= 3.0` for large text (>=18px bold or >=24px)
- Cover: static text, active/inactive toggle states, selected/unselected states, hover states, button text

---

### STEP 4: Update Config & Scripts

#### 4a. `playwright.config.ts`

Add a new project entry following this exact pattern:

```typescript
{
    name: "{page-name}",
    testDir: "./e2e/{page-name}",
    testMatch: /\.spec\.ts/,
    dependencies: ["setup"],
    use: {
        storageState: "e2e/.auth/admin.json",
    },
},
```

Use `testDir` (not `testMatch` with a path regex) to avoid matching files in other directories when the workspace path contains the page name.

#### 4b. `package.json`

Add a script:
```json
"test:e2e:{page_name}": "npx playwright test --project={page-name}"
```

Use underscores in the script name, hyphens in the project name.

---

### STEP 5: Verify

Run `getDiagnostics` on ALL created/modified files to ensure zero TypeScript errors.

---

### IMPORTANT NOTES

- The app uses **Radix UI** components (Select, Dialog, DropdownMenu) — use `[role="option"]`, `[role="dialog"]`, `[role="menuitem"]` selectors.
- Toast notifications use **Sonner** — selector is `[data-sonner-toast]`.
- Auth is pre-configured via `storageState` — tests run as admin by default.
- The base URL is `http://127.0.0.1:3000`.
- API endpoints are under `/api/v1/`.
- The app uses **i18n** — button text may vary by locale. Use regex matchers like `/save entry/i`.
- Native `<option>` elements inside `<select>` are not "visible" in Playwright — use `toBeAttached()` instead of `toBeVisible()`.
- Elements inside `hidden lg:flex` containers are only visible at lg+ viewport (1024px). Default Playwright viewport is 1280x720 which is fine, but be aware of this.
```

---

## Usage

Replace `{PAGE_PATH}` with the actual route (e.g., `clients`, `invoices`, `team`, `reports`), and `{page-name}` / `{page_name}` with the kebab-case / snake_case name.

Example for the Clients page:
- `{PAGE_PATH}` = `clients`
- `{page-name}` = `clients`
- `{page_name}` = `clients`
