/**
 * Weekly Reminder Email Delivery Browser Tests
 *
 * Verifies the user-facing reminder email flow in a browser session:
 * - users under the threshold receive the email
 * - users at or above the threshold do not receive it
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";
import {
    clearLetterOpenerEmails,
    createTimesheetEntries,
    deleteTimesheetEntriesForWeek,
    getFirstProjectId,
    getPreviousWeekDates,
    resetWeeklyReminderMarker,
    setCompanyWorkingHours,
    triggerWeeklyReminderNow,
    updateNotificationPreference,
    purgeEntriesForWeek,
} from "./helpers";

test.describe("Weekly Reminder Email Delivery", () => {
    test.describe.configure({ mode: "serial" });

    let projectId: string;
    const previousWeek = getPreviousWeekDates();
    const letterOpenerDir = path.join(process.cwd(), "tmp", "letter_opener");

    test.beforeAll(async ({ request }) => {
        projectId = await getFirstProjectId(request);
    });

    test.beforeEach(async ({ request }) => {
        await deleteTimesheetEntriesForWeek(
            request,
            previousWeek.startDate,
            previousWeek.endDate
        );
        await purgeEntriesForWeek(
            request,
            previousWeek.startDate,
            previousWeek.endDate
        );
        await clearLetterOpenerEmails();
        await resetWeeklyReminderMarker(request);
        await setCompanyWorkingHours(request, 40);
        await updateNotificationPreference(request, {
            timesheetReminderEnabled: true,
            notificationEnabled: true,
        });
    });

    test("users below the threshold receive the weekly reminder email", async ({
        page,
        request,
    }) => {
        await createTimesheetEntries(request, [
            { date: previousWeek.dates[0], duration: 360, projectId },
            { date: previousWeek.dates[1], duration: 360, projectId },
            { date: previousWeek.dates[2], duration: 360, projectId },
            { date: previousWeek.dates[3], duration: 360, projectId },
            { date: previousWeek.dates[4], duration: 360, projectId },
        ]);

        await triggerWeeklyReminderNow();

        const entries = await fs.readdir(letterOpenerDir, {
            withFileTypes: true,
        });
        const emailDirectories = entries
            .filter(entry => entry.isDirectory())
            .map(entry => entry.name)
            .sort();
        const latestEmailDirectory = emailDirectories.at(-1);

        expect(latestEmailDirectory).toBeDefined();
        const richEmailPath = path.join(
            letterOpenerDir,
            latestEmailDirectory as string,
            "rich.html"
        );
        const richEmailHtml = await fs.readFile(richEmailPath, "utf8");

        expect(richEmailHtml).toContain(
            "Complete your Miru timesheet for last week"
        );
        expect(richEmailHtml).toContain(
            "You logged fewer than 40 hours"
        );

        await page.goto(
            "/rails/mailers/send_weekly_reminder_to_user_mailer/notify_user_about_missed_entries"
        );

        const iframe = page.frameLocator("iframe").first();
        await expect(
            iframe.getByRole("heading", { name: /complete your timesheet/i })
        ).toBeVisible();
        await expect(
            iframe.getByText(/you logged fewer than 40 hours/i)
        ).toBeVisible();
    });

    test("users at or above the threshold do not receive the weekly reminder email", async ({
        request,
    }) => {
        await createTimesheetEntries(request, [
            { date: previousWeek.dates[0], duration: 480, projectId },
            { date: previousWeek.dates[1], duration: 480, projectId },
            { date: previousWeek.dates[2], duration: 480, projectId },
            { date: previousWeek.dates[3], duration: 480, projectId },
            { date: previousWeek.dates[4], duration: 480, projectId },
        ]);

        await triggerWeeklyReminderNow();

        const entries = await fs.readdir(letterOpenerDir, {
            withFileTypes: true,
        });
        const emailDirectories = entries.filter(entry => entry.isDirectory());
        expect(emailDirectories).toHaveLength(0);
    });
});
