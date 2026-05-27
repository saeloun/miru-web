/**
 * Settings / Holidays — E2E test helpers.
 * Provides API-based test data creation, cleanup, and page navigation utilities.
 */
import { Page, expect, APIRequestContext } from "@playwright/test";

// ---------------------------------------------------------------------------
// Unique name generation (letters only — model validates /[a-zA-Z\s\-']+/)
// ---------------------------------------------------------------------------

const WORDS = [
    "Alpha", "Bravo", "Charlie", "Delta", "Echo", "Foxtrot", "Golf",
    "Hotel", "India", "Juliet", "Kilo", "Lima", "Mike", "November",
    "Oscar", "Papa", "Quebec", "Romeo", "Sierra", "Tango", "Uniform",
    "Victor", "Whiskey", "Xray", "Yankee", "Zulu",
];
let nameCounter = 0;

/** Convert a number to a base-26 letter string (e.g., 0 -> "a", 25 -> "z", 26 -> "ba"). */
function toLetters(n: number): string {
    let result = "";
    let num = n;
    do {
        result = String.fromCharCode(97 + (num % 26)) + result;
        num = Math.floor(num / 26) - 1;
    } while (num >= 0);
    return result;
}

/** Generate a unique holiday name using only letters (max 30 chars). */
export function uniqueHolidayName(prefix = "Hol"): string {
    nameCounter++;
    // Use process ID + counter for cross-worker uniqueness
    const pid = typeof process !== "undefined" ? process.pid : 0;
    const suffix = toLetters(pid * 1000 + nameCounter);
    const w = WORDS[nameCounter % WORDS.length];
    return `${prefix} ${w} ${suffix}`.slice(0, 30);
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

/** Fetch all holidays from the API. */
export async function fetchHolidays(page: Page) {
    const res = await page.request.get("/api/v1/holidays");
    expect(res.ok(), `Failed to fetch holidays: ${res.status()}`).toBeTruthy();
    const body = await res.json();
    return body.holidays || [];
}

/** Find the holiday record for a given year, or null. */
export async function findHolidayByYear(page: Page, year: number) {
    const holidays = await fetchHolidays(page);
    return holidays.find((h: any) => h.year === year) || null;
}

/**
 * Create (or update) a holiday entry for the given year via the API.
 * Dates should be in YYYY-MM-DD format (Rails parses this for date columns).
 */
export async function upsertHolidays(
    page: Page,
    year: number,
    opts: {
        nationalHolidays?: Array<{ name: string; date: string }>;
        optionalHolidays?: Array<{ name: string; date: string }>;
        enableOptional?: boolean;
        totalOptional?: number;
        timePeriod?: string;
    } = {},
) {
    const addInfos: Array<{ name: string; date: string; category: string }> = [];

    if (opts.nationalHolidays) {
        for (const h of opts.nationalHolidays) {
            addInfos.push({ name: h.name, date: h.date, category: "national" });
        }
    }
    if (opts.optionalHolidays) {
        for (const h of opts.optionalHolidays) {
            addInfos.push({ name: h.name, date: h.date, category: "optional" });
        }
    }

    const res = await page.request.patch(`/api/v1/holidays/${year}`, {
        data: {
            holiday: {
                holiday: {
                    year,
                    enable_optional_holidays: opts.enableOptional ?? false,
                    no_of_allowed_optional_holidays: opts.totalOptional ?? 0,
                    time_period_optional_holidays: opts.timePeriod ?? "per_year",
                    holiday_types: ["national", "optional"],
                },
                add_holiday_infos: addInfos,
                update_holiday_infos: [],
                remove_holiday_infos: [],
            },
        },
    });
    expect(res.ok(), `Failed to upsert holidays for ${year}: ${res.status()}`).toBeTruthy();
    return res.json();
}

/**
 * Remove specific holiday_info IDs from a given year.
 */
export async function removeHolidayInfos(
    page: Page,
    year: number,
    holidayInfoIds: number[],
) {
    const res = await page.request.patch(`/api/v1/holidays/${year}`, {
        data: {
            holiday: {
                holiday: {
                    year,
                    holiday_types: ["national", "optional"],
                },
                add_holiday_infos: [],
                update_holiday_infos: [],
                remove_holiday_infos: holidayInfoIds,
            },
        },
    });
    expect(res.ok(), `Failed to remove holiday infos: ${res.status()}`).toBeTruthy();
}

/**
 * Clean up specific holiday_infos by name for a given year.
 * Only removes holidays matching the given names, preserving seed data and other tests' data.
 */
export async function cleanupHolidaysByName(page: Page, year: number, names: string[]) {
    const holiday = await findHolidayByYear(page, year);
    if (!holiday) return;

    const idsToRemove = [
        ...(holiday.national_holidays || []),
        ...(holiday.optional_holidays || []),
    ]
        .filter((h: any) => names.includes(h.name))
        .map((h: any) => h.id);

    if (idsToRemove.length > 0) {
        await removeHolidayInfos(page, year, idsToRemove);
    }
}

/**
 * Clean up all holiday_infos for a given year (removes every national + optional entry).
 * WARNING: This removes ALL holidays including seed data. Use cleanupHolidaysByName for parallel-safe cleanup.
 */
export async function cleanupHolidaysForYear(page: Page, year: number) {
    const holiday = await findHolidayByYear(page, year);
    if (!holiday) return;

    const allIds = [
        ...(holiday.national_holidays || []).map((h: any) => h.id),
        ...(holiday.optional_holidays || []).map((h: any) => h.id),
    ];

    if (allIds.length > 0) {
        await removeHolidayInfos(page, year, allIds);
    }
}

// ---------------------------------------------------------------------------
// Page navigation helpers
// ---------------------------------------------------------------------------

/** Navigate to the holidays settings page and wait for it to settle. */
export async function goToHolidays(page: Page) {
    await page.goto("/settings/holidays");
    // Wait for the page to render — look for the year selector or a tab button
    await expect(
        page.locator("select, button:has-text('Public Holidays')").first(),
    ).toBeVisible({ timeout: 15_000 });
}

/**
 * Navigate to the holidays page and wait for a specific holiday name to be visible.
 * If the data isn't visible after initial load, reloads the page once.
 * Use this after creating data via API to handle race conditions.
 */
export async function goToHolidaysAndWaitFor(page: Page, text: string, opts?: { tab?: string; year?: number }) {
    await page.goto("/settings/holidays");
    await expect(
        page.locator("select, button:has-text('Public Holidays')").first(),
    ).toBeVisible({ timeout: 15_000 });

    // Switch year if needed
    if (opts?.year) {
        await page.locator("select").selectOption(String(opts.year));
    }

    // Switch tab if needed
    if (opts?.tab) {
        await page.getByRole("button", { name: new RegExp(opts.tab, "i") }).click();
    }

    // Check if the data is visible; if not, reload once
    const locator = page.getByText(text);
    const visible = await locator.isVisible().catch(() => false);
    if (!visible) {
        // Wait a moment for any pending writes, then reload
        await page.waitForTimeout(500);
        await page.reload();
        await expect(
            page.locator("select, button:has-text('Public Holidays')").first(),
        ).toBeVisible({ timeout: 15_000 });

        // Re-apply year and tab after reload
        if (opts?.year) {
            await page.locator("select").selectOption(String(opts.year));
        }
        if (opts?.tab) {
            await page.getByRole("button", { name: new RegExp(opts.tab, "i") }).click();
        }
    }

    await expect(locator).toBeVisible({ timeout: 10_000 });
}

/** Wait for a toast notification containing `text`. */
export async function expectToast(page: Page, text: string | RegExp) {
    const toast = page.locator("[data-sonner-toast]").filter({ hasText: text });
    await expect(toast).toBeVisible({ timeout: 10_000 });
}

// ---------------------------------------------------------------------------
// Contrast helpers
// ---------------------------------------------------------------------------

function parseColor(color: string): { r: number; g: number; b: number; a: number } | null {
    const rgbaMatch = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
    if (rgbaMatch) {
        return { r: +rgbaMatch[1], g: +rgbaMatch[2], b: +rgbaMatch[3], a: +rgbaMatch[4] };
    }
    const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
        return { r: +rgbMatch[1], g: +rgbMatch[2], b: +rgbMatch[3], a: 1 };
    }
    const hexMatch = color.match(/^#([0-9a-f]{3,8})$/i);
    if (hexMatch) {
        let hex = hexMatch[1];
        if (hex.length === 3) hex = hex.split("").map(c => c + c).join("");
        return {
            r: parseInt(hex.slice(0, 2), 16),
            g: parseInt(hex.slice(2, 4), 16),
            b: parseInt(hex.slice(4, 6), 16),
            a: 1,
        };
    }
    return null;
}

function alphaBlend(
    fg: { r: number; g: number; b: number; a: number },
    bg: { r: number; g: number; b: number; a: number },
): { r: number; g: number; b: number } {
    let bgR = bg.r, bgG = bg.g, bgB = bg.b;
    if (bg.a < 1) {
        bgR = Math.round(bg.r * bg.a + 255 * (1 - bg.a));
        bgG = Math.round(bg.g * bg.a + 255 * (1 - bg.a));
        bgB = Math.round(bg.b * bg.a + 255 * (1 - bg.a));
    }
    const a = fg.a;
    return {
        r: Math.round(fg.r * a + bgR * (1 - a)),
        g: Math.round(fg.g * a + bgG * (1 - a)),
        b: Math.round(fg.b * a + bgB * (1 - a)),
    };
}

function relativeLuminance({ r, g, b }: { r: number; g: number; b: number }) {
    const [rs, gs, bs] = [r, g, b].map(c => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function contrastRatio(fgStr: string, bgStr: string): number {
    const fgC = parseColor(fgStr);
    const bgC = parseColor(bgStr);
    if (!fgC || !bgC) return 1;

    const resolvedBg = alphaBlend(bgC, { r: 255, g: 255, b: 255, a: 1 });
    const resolvedFg = alphaBlend(fgC, { ...resolvedBg, a: 1 });

    const l1 = relativeLuminance(resolvedFg);
    const l2 = relativeLuminance(resolvedBg);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
}

export const WCAG_AA_NORMAL = 4.5;
export const WCAG_AA_LARGE = 3;
