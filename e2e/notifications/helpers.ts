/**
 * Helper functions for notification-related E2E tests
 */
import { execFileSync } from "node:child_process";
import { Page, expect, APIRequestContext } from "@playwright/test";

/**
 * Navigate to notification settings page
 */
export async function goToNotificationSettings(page: Page) {
    await page.goto("/settings/notifications");
    await page.waitForLoadState("networkidle");
    await expect(
        page.getByRole("heading", {
            name: "Notification Settings",
            exact: true,
        })
    ).toBeVisible({ timeout: 15_000 });
}

/**
 * Get current user ID and company ID
 */
export async function getCurrentUserInfo(request: APIRequestContext): Promise<{ userId: string; companyId: string }> {
    const res = await request.get("/api/v1/users/_me");
    expect(res.ok(), `Failed to fetch current user: ${res.status()}`).toBeTruthy();
    const data = await res.json();
    return {
        userId: String(data.user.id),
        companyId: String(data.company.id)
    };
}

export async function getFirstLeaveTypeId(
    request: APIRequestContext
): Promise<string> {
    const res = await request.get("/api/v1/leaves");
    expect(res.ok(), `Failed to fetch leaves: ${res.status()}`).toBeTruthy();
    const body = await res.json();
    const leaves = body.leaves || [];
    const firstLeaveType = leaves
        .flatMap((leave: any) => leave.leave_types || [])
        .find((leaveType: any) => leaveType?.id);

    if (!firstLeaveType) {
        throw new Error("No leave type found in seed data");
    }

    return String(firstLeaveType.id);
}

/**
 * Get notification preference for a user via API
 */
export async function getNotificationPreference(
    request: APIRequestContext,
    userId?: string
) {
    if (!userId) {
        const userInfo = await getCurrentUserInfo(request);
        userId = userInfo.userId;
    }

    const endpoint = `/api/v1/team/${userId}/notification_preferences`;
    const res = await request.get(endpoint);
    expect(res.ok(), `Failed to fetch notification preferences: ${res.status()}`).toBeTruthy();
    return await res.json();
}

/**
 * Update notification preference via API
 */
export async function updateNotificationPreference(
    request: APIRequestContext,
    preferences: {
        timesheetReminderEnabled?: boolean;
        notificationEnabled?: boolean;
        monthlyReportDigestEnabled?: boolean;
    },
    userId?: string
) {
    if (!userId) {
        const userInfo = await getCurrentUserInfo(request);
        userId = userInfo.userId;
    }

    const endpoint = `/api/v1/team/${userId}/notification_preferences`;
    const res = await request.put(endpoint, {
        data: {
            notification_preference: {
                timesheet_reminder_enabled: preferences.timesheetReminderEnabled,
                notification_enabled: preferences.notificationEnabled,
                monthly_report_digest_enabled: preferences.monthlyReportDigestEnabled,
            },
        },
    });
    expect(res.ok(), `Failed to update notification preferences: ${res.status()}`).toBeTruthy();
    return await res.json();
}

/**
 * Create timesheet entries for a specific week via API
 * @param request - API request context
 * @param entries - Array of entry objects with date, duration (in minutes), projectId
 * @returns Array of created timesheet entries
 */
export async function createTimesheetEntries(
    request: APIRequestContext,
    entries: Array<{
        date: string; // YYYY-MM-DD format
        duration: number; // in minutes
        projectId: string;
        note?: string;
        billable?: boolean;
    }>
) {
    const userInfo = await getCurrentUserInfo(request);
    const projectMeta = await getFirstProject(request);
    const createdEntries = [];

    for (const entry of entries) {
        const res = await request.post(`/api/v1/timesheet_entry?user_id=${userInfo.userId}`, {
            data: {
                project_id: entry.projectId,
                timesheet_entry: {
                    work_date: entry.date,
                    duration: entry.duration,
                    note: entry.note || "E2E test entry",
                    bill_status:
                        entry.billable === false || !projectMeta.billable
                            ? "non_billable"
                            : "unbilled",
                },
            },
        });
        expect(res.ok(), `Failed to create timesheet entry: ${res.status()}`).toBeTruthy();
        const body = await res.json();
        createdEntries.push(body);
    }

    return createdEntries;
}

/**
 * Get the first project ID (cached)
 */
let projectCache: { id: string; billable: boolean } | null = null;

async function getFirstProject(request: APIRequestContext): Promise<{ id: string; billable: boolean }> {
    if (projectCache) return projectCache;

    const res = await request.get("/api/v1/projects");
    expect(res.ok(), `Failed to fetch projects: ${res.status()}`).toBeTruthy();
    const body = await res.json();
    const projects = body.projects || [];
    if (projects.length === 0) throw new Error("No projects found in seed data");
    const project = projects.find((item: any) => item.billable) || projects[0];
    projectCache = { id: String(project.id), billable: Boolean(project.billable) };
    return projectCache;
}

export async function getFirstProjectId(request: APIRequestContext): Promise<string> {
    const project = await getFirstProject(request);
    return project.id;
}

/**
 * Get date range for previous week (Monday to Sunday)
 */
export function getPreviousWeekDates(): { startDate: string; endDate: string; dates: string[] } {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

    // Calculate days to subtract to get to previous Monday
    const daysToSubtract = currentDay === 0 ? 6 : currentDay + 6;

    const previousMonday = new Date(today);
    previousMonday.setDate(today.getDate() - daysToSubtract);

    const dates: string[] = [];
    for (let i = 0; i < 7; i++) {
        const date = new Date(previousMonday);
        date.setDate(previousMonday.getDate() + i);
        dates.push(date.toISOString().split("T")[0]);
    }

    return {
        startDate: dates[0],
        endDate: dates[6],
        dates,
    };
}

/**
 * Get total hours logged for a specific week via API
 */
export async function getWeeklyHours(
    request: APIRequestContext,
    startDate: string,
    endDate: string
): Promise<number> {
    const userInfo = await getCurrentUserInfo(request);
    const res = await request.get(
        `/api/v1/timesheet_entry?from=${startDate}&to=${endDate}&user_id=${userInfo.userId}`
    );
    expect(res.ok(), `Failed to fetch time tracking data: ${res.status()}`).toBeTruthy();

    const body = await res.json();
    const groupedEntries = body.entries || {};
    const totalMinutes = Object.values(groupedEntries)
        .flat()
        .reduce((sum: number, entry: any) => {
            if (entry?.type !== "timesheet") return sum;
            return sum + (entry.duration || 0);
        }, 0);
    return totalMinutes / 60;
}

/**
 * Delete all timesheet entries for a specific date range
 */
export async function deleteTimesheetEntriesForWeek(
    request: APIRequestContext,
    startDate: string,
    endDate: string
) {
    const userInfo = await getCurrentUserInfo(request);
    const res = await request.get(
        `/api/v1/timesheet_entry?from=${startDate}&to=${endDate}&user_id=${userInfo.userId}`
    );

    if (!res.ok()) return;

    const body = await res.json();
    const entries = Object.values(body.entries || {})
        .flat()
        .filter((entry: any) => entry?.type === "timesheet");

    for (const entry of entries) {
        await request.delete(`/api/v1/timesheet_entry/${entry.id}`);
    }
}

export async function purgeEntriesForWeek(
    request: APIRequestContext,
    startDate: string,
    endDate: string
) {
    const userInfo = await getCurrentUserInfo(request);
    runRailsCommand(`
user = User.find_by(id: ${JSON.stringify(userInfo.userId)})
start_date = Date.parse(${JSON.stringify(startDate)})
end_date = Date.parse(${JSON.stringify(endDate)})

if user
  user.timesheet_entries.where(work_date: start_date..end_date).find_each do |entry|
    entry.destroy!
  end

  user.timeoff_entries.where(leave_date: start_date..end_date).find_each do |entry|
    entry.destroy!
  end
end
`);
}

function runRailsCommand(rubyCode: string) {
    execFileSync(
        "mise",
        ["exec", "--", "bundle", "exec", "rails", "runner", rubyCode],
        {
            cwd: process.cwd(),
            encoding: "utf8",
        },
    );
}

function runRailsJson<T>(rubyCode: string): T {
    const output = execFileSync(
        "mise",
        ["exec", "--", "bundle", "exec", "rails", "runner", rubyCode],
        {
            cwd: process.cwd(),
            encoding: "utf8",
        },
    );

    const lastLine = output
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean)
        .at(-1);

    if (!lastLine) {
        throw new Error("rails runner did not return JSON output");
    }

    return JSON.parse(lastLine) as T;
}

export async function clearLetterOpenerEmails() {
    runRailsCommand(`
require "fileutils"
FileUtils.rm_rf(Dir[Rails.root.join("tmp", "letter_opener", "*")])
`);
}

export async function triggerWeeklyReminderNow() {
    runRailsCommand(`
old_adapter = ActiveJob::Base.queue_adapter
ActiveJob::Base.queue_adapter = :inline
WeeklyReminderForMissedEntriesService.new.process
ActiveJob::Base.queue_adapter = old_adapter
`);
}

export async function resetWeeklyReminderMarker(request: APIRequestContext) {
    const userInfo = await getCurrentUserInfo(request);
    runRailsCommand(`
preference = NotificationPreference.find_by(
  user_id: ${JSON.stringify(userInfo.userId)},
  company_id: ${JSON.stringify(userInfo.companyId)}
)
preference&.update!(weekly_reminder_last_sent_for_week_start: nil)
`);
}

export async function getWeeklyReminderMarker(
    request: APIRequestContext
): Promise<string | null> {
    const userInfo = await getCurrentUserInfo(request);
    const result = runRailsJson<{ marker: string | null }>(`
require "json"

preference = NotificationPreference.find_by(
  user_id: ${JSON.stringify(userInfo.userId)},
  company_id: ${JSON.stringify(userInfo.companyId)}
)

puts({ marker: preference&.weekly_reminder_last_sent_for_week_start&.to_s }.to_json)
`);

    return result.marker;
}

export async function setCompanyWorkingHours(
    request: APIRequestContext,
    workingHours: number
) {
    const userInfo = await getCurrentUserInfo(request);
    runRailsCommand(`
company = Company.find_by(id: ${JSON.stringify(userInfo.companyId)})
company&.update!(working_hours: ${Number(workingHours)})
`);
}

export async function createTimeoffEntry(
    request: APIRequestContext,
    entry: {
        date: string;
        duration: number;
        note?: string;
        leaveTypeId?: string;
    }
) {
    const userInfo = await getCurrentUserInfo(request);
    const leaveTypeId = entry.leaveTypeId || await getFirstLeaveTypeId(request);
    const res = await request.post(`/api/v1/timeoff_entries?user_id=${userInfo.userId}`, {
        data: {
            timeoff_entry: {
                user_id: userInfo.userId,
                leave_date: entry.date,
                duration: entry.duration,
                leave_type_id: Number(leaveTypeId),
                note: entry.note || "E2E test time off entry",
            },
        },
    });
    expect(res.ok(), `Failed to create time off entry: ${res.status()}`).toBeTruthy();
    return await res.json();
}

export async function openEmailBySubject(
    page: Page,
    subject: string | RegExp,
    timeout = 12_000
) {
    await page.goto("/letter_opener");
    const emailLink =
        typeof subject === "string"
            ? page.getByRole("link", { name: subject })
            : page.getByRole("link").filter({ hasText: subject }).first();
    await expect(emailLink).toBeVisible({ timeout });
    await emailLink.click();
}

/**
 * Wait for an email to be sent (checks letter_opener or email logs)
 * This is a placeholder - actual implementation depends on email testing setup
 */
export async function waitForEmail(
    page: Page,
    subject: string,
    timeout = 10000
): Promise<boolean> {
    // In a real scenario, you might:
    // 1. Check letter_opener at /letter_opener
    // 2. Query a test email API
    // 3. Check ActionMailer deliveries via a test endpoint

    // For now, we'll navigate to letter_opener if available
    try {
        await page.goto("/letter_opener", { timeout: 5000 });
        const emailLink = page.locator(`a:has-text("${subject}")`);
        await expect(emailLink).toBeVisible({ timeout });
        return true;
    } catch {
        return false;
    }
}

/**
 * Check if email assets are loading correctly
 * Opens the email preview and checks for broken images
 */
export async function checkEmailAssets(
    page: Page,
    emailSubject: string
): Promise<{ hasImages: boolean; brokenImages: number; totalImages: number }> {
    await openEmailBySubject(page, emailSubject);

    // Wait for iframe to load
    const iframe = page.frameLocator("iframe").first();

    // Check all images in the email
    const images = await iframe.locator("img").all();
    const totalImages = images.length;
    let brokenImages = 0;

    for (const img of images) {
        const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth);
        if (naturalWidth === 0) {
            brokenImages++;
        }
    }

    return {
        hasImages: totalImages > 0,
        brokenImages,
        totalImages,
    };
}
