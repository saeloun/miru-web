import { test, expect } from "@playwright/test";
import {
    createTimesheetEntries,
    deleteTimesheetEntriesForWeek,
    purgeEntriesForWeek,
    getFirstProjectId,
    getPreviousWeekDates,
    updateNotificationPreference,
    triggerWeeklyReminderNow,
    resetWeeklyReminderMarker,
    getWeeklyReminderMarker,
    setCompanyWorkingHours,
} from "./helpers";

test.describe("Real World Timesheet Reminder Bug", () => {
    test.describe.configure({ mode: "serial" });
    let projectId: string;
    const previousWeek = getPreviousWeekDates();

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
        await resetWeeklyReminderMarker(request);
        await setCompanyWorkingHours(request, 40);
        await updateNotificationPreference(request, {
            timesheetReminderEnabled: true,
            notificationEnabled: true,
        });
    });

    test("User who logs 40+ hours should NOT receive reminder email", async ({ request }) => {
        await createTimesheetEntries(request, [
            { date: previousWeek.dates[0], duration: 480, projectId },
            { date: previousWeek.dates[1], duration: 480, projectId },
            { date: previousWeek.dates[2], duration: 480, projectId },
            { date: previousWeek.dates[3], duration: 480, projectId },
            { date: previousWeek.dates[4], duration: 480, projectId },
            { date: previousWeek.dates[5], duration: 120, projectId },
        ]);

        await triggerWeeklyReminderNow();
        expect(await getWeeklyReminderMarker(request)).toBeNull();
    });

    test("User who logs less than 40 hours SHOULD receive reminder email", async ({ request }) => {
        await createTimesheetEntries(request, [
            { date: previousWeek.dates[0], duration: 360, projectId },
            { date: previousWeek.dates[1], duration: 360, projectId },
            { date: previousWeek.dates[2], duration: 360, projectId },
            { date: previousWeek.dates[3], duration: 360, projectId },
            { date: previousWeek.dates[4], duration: 360, projectId },
        ]);

        await triggerWeeklyReminderNow();
        expect(await getWeeklyReminderMarker(request)).toBe(previousWeek.startDate);
    });

    test("User can disable reminder notifications", async ({ request }) => {
        await updateNotificationPreference(request, {
            timesheetReminderEnabled: false,
            notificationEnabled: false,
        });

        await createTimesheetEntries(request, [
            { date: previousWeek.dates[0], duration: 300, projectId },
            { date: previousWeek.dates[1], duration: 300, projectId },
        ]);

        await triggerWeeklyReminderNow();
        expect(await getWeeklyReminderMarker(request)).toBeNull();
    });
});
