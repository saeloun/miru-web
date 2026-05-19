import { expect, Page, test } from "@playwright/test";
import { signInAsSeedUser } from "../navigation/helpers";
import { goToTimeTracking } from "./helpers";

async function fetchCurrentUserId(page: Page): Promise<string> {
    const meRes = await page.request.get("/api/v1/users/_me");
    expect(meRes.ok(), `Failed to fetch current user: ${meRes.status()}`).toBeTruthy();
    const meBody = await meRes.json();
    return String(meBody.user?.id ?? meBody.id);
}

async function openTimeOffForm(page: Page) {
    await goToTimeTracking(page);
    await page.locator("[data-testid='mark-time-off-button']").click();
    await expect(
        page.getByRole("button", { name: /save entry/i }),
    ).toBeVisible({ timeout: 10_000 });
}

async function selectFirstLeaveType(page: Page) {
    const leaveTypeSelect = page
        .getByRole("button", { name: /select leave type/i })
        .first();
    await expect(leaveTypeSelect).toBeVisible();
    await leaveTypeSelect.click();

    const leaveTypeOption = leaveTypeSelect
        .locator("xpath=following-sibling::div//button")
        .first();
    await expect(leaveTypeOption).toBeVisible();
    await leaveTypeOption.click();
}

async function saveTimeOffAndGetRequestUserId(page: Page): Promise<{
    requestUserId: string | null;
    responseBody: any;
}> {
    const saveButton = page.getByRole("button", { name: /save entry/i });
    await expect(saveButton).toBeEnabled();

    const [saveResponse] = await Promise.all([
        page.waitForResponse(
            response =>
                response.request().method() === "POST" &&
                response.url().includes("/api/v1/timeoff_entries") &&
                response.status() === 200,
            { timeout: 15_000 },
        ),
        saveButton.click(),
    ]);

    const requestUrl = new URL(saveResponse.url());
    const requestUserId = requestUrl.searchParams.get("user_id");
    const responseBody = await saveResponse.json();

    return { requestUserId, responseBody };
}

async function cleanupTimeOffEntry(page: Page, responseBody: any) {
    const entryId = responseBody?.timeoff_entry?.id ?? responseBody?.id;
    if (!entryId) return;

    const cleanupRes = await page.request.delete(`/api/v1/timeoff_entries/${entryId}`);
    expect(
        [200, 204, 404].includes(cleanupRes.status()),
        `Failed to clean up time off entry ${entryId}: ${cleanupRes.status()}`,
    ).toBeTruthy();
}

async function selectDifferentEmployee(page: Page): Promise<string> {
    const selector = page.locator("[data-testid='user-select']");
    await expect(selector).toBeVisible();

    const currentLabel = (await selector.innerText()).trim();
    await selector.click();

    const options = page.getByRole("option");
    const optionCount = await options.count();
    expect(
        optionCount,
        "Admin should be able to switch across multiple employees",
    ).toBeGreaterThan(1);

    let targetIndex = -1;
    for (let index = 0; index < optionCount; index += 1) {
        const label = (await options.nth(index).innerText()).trim();
        if (label !== currentLabel) {
            targetIndex = index;
            break;
        }
    }

    expect(targetIndex, "No alternate employee option found").toBeGreaterThanOrEqual(0);

    const targetOption = options.nth(targetIndex);
    const targetLabel = (await targetOption.innerText()).trim();

    await targetOption.click();

    await expect(selector).toContainText(targetLabel);
    return targetLabel;
}

test.describe("Time Tracking — Role Access (Admin vs Employee)", () => {
    test.use({ storageState: undefined });
    test.describe.configure({ mode: "serial" });

    test("admin sees employee selector and can switch to another employee", async ({
        page,
    }) => {
        await signInAsSeedUser(page, "admin");
        await goToTimeTracking(page);

        const selectedEmployeeLabel = await selectDifferentEmployee(page);
        expect(selectedEmployeeLabel.length).toBeGreaterThan(0);
    });

    test("employee does not see employee selector", async ({ page }) => {
        await signInAsSeedUser(page, "employee");
        await goToTimeTracking(page);

        await expect(page.locator("[data-testid='user-select']")).toHaveCount(0);
        await expect(page.getByText(/entries for/i).first()).toBeVisible();
    });

    test("employee can mark time off for self", async ({ page }) => {
        await signInAsSeedUser(page, "employee");
        const employeeUserId = await fetchCurrentUserId(page);

        await openTimeOffForm(page);
        await selectFirstLeaveType(page);
        const { requestUserId, responseBody } = await saveTimeOffAndGetRequestUserId(page);

        expect(requestUserId).toBe(employeeUserId);
        await cleanupTimeOffEntry(page, responseBody);
    });

    test("admin can mark time off for selected employee", async ({ page }) => {
        await signInAsSeedUser(page, "admin");
        const adminUserId = await fetchCurrentUserId(page);

        await goToTimeTracking(page);
        await selectDifferentEmployee(page);

        await page.locator("[data-testid='mark-time-off-button']").click();
        await selectFirstLeaveType(page);
        const { requestUserId, responseBody } = await saveTimeOffAndGetRequestUserId(page);

        expect(requestUserId).not.toBe(adminUserId);
        await cleanupTimeOffEntry(page, responseBody);
    });
});
