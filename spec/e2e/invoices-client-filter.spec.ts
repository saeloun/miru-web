import { test, expect } from "playwright/test";

const appUrl = process.env.PLAYWRIGHT_APP_URL || "http://127.0.0.1:3000";

test("client filtering resets pagination and keeps the client on subsequent pages", async ({
  page,
}) => {
  const errors: string[] = [];
  const requests: URL[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.goto(`${appUrl}/user/sign_in`);
  await page.getByRole("textbox", { name: "Email" }).fill("vipul@saeloun.com");
  await page.getByRole("textbox", { name: "Password" }).fill("password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL("**/dashboard");

  await page.route("**/api/v1/clients", route =>
    route.fulfill({
      json: {
        client_details: [
          { id: 1, name: "Acme" },
          { id: 2, name: "Beta" },
          { id: 3, name: "Empty" },
        ],
      },
    })
  );
  await page.route("**/api/v1/invoices/analytics/monthly_revenue", route =>
    route.fulfill({
      json: { chart_data: [], statistics: {} },
    })
  );
  await page.route("**/api/v1/invoices**", route => {
    const url = new URL(route.request().url());
    if (url.pathname !== "/api/v1/invoices") return route.fallback();
    requests.push(url);
    const clientId = url.searchParams.get("client_id");
    const pageNumber = Number(url.searchParams.get("page"));
    const empty = clientId === "3";
    const count = empty ? 0 : pageNumber === 1 ? 100 : 1;
    return route.fulfill({
      json: {
        invoices: Array.from({ length: count }, (_, index) => ({
          id: (pageNumber - 1) * 100 + index + 1,
          invoiceNumber: `${clientId || "all"}-${
            (pageNumber - 1) * 100 + index + 1
          }`,
          client: {
            id: clientId || "1",
            name: clientId === "2" ? "Beta" : "Acme",
          },
          status: "draft",
          amount: "100",
          currency: "USD",
          issueDate: "2026-10-01",
          dueDate: "2026-10-31",
        })),
        paginationDetails: {
          page: pageNumber,
          pages: empty ? 1 : 2,
          total: empty ? 0 : 101,
        },
        summary: {
          draftCount: 101,
          draftAmount: 10100,
          openCount: 0,
          openAmount: 0,
          overdueCount: 0,
          overdueAmount: 0,
          outstandingAmount: 0,
          totalAmount: 10100,
          currency: "USD",
        },
      },
    });
  });

  await page.goto(`${appUrl}/invoices`);
  await expect(page.getByText("#all-1", { exact: true })).toBeVisible();
  await page.getByText("Scroll to load more invoices").scrollIntoViewIfNeeded();
  await expect(page.getByText("#all-101", { exact: true })).toBeVisible();

  const clientPicker = page.getByRole("combobox", {
    name: "Client",
    exact: true,
  });
  await clientPicker.scrollIntoViewIfNeeded();
  await clientPicker.click();
  await page.getByRole("option", { name: "Beta", exact: true }).click();
  await expect(page.getByText("#2-1", { exact: true })).toBeVisible();
  expect(
    requests
      .find(url => url.searchParams.get("client_id") === "2")
      ?.searchParams.get("page")
  ).toBe("1");
  await expect(page.getByText("#all-101", { exact: true })).toHaveCount(0);
  await page.getByText("Scroll to load more invoices").scrollIntoViewIfNeeded();
  await expect(page.getByText("#2-101", { exact: true })).toBeVisible();
  expect(
    requests.some(
      url =>
        url.searchParams.get("client_id") === "2" &&
        url.searchParams.get("page") === "2"
    )
  ).toBe(true);

  await clientPicker.scrollIntoViewIfNeeded();
  await clientPicker.click();
  await page.getByRole("option", { name: "Empty", exact: true }).click();
  await expect(page.getByText("#2-1", { exact: true })).toHaveCount(0);
  await expect(clientPicker).toContainText("Empty");
  await clientPicker.click();
  await page.getByRole("option", { name: "All Clients", exact: true }).click();
  await expect(page.getByText("#all-1", { exact: true })).toBeVisible();
  expect(requests.at(-1)?.searchParams.has("client_id")).toBe(false);
  expect(errors).toEqual([]);
});
