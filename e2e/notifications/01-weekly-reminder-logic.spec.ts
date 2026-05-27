/**
 * Weekly Timesheet Reminder Logic Tests
 *
 * Tests the core bug: Users receiving reminder emails despite having 40+ hours logged
 *
 * Test Scenarios:
 * 1. User with 40+ hours should NOT receive reminder
 * 2. User with < 40 hours SHOULD receive reminder
 * 3. User with exactly 40 hours should NOT receive reminder
 * 4. User with timesheet reminder disabled should NOT receive reminder
 * 5. Reminder respects company working_hours setting
 */

import { test, expect } from "@playwright/test";
import {
    updateNotificationPreference,
    createTimesheetEntries,
    getFirstProjectId,
    getPreviousWeekDates,
    deleteTimesheetEntriesForWeek,
    purgeEntriesForWeek,
    clearLetterOpenerEmails,
    triggerWeeklyReminderNow,
    resetWeeklyReminderMarker,
    getWeeklyReminderMarker,
    setCompanyWorkingHours,
    createTimeoffEntry,
} from "./helpers";

test.describe("Weekly Timesheet Reminder Logic", () => {
    test.describe.configure({ mode: "serial" });
    let projectId: string;
    const previousWeek = getPreviousWeekDates();

    test.beforeAll(async ({ request }) => {
        projectId = await getFirstProjectId(request);
    });

    test.beforeEach(async ({ request }) => {
        // Clean up any existing entries for the previous week
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

        // Ensure weekly reminder is enabled
        await updateNotificationPreference(request, {
            timesheetReminderEnabled: true,
            notificationEnabled: true,
        });
    });

    test("user with 45 hours logged should NOT receive reminder", async ({
        request,
    }) => {
        // Create entries totaling 45 hours (2700 minutes)
        // 5 days × 8 hours = 40 hours, plus 5 extra hours
        const entries = [
            { date: previousWeek.dates[0], duration: 480, projectId }, // Monday: 8h
            { date: previousWeek.dates[1], duration: 480, projectId }, // Tuesday: 8h
            { date: previousWeek.dates[2], duration: 480, projectId }, // Wednesday: 8h
            { date: previousWeek.dates[3], duration: 480, projectId }, // Thursday: 8h
            { date: previousWeek.dates[4], duration: 480, projectId }, // Friday: 8h
            { date: previousWeek.dates[5], duration: 300, projectId }, // Saturday: 5h
        ];

        await createTimesheetEntries(request, entries);

        // Trigger the reminder job (this would normally be done via a rake task or cron)
        // For E2E testing, we'll need to call the service directly or via an admin endpoint
        // This is a placeholder - actual implementation depends on your test setup
        await triggerWeeklyReminderNow();

        // The response should indicate no reminder was sent
        // Or we check that no email was delivered
        // This depends on your email testing setup (letter_opener, mailcatcher, etc.)

        expect(await getWeeklyReminderMarker(request)).toBeNull();
    });

    test("user with 30 hours logged SHOULD receive reminder", async ({
        request,
    }) => {
        // Create entries totaling 30 hours (1800 minutes)
        const entries = [
            { date: previousWeek.dates[0], duration: 360, projectId }, // Monday: 6h
            { date: previousWeek.dates[1], duration: 360, projectId }, // Tuesday: 6h
            { date: previousWeek.dates[2], duration: 360, projectId }, // Wednesday: 6h
            { date: previousWeek.dates[3], duration: 360, projectId }, // Thursday: 6h
            { date: previousWeek.dates[4], duration: 360, projectId }, // Friday: 6h
        ];

        await createTimesheetEntries(request, entries);

        // Trigger the reminder job
        await triggerWeeklyReminderNow();

        expect(await getWeeklyReminderMarker(request)).toBe(previousWeek.startDate);
    });

    test("user with exactly 40 hours should NOT receive reminder", async ({
        request,
    }) => {
        // Create entries totaling exactly 40 hours (2400 minutes)
        const entries = [
            { date: previousWeek.dates[0], duration: 480, projectId }, // Monday: 8h
            { date: previousWeek.dates[1], duration: 480, projectId }, // Tuesday: 8h
            { date: previousWeek.dates[2], duration: 480, projectId }, // Wednesday: 8h
            { date: previousWeek.dates[3], duration: 480, projectId }, // Thursday: 8h
            { date: previousWeek.dates[4], duration: 480, projectId }, // Friday: 8h
        ];

        await createTimesheetEntries(request, entries);

        // Trigger the reminder job
        await triggerWeeklyReminderNow();

        expect(await getWeeklyReminderMarker(request)).toBeNull();
    });

    test("user with reminder disabled should NOT receive email even with 0 hours", async ({
        request,
    }) => {
        // Disable weekly reminder
        await updateNotificationPreference(request, {
            timesheetReminderEnabled: false,
            notificationEnabled: false,
        });

        // Don't create any entries (0 hours logged)

        // Trigger the reminder job
        await triggerWeeklyReminderNow();

        expect(await getWeeklyReminderMarker(request)).toBeNull();
    });

    test("reminder includes timeoff entries in total hours calculation", async ({
        request,
    }) => {
        // Create 32 hours of regular timesheet entries
        const timesheetEntries = [
            { date: previousWeek.dates[0], duration: 480, projectId }, // Monday: 8h
            { date: previousWeek.dates[1], duration: 480, projectId }, // Tuesday: 8h
            { date: previousWeek.dates[2], duration: 480, projectId }, // Wednesday: 8h
            { date: previousWeek.dates[3], duration: 480, projectId }, // Thursday: 8h
        ];

        await createTimesheetEntries(request, timesheetEntries);

        // Create 8 hours of timeoff (PTO) for Friday
        // This should bring total to 40 hours
        await createTimeoffEntry(request, {
            date: previousWeek.dates[4],
            duration: 480,
            note: "E2E test PTO",
        });

        // Total should be 40 hours (32 timesheet + 8 timeoff)
        // User should NOT receive reminder

        // Trigger the reminder job
        await triggerWeeklyReminderNow();

        expect(await getWeeklyReminderMarker(request)).toBeNull();
    });

    test("edge case: user with 39.5 hours should receive reminder", async ({
        request,
    }) => {
        // Create entries totaling 39.5 hours (2370 minutes)
        const entries = [
            { date: previousWeek.dates[0], duration: 480, projectId }, // Monday: 8h
            { date: previousWeek.dates[1], duration: 480, projectId }, // Tuesday: 8h
            { date: previousWeek.dates[2], duration: 480, projectId }, // Wednesday: 8h
            { date: previousWeek.dates[3], duration: 480, projectId }, // Thursday: 8h
            { date: previousWeek.dates[4], duration: 450, projectId }, // Friday: 7.5h
        ];

        await createTimesheetEntries(request, entries);

        // Trigger the reminder job
        await triggerWeeklyReminderNow();

        expect(await getWeeklyReminderMarker(request)).toBe(previousWeek.startDate);
    });
});
