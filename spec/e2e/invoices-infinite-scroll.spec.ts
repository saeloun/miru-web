import { test, expect } from "playwright/test";

const invoice = (id: number) => ({
  id,
  amount: "100.0",
  client: { name: "Acme", logo: "" },
  company: { baseCurrency: "USD" },
  currency: "USD",
  dueDate: "Jun 30, 2026",
  invoiceNumber: `INV-${String(id).padStart(3, "0")}`,
  issueDate: "Jun 01, 2026",
  status: "draft",
});

const invoiceResponse = (page: number) => ({
  invoices: Array.from({ length: 20 }, (_, index) =>
    invoice((page - 1) * 20 + index + 1)
  ),
  paginationDetails: { page, pages: 2, total: 40 },
  summary: {
    draftAmount: 4000,
    openAmount: 0,
    outstandingAmount: 0,
    overdueAmount: 0,
    draftCount: 40,
    openCount: 0,
    outstandingCount: 0,
    overdueCount: 0,
    paidCount: 0,
    totalCount: 40,
    totalAmount: 4000,
    currency: "USD",
  },
  recentlyUpdatedInvoices: [],
  recentlyUpdatedTotalCount: 40,
  meta: {},
});

test("invoice infinite scroll loads the next filtered page", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  const requestedUrls: URL[] = [];

  page.on("console", message => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", error => consoleErrors.push(error.message));

  await page.goto("http://127.0.0.1:3001/user/sign_in");
  await page.getByRole("textbox", { name: "Email" }).fill("vipul@saeloun.com");
  await page.getByRole("textbox", { name: "Password" }).fill("password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL("**/dashboard", { timeout: 10000 });

  await page.route("**/api/v1/payments/settings", route =>
    route.fulfill({
      json: { providers: { stripe: {}, upi: {}, razorpay: {} } },
    })
  );
  await page.route("**/api/v1/invoices/analytics/monthly_revenue", route =>
    route.fulfill({
      json: { chart_data: [], statistics: {} },
    })
  );
  await page.route("**/api/v1/invoices/recently_updated?**", route =>
    route.fulfill({
      json: {
        invoices: [],
        meta: { has_more: false, total_count: 0 },
      },
    })
  );
  await page.route("**/api/v1/invoices**", route => {
    const url = new URL(route.request().url());
    if (url.pathname !== "/api/v1/invoices") return route.fallback();

    requestedUrls.push(url);

    return route.fulfill({
      json: invoiceResponse(Number(url.searchParams.get("page") || 1)),
    });
  });

  await page.goto("http://127.0.0.1:3001/invoices");
  await expect(page.getByText("INV-001")).toBeVisible();
  await page.getByRole("button", { name: /Draft.*40 Invoices/ }).click();
  await expect(page.getByText("Scroll to load more invoices")).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

  await expect
    .poll(() => requestedUrls.some(url => url.searchParams.get("page") === "2"))
    .toBe(true);
  expect(consoleErrors).toEqual([]);
});
