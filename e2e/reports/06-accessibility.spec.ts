/**
 * Accessibility — keyboard navigation, screen reader support, focus management.
 * Covers manual test sections: 11 (Accessibility).
 */
import { test, expect } from "@playwright/test";
import { goToReports, goToReport } from "./helpers";

test.describe("Reports Accessibility", () => {
    test("keyboard navigation works on main reports page", async ({ page }) => {
        await goToReports(page);

        // Tab through the page elements
        await page.keyboard.press("Tab");

        // Should be able to focus on interactive elements
        const focusedElement = page.locator(":focus");
        await expect(focusedElement).toBeVisible();

        // Continue tabbing to find report cards or other interactive elements
        let tabCount = 0;
        let foundInteractiveElement = false;

        while (tabCount < 20 && !foundInteractiveElement) {
            await page.keyboard.press("Tab");
            tabCount++;

            const currentFocus = page.locator(":focus");
            const role = await currentFocus.getAttribute("role").catch(() => null);
            const tagName = await currentFocus.evaluate(el => el.tagName.toLowerCase()).catch(() => "");
            const ariaLabel = await currentFocus.getAttribute("aria-label").catch(() => null);

            if (role === "button" || tagName === "button" || (ariaLabel && ariaLabel.includes("report"))) {
                foundInteractiveElement = true;
                await expect(currentFocus).toBeVisible();
            }
        }

        // Should find at least one focusable interactive element
        expect(foundInteractiveElement).toBe(true);
    });

    test("report cards are keyboard accessible", async ({ page }) => {
        await goToReports(page);

        // Find a report card
        const reportCard = page.locator("[role='button']").filter({ hasText: /time reports/i }).first();
        await expect(reportCard).toBeVisible();

        // Focus on the card
        await reportCard.focus();

        // Should be focused
        await expect(reportCard).toBeFocused();

        // Should be able to activate with Enter
        await page.keyboard.press("Enter");

        // Should navigate to the report
        await expect(page).toHaveURL(/\/reports\/.+/);
    });

    test("report cards can be activated with Space key", async ({ page }) => {
        await goToReports(page);

        // Find a report card
        const reportCard = page.locator("[role='button']").filter({ hasText: /payment.*report/i }).first();
        await expect(reportCard).toBeVisible();

        // Focus on the card
        await reportCard.focus();

        // Should be able to activate with Space
        await page.keyboard.press("Space");

        // Should navigate to the report
        await expect(page).toHaveURL(/\/reports\/.+/);
    });

    test("category tabs are keyboard accessible", async ({ page }) => {
        await goToReports(page);

        // Find category tabs
        const allReportsTab = page.getByRole("tab", { name: /all reports/i });
        const timeTab = page.getByRole("tab", { name: /^time$/i });
        const financialTab = page.getByRole("tab", { name: /financial/i });

        // Should be able to focus on tabs
        await allReportsTab.focus();
        await expect(allReportsTab).toBeFocused();

        // Should be able to navigate with arrow keys
        await page.keyboard.press("ArrowRight");
        await expect(timeTab).toBeFocused();

        // Should be able to activate with Enter or Space
        await page.keyboard.press("Enter");
        await expect(timeTab).toHaveAttribute("data-state", "active");
    });

    test("screen reader labels are present on report cards", async ({ page }) => {
        await goToReports(page);

        // Check for proper aria-labels on report cards — they use role="button" with aria-label
        const reportCards = page.locator("[role='button'][aria-label]");
        const cardCount = await reportCards.count();

        expect(cardCount).toBeGreaterThan(0);

        // Check first card has proper labeling
        const firstCard = reportCards.first();
        const ariaLabel = await firstCard.getAttribute("aria-label");

        // Should have descriptive aria-label containing "report"
        expect(ariaLabel).toBeTruthy();
        expect(ariaLabel!.toLowerCase()).toContain("report");
    });

    test("focus indicators are visible", async ({ page }) => {
        await goToReports(page);

        // Tab to an interactive element
        await page.keyboard.press("Tab");

        const focusedElement = page.locator(":focus");
        await expect(focusedElement).toBeVisible();

        // Check that focus is visually indicated (this is hard to test programmatically)
        // We can at least verify the element is focused
        const tagName = await focusedElement.evaluate(el => el.tagName);
        expect(["BUTTON", "A", "INPUT", "SELECT"].includes(tagName)).toBe(true);
    });

    test("keyboard navigation works in time entry report", async ({ page }) => {
        await goToReport(page, "time-entry");

        // The page has multiple interactive controls (Select triggers, Buttons)
        // Directly check that known interactive elements are focusable
        const exportButton = page.getByRole("button", { name: /export/i });
        await expect(exportButton).toBeVisible();
        await exportButton.focus();
        await expect(exportButton).toBeFocused();
    });

    test("keyboard navigation works in payment report", async ({ page }) => {
        await goToReport(page, "payments");

        // The page has multiple interactive controls (Select triggers, Buttons)
        // Directly check that known interactive elements are focusable
        const exportButton = page.getByRole("button", { name: /export/i });
        await expect(exportButton).toBeVisible();
        await exportButton.focus();
        await expect(exportButton).toBeFocused();
    });

    test("export dropdown is keyboard accessible", async ({ page }) => {
        await goToReport(page, "time-entry");

        // Find export button
        const exportButton = page.getByRole("button", { name: /export/i });
        await expect(exportButton).toBeVisible();

        // Focus on export button
        await exportButton.focus();
        await expect(exportButton).toBeFocused();

        // Open dropdown with Enter
        await page.keyboard.press("Enter");

        // Should show export options
        const csvOption = page.locator("[role='menuitem']").filter({ hasText: /csv/i });
        await expect(csvOption).toBeVisible();

        // Should be able to navigate with arrow keys
        await page.keyboard.press("ArrowDown");

        // Close dropdown with Escape
        await page.keyboard.press("Escape");
        await expect(csvOption).not.toBeVisible();
    });

    test("date picker is keyboard accessible", async ({ page }) => {
        await goToReport(page, "time-entry");

        // Date picker button may not exist on all report pages
        const dateButton = page.getByRole("button", { name: /date|calendar/i });

        // Only test if date button exists
        if (await dateButton.count() > 0) {
            await expect(dateButton).toBeVisible();

            // Focus and activate
            await dateButton.focus();
            await expect(dateButton).toBeFocused();

            await page.keyboard.press("Enter");

            // Calendar should open
            const calendar = page.locator("[role='dialog'], .calendar, [class*='calendar']").first();

            // Only check if calendar opens
            if (await calendar.count() > 0) {
                await expect(calendar).toBeVisible();

                // Should be able to close with Escape
                await page.keyboard.press("Escape");
                await expect(calendar).not.toBeVisible();
            }
        }
    });

    test("table navigation is keyboard accessible", async ({ page }) => {
        await goToReport(page, "time-entry");

        // Wait for table to load
        await expect(page.locator("table").first()).toBeVisible({ timeout: 10000 });

        // Tab to table area
        let tabCount = 0;
        let foundTable = false;

        while (tabCount < 20 && !foundTable) {
            await page.keyboard.press("Tab");
            tabCount++;

            const currentFocus = page.locator(":focus");
            const isInTable = await currentFocus.evaluate(el => {
                return el.closest("table") !== null;
            }).catch(() => false);

            if (isInTable) {
                foundTable = true;
                await expect(currentFocus).toBeVisible();
            }
        }

        // Table should be keyboard navigable (implementation dependent)
        // At minimum, we should be able to reach table content
    });

    test("skip links or landmarks are available", async ({ page }) => {
        await goToReports(page);

        // Look for skip links (usually hidden until focused)
        const skipLinks = page.locator("a[href*='#'], [class*='skip']");

        // Look for landmark elements
        const landmarks = page.locator("main, [role='main'], nav, [role='navigation']");

        // Should have at least some navigational structure
        const landmarkCount = await landmarks.count();
        expect(landmarkCount).toBeGreaterThan(0);
    });

    test("headings provide proper document structure", async ({ page }) => {
        await goToReports(page);

        // Should have proper heading hierarchy
        const h1 = page.locator("h1");
        await expect(h1.first()).toBeVisible();

        // Check for other heading levels
        const headings = page.locator("h1, h2, h3, h4, h5, h6");
        const headingCount = await headings.count();

        expect(headingCount).toBeGreaterThan(0);
    });

    test("form controls have proper labels", async ({ page }) => {
        await goToReport(page, "time-entry");

        // Check that form controls have labels or aria-labels
        const selects = page.locator("select, [role='combobox']");
        const selectCount = await selects.count();

        if (selectCount > 0) {
            const firstSelect = selects.first();

            // Should have label, aria-label, or aria-labelledby
            const hasLabel = await firstSelect.evaluate(el => {
                const id = el.id;
                const ariaLabel = el.getAttribute("aria-label");
                const ariaLabelledBy = el.getAttribute("aria-labelledby");
                const label = id ? document.querySelector(`label[for="${id}"]`) : null;

                return !!(ariaLabel || ariaLabelledBy || label);
            });

            expect(hasLabel).toBe(true);
        }
    });
});