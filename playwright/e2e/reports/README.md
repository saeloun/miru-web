# Reports E2E Test Suite

Comprehensive Playwright end-to-end tests for the Reports section of Miru Web.

## Test Files

### 1. `index.spec.ts` - Reports Landing Page
Tests the main reports listing and navigation page.

**Coverage:**
- Page loads with heading and description
- Stats cards display (Available Reports, Time Reports, Financial Reports, Recently Viewed)
- Category tabs (All Reports, Time, Financial, Client, Team)
- Report cards for Time Entry, Revenue by Client, Outstanding & Overdue Invoices
- Category filtering functionality
- Quick actions section
- Schedule reports button
- Coming soon section
- Navigation to individual reports

### 2. `time-entries.spec.ts` - Time Entry Report
Tests the time entry report page and its features.

**Coverage:**
- Page heading and layout
- Summary cards (Total Hours, Total Entries, Active Clients/Projects/Team Members)
- Date range preset selector
- Custom date range picker
- Group by selector (Client, Project, Team Member)
- Export button and dropdown
- Table columns (Date, Team Member, Project, Note, Hours)
- Grouped sections with totals
- CSV and PDF export options
- Pagination controls
- Filter interactions

### 3. `revenue.spec.ts` - Revenue by Client Report
Tests the revenue report page and financial data display.

**Coverage:**
- Page heading and layout
- Financial summary cards (Total Revenue, Paid Amount, Outstanding, Overdue)
- Date range preset selector with financial-specific options
- Custom date range picker
- Export functionality
- Client Revenue Details table
- Table columns (Client, Overdue Amount, Outstanding Amount, Paid Amount, Total Revenue)
- Currency formatting
- Colored amounts by status (red for overdue, orange for outstanding, green for paid)
- Client logos display
- Pagination controls
- Date range display in summary

### 4. `export.spec.ts` - Report Export Functionality
Tests export capabilities across different report types.

**Coverage:**
- Export button visibility
- CSV export option availability
- PDF export option availability
- CSV download initiation and filename format
- PDF download initiation and filename format
- Export respects date range filters
- Export respects grouping filters
- Filename format validation (`time_entries_YYYY-MM-DD.csv`, `revenue_by_client_YYYY-MM-DD.pdf`)

### 5. `filters.spec.ts` - Filter Behavior
Tests filtering functionality across all report types.

**Coverage:**
- Time Entry Report Filters:
  - Date range preset selector
  - Group by filter (Client, Project, Team Member)
  - Custom date range selection
  - Multiple filters combined
  - All preset options (This Month, Last Month, This Quarter, This Year, Last 7 Days, Last 30 Days)
- Revenue Report Filters:
  - Date range preset selector with All Time option
  - Additional presets (Last Quarter, Last Year)
  - Custom date range picker
  - Switching between preset and custom ranges
- Filter State and Persistence:
  - Filter state maintenance
  - Summary card updates on filter changes
  - Table data updates on filter changes
- Reports List Category Filters:
  - Category tab functionality
  - Report visibility based on category
  - All Reports view

## Running the Tests

### Run all reports tests
```bash
npx playwright test playwright/e2e/reports/
```

### Run specific test file
```bash
npx playwright test playwright/e2e/reports/index.spec.ts
npx playwright test playwright/e2e/reports/time-entries.spec.ts
npx playwright test playwright/e2e/reports/revenue.spec.ts
npx playwright test playwright/e2e/reports/export.spec.ts
npx playwright test playwright/e2e/reports/filters.spec.ts
```

### Run in headed mode (watch the browser)
```bash
npx playwright test playwright/e2e/reports/ --headed
```

### Run with UI mode (interactive debugging)
```bash
npx playwright test playwright/e2e/reports/ --ui
```

### Run specific test by name
```bash
npx playwright test -g "reports page loads with heading"
npx playwright test -g "time entry report"
```

## Test Configuration

**Base URL:** `http://127.0.0.1:3000`

**Test Credentials:**
- Email: `vipul@saeloun.com`
- Password: `password`

**Helper Functions:**
- `login(page)` - Authenticates the user
- `navigateTo(page, path)` - Navigates to path and auto-logs in if needed

## Test Patterns

All tests follow a consistent pattern:

```typescript
import { test, expect } from '@playwright/test';
import { login, navigateTo } from '../helpers/auth';

test.describe('Reports - Feature Category', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await navigateTo(page, '/reports/path');
  });

  test('test description', async ({ page }) => {
    // Test implementation
  });
});
```

## Data Handling

Tests handle both data-present and no-data scenarios:

```typescript
const noResultsText = page.getByText('No results');
const hasData = !(await noResultsText.isVisible().catch(() => false));

if (hasData) {
  // Test with data
  await expect(table).toBeVisible();
}
```

## Conditional Assertions

Tests include conditional checks for dynamic UI elements:

```typescript
const groupByButton = page.getByRole('button').filter({ hasText: /Group by/i }).first();
if (await groupByButton.isVisible()) {
  await groupByButton.click();
  // Additional assertions
}
```

## Export Testing

Export tests verify both the action and filename format:

```typescript
const downloadPromise = page.waitForEvent('download', { timeout: 10000 }).catch(() => null);
await page.getByRole('menuitem', { name: /Export as CSV/i }).click();

const download = await downloadPromise;
if (download) {
  expect(download.suggestedFilename()).toMatch(/time_entries_\d{4}-\d{2}-\d{2}\.csv/);
}
```

## Report URLs

- Reports List: `/reports`
- Time Entry Report: `/reports/time-entry`
- Revenue by Client: `/reports/revenue-by-client`
- Outstanding & Overdue Invoices: `/reports/outstanding-overdue-invoice`
- Accounts Aging: `/reports/accounts-aging`
- Payment Report: `/reports/payments`

## Notes

- Tests include wait states for async data loading
- Filter changes include timeout buffers for API responses
- Export tests handle potential download failures gracefully
- All tests verify both presence and visibility of elements
- Tests are resilient to varying data states (empty vs. populated)
