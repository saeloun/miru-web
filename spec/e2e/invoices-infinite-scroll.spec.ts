import { test, expect } from "playwright/test";

const appUrl = process.env.PLAYWRIGHT_APP_URL || "http://127.0.0.1:3000";

const invoice = (id: number, status = "draft") => ({
  id,
  amount: "100.0",
  client: { name: "Acme", logo: "" },
  company: { baseCurrency: "USD" },
  currency: "USD",
  dueDate: "Jun 30, 2026",
  invoiceNumber: `INV-${String(id).padStart(3, "0")}`,
  issueDate: "Jun 01, 2026",
  status,
});

const invoiceResponse = (page: number) => ({
  invoices: Array.from({ length: 100 }, (_, index) =>
    invoice((page - 1) * 100 + index + 1)
  ),
  paginationDetails: { page, pages: 2, total: 200 },
  summary: {
    draftAmount: 20000,
    openAmount: 0,
    outstandingAmount: 0,
    overdueAmount: 0,
    draftCount: 200,
    openCount: 0,
    outstandingCount: 0,
    overdueCount: 0,
    paidCount: 0,
    totalCount: 200,
    totalAmount: 20000,
    currency: "USD",
  },
  recentlyUpdatedInvoices: [],
  recentlyUpdatedTotalCount: 200,
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

  await page.goto(`${appUrl}/user/sign_in`);
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

  await page.goto(`${appUrl}/invoices`);
  await expect(page.getByText("INV-001")).toBeVisible();
  await page.getByRole("button", { name: /Draft.*200 Invoices/ }).click();
  await expect(page.getByText("Scroll to load more invoices")).toBeVisible();
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

  await expect
    .poll(() => requestedUrls.some(url => url.searchParams.get("page") === "2"))
    .toBe(true);
  expect(consoleErrors).toEqual([]);
});

test("filtered invoice list keeps loading until matching invoices are found", async ({
  page,
}) => {
  const consoleErrors: string[] = [];
  const requestedUrls: URL[] = [];

  page.on("console", message => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", error => consoleErrors.push(error.message));

  await page.goto(`${appUrl}/user/sign_in`);
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
    const pageNumber = Number(url.searchParams.get("page") || 1);
    const invoices =
      pageNumber === 1
        ? Array.from({ length: 100 }, (_, index) =>
            invoice(index + 1, "sent")
          )
        : Array.from({ length: 5 }, (_, index) =>
            invoice(100 + index + 1, "draft")
          );

    return route.fulfill({
      json: {
        invoices,
        paginationDetails: { page: pageNumber, pages: 2, total: 105 },
        summary: {
          draftAmount: 500,
          openAmount: 10000,
          outstandingAmount: 10000,
          overdueAmount: 0,
          draftCount: 5,
          openCount: 100,
          outstandingCount: 100,
          overdueCount: 0,
          paidCount: 0,
          totalCount: 105,
          totalAmount: 10500,
          currency: "USD",
        },
        recentlyUpdatedInvoices: [],
        recentlyUpdatedTotalCount: 105,
        meta: {},
      },
    });
  });

  await page.goto(`${appUrl}/invoices`);
  await expect(page.getByText("INV-001")).toBeVisible();
  await expect
    .poll(() => requestedUrls[0]?.searchParams.get("per"))
    .toBe("100");

  await page.getByRole("button", { name: /Draft.*5 Invoices/ }).click();

  await expect
    .poll(() => requestedUrls.some(url => url.searchParams.get("page") === "2"))
    .toBe(true);
  await expect(page.getByText("INV-101")).toBeVisible();
  await expect(page.getByText(/Viewing 5 matching invoice/)).toBeVisible();
  expect(consoleErrors).toEqual([]);
});
