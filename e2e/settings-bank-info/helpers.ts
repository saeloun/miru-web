/**
 * Settings / Bank Info — E2E test helpers.
 * Provides API helpers, page navigation, toast assertions, and contrast utilities.
 */
import { Page, expect } from "@playwright/test";

export async function fetchCompanyDetails(page: Page) {
  const res = await page.request.get("/api/v1/companies");
  expect(res.ok(), `Failed to fetch company: ${res.status()}`).toBeTruthy();
  const body = await res.json();
  return body.company_details;
}

export async function updateCompany(
  page: Page,
  companyId: number | string,
  fields: Record<string, string>
) {
  const res = await page.request.put(`/api/v1/companies/${companyId}`, {
    multipart: {
      ...Object.fromEntries(
        Object.entries(fields).map(([key, value]) => [`company[${key}]`, value])
      ),
    },
  });

  expect(res.ok(), `Failed to update company: ${res.status()}`).toBeTruthy();
  const body = await res.json();
  return body.company;
}

export async function goToBankInfo(page: Page) {
  await page.goto("/settings/bank-info");
  await expect(page).toHaveURL(/\/settings\/organization\/edit#bank-info$/);
  await expect(page.locator("input[aria-label='Bank Name']")).toBeVisible({ timeout: 15_000 });
}

export async function expectToast(page: Page, text: string | RegExp) {
  const toast = page.locator("[data-sonner-toast]").filter({ hasText: text });
  await expect(toast).toBeVisible({ timeout: 10_000 });
}

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
  bg: { r: number; g: number; b: number; a: number }
): { r: number; g: number; b: number } {
  let bgR = bg.r;
  let bgG = bg.g;
  let bgB = bg.b;

  if (bg.a < 1) {
    bgR = Math.round(bg.r * bg.a + 255 * (1 - bg.a));
    bgG = Math.round(bg.g * bg.a + 255 * (1 - bg.a));
    bgB = Math.round(bg.b * bg.a + 255 * (1 - bg.a));
  }

  const alpha = fg.a;
  return {
    r: Math.round(fg.r * alpha + bgR * (1 - alpha)),
    g: Math.round(fg.g * alpha + bgG * (1 - alpha)),
    b: Math.round(fg.b * alpha + bgB * (1 - alpha)),
  };
}

function relativeLuminance({ r, g, b }: { r: number; g: number; b: number }) {
  const [rs, gs, bs] = [r, g, b].map(channel => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function contrastRatio(fgStr: string, bgStr: string): number {
  const fg = parseColor(fgStr);
  const bg = parseColor(bgStr);
  if (!fg || !bg) return 1;

  const resolvedBg = alphaBlend(bg, { r: 255, g: 255, b: 255, a: 1 });
  const resolvedFg = alphaBlend(fg, { ...resolvedBg, a: 1 });

  const l1 = relativeLuminance(resolvedFg);
  const l2 = relativeLuminance(resolvedBg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

export const WCAG_AA_NORMAL = 4.5;
export const WCAG_AA_LARGE = 3;

export async function getColors(locator: any) {
  return locator.evaluate((element: HTMLElement) => {
    const style = getComputedStyle(element);
    const fg = style.color;

    let bg = style.backgroundColor;
    let current = element.parentElement;
    while (current && (bg === "rgba(0, 0, 0, 0)" || bg === "transparent")) {
      bg = getComputedStyle(current).backgroundColor;
      current = current.parentElement;
    }

    if (bg === "rgba(0, 0, 0, 0)" || bg === "transparent") {
      bg = "rgb(255, 255, 255)";
    }

    const fontSize = parseFloat(style.fontSize);
    const fontWeight = parseInt(style.fontWeight, 10) || 400;
    const isLargeText = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);

    return { fg, bg, fontSize, fontWeight, isLargeText };
  });
}
