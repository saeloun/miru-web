import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";

const base = new URL(process.env.BASE_URL);
assert.ok(
  ["127.0.0.1", "localhost", "[::1]"].includes(base.hostname),
  "BASE_URL must point to an isolated local Miru app"
);
const company = {
  id: "1",
  name: "Synthetic payroll workspace",
  base_currency: "INR",
  payroll_review_enabled: true,
};
const run = {
  id: "1",
  company_id: company.id,
  period: "2026-11-01",
  currency: "INR",
  dry_run: true,
  status: "approved",
  review_issues: [],
  reviewers: { accounts: null, final: null },
  revision: {
    number: 1,
    digest: "synthetic-unchanged-revision-digest",
    created_at: "2026-11-01T00:00:00Z",
    policies: {},
    exceptions: [],
    lines: [],
    approvals: [],
    audit: [],
  },
};
const browser = await chromium.launch();
const context = await browser.newContext({ serviceWorkers: "block" });
const page = await context.newPage();
const errors = [];
const unexpectedRequests = [];
const payrollRequests = [];
let approvalState = "draft";
page.on("pageerror", error => errors.push(error.message));
page.on("console", message => {
  if (message.type() === "error") errors.push(message.text());
});
await context.route("**/*", async route => {
  const request = route.request();
  const url = new URL(request.url());
  if (url.origin !== base.origin) {
    unexpectedRequests.push(`${request.method()} ${url.origin}${url.pathname}`);
    return route.abort();
  }
  if (!url.pathname.startsWith("/api/")) return route.continue();
  assert.equal(
    request.method(),
    "GET",
    "Synthetic review must remain read-only"
  );
  let body;
  switch (url.pathname) {
    case "/api/v1/users/_me":
      body = {
        user: {
          id: "1",
          email: "reviewer@example.test",
          first_name: "Synthetic",
          last_name: "Reviewer",
          current_workspace_id: company.id,
          locale: "en-US",
          confirmed_at: "2026-11-01T00:00:00Z",
        },
        company,
        company_role: "owner",
      };
      break;
    case "/api/v1/workspaces":
      body = { companies: [company], workspaces: [company] };
      break;
    case "/api/v1/desktop/current_timer":
      body = { current_timer: null };
      break;
    case "/api/v1/payroll_runs/1":
      payrollRequests.push("detail");
      assert.equal(url.searchParams.get("company_id"), company.id);
      body = { payroll_run: run };
      break;
    case "/api/v1/payroll_runs/1/preflight":
      payrollRequests.push("preflight");
      assert.equal(url.searchParams.get("company_id"), company.id);
      body = {
        preflight: {
          status: "blocked",
          approval_state: approvalState,
          preview_only: true,
          execution_enabled: false,
          company_id: company.id,
          revision_digest: run.revision.digest,
          recipient_count: 0,
          total_net_minor: "0",
          currency: "INR",
          blockers:
            approvalState === "draft"
              ? ["invalid_snapshot", "approval_required"]
              : ["dry_run_only"],
          reconciliation: { reconciled: true, issues: [] },
        },
      };
      break;
    default:
      unexpectedRequests.push(`${request.method()} ${url.pathname}`);
      return route.abort();
  }
  return route.fulfill({ status: 200, json: body });
});

try {
  await page.goto(new URL("/payroll/1", base).href);
  await page
    .getByRole("heading", { name: "Payroll review", exact: true })
    .last()
    .waitFor();
  await page.waitForFunction(() => {
    const main = document.querySelector("main");
    return (
      main?.querySelector('[role="alert"]') ||
      main?.textContent.includes("Recipient calculations")
    );
  });
  assert.equal(
    await page.getByRole("alert").count(),
    1,
    "Mismatched approval states must show a refresh error"
  );
  assert.equal(
    await page.getByText("Owner approved", { exact: false }).count(),
    0,
    "Stale approval must not render"
  );
  assert.equal(
    await page.getByRole("heading", { name: "Recipient calculations" }).count(),
    0
  );
  await page.getByRole("button", { name: "Refresh review" }).waitFor();
  if (process.env.SCREENSHOT_DIR) {
    await mkdir(process.env.SCREENSHOT_DIR, { recursive: true });
    await page.screenshot({
      path: `${process.env.SCREENSHOT_DIR}/approval-state-mismatch.png`,
      fullPage: true,
    });
  }

  approvalState = "approved";
  await page.getByRole("button", { name: "Refresh review" }).click();
  await page.getByRole("heading", { name: "Recipient calculations" }).waitFor();
  assert.equal(await page.getByRole("alert").count(), 0);
  assert.equal(
    await page
      .getByText("Synthetic payroll workspace · Owner approved", {
        exact: true,
      })
      .count(),
    1
  );
  assert.deepEqual(payrollRequests.sort(), [
    "detail",
    "detail",
    "preflight",
    "preflight",
  ]);
  assert.deepEqual(
    unexpectedRequests,
    [],
    "All API data must be intercepted and external calls blocked"
  );
  assert.deepEqual(errors, [], "Review must render without browser errors");
  if (process.env.SCREENSHOT_DIR) {
    await page.screenshot({
      path: `${process.env.SCREENSHOT_DIR}/approval-state-consistent.png`,
      fullPage: true,
    });
  }
  console.log(
    "PASS: mismatched states hidden; refresh renders matching approved states; no browser errors or external requests"
  );
} finally {
  await browser.close();
}
