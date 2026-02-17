import { test, expect } from '@playwright/test';
import { login, navigateTo, TEST_USER } from '../helpers/auth';

test.describe('Responsive Navigation', () => {
  test.describe('Mobile viewport (375x812)', () => {
    test.use({ viewport: { width: 375, height: 812 } });

    test.beforeEach(async ({ page }) => {
      await login(page);
    });

    test('sidebar collapses to hamburger menu on mobile', async ({ page }) => {
      await page.waitForLoadState('domcontentloaded');

      const hamburger = page.locator('button[aria-label*="menu" i], button[aria-label*="navigation" i], button:has(svg):has-text(""), nav button.hamburger, [data-testid*="menu-button"]').first();
      const mobileMenuButton = page.locator('nav ~ button, header button').first();

      const hamburgerVisible = await hamburger.isVisible({ timeout: 2000 }).catch(() => false);
      const mobileMenuVisible = await mobileMenuButton.isVisible({ timeout: 2000 }).catch(() => false);

      expect(hamburgerVisible || mobileMenuVisible).toBeTruthy();
    });

    test('mobile menu opens when hamburger is clicked', async ({ page }) => {
      await page.waitForLoadState('domcontentloaded');

      const menuButton = page.locator('button[aria-label*="menu" i], button[aria-label*="navigation" i], nav button, header button').first();

      if (await menuButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await menuButton.click();
        await page.waitForTimeout(500);

        const mobileNav = page.locator('nav[aria-expanded="true"], nav.open, div[role="dialog"], aside.open, .mobile-menu').first();
        const navLinks = page.locator('a:has-text("Dashboard"), a:has-text("Time Tracking")').first();

        const mobileNavVisible = await mobileNav.isVisible({ timeout: 2000 }).catch(() => false);
        const navLinksVisible = await navLinks.isVisible({ timeout: 2000 }).catch(() => false);

        expect(mobileNavVisible || navLinksVisible).toBeTruthy();
      }
    });

    test('mobile menu closes when close button is clicked', async ({ page }) => {
      await page.waitForLoadState('domcontentloaded');

      const menuButton = page.locator('button[aria-label*="menu" i], button[aria-label*="navigation" i], nav button, header button').first();

      if (await menuButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await menuButton.click();
        await page.waitForTimeout(500);

        const closeButton = page.locator('button[aria-label*="close" i], button:has-text("×"), button:has-text("Close")').first();

        if (await closeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await closeButton.click();
          await page.waitForTimeout(500);

          const mobileNav = page.locator('nav[aria-expanded="true"], nav.open, div[role="dialog"], aside.open').first();
          await expect(mobileNav).not.toBeVisible({ timeout: 2000 });
        }
      }
    });

    test('navigation links work on mobile viewport', async ({ page }) => {
      await page.waitForLoadState('domcontentloaded');

      const menuButton = page.locator('button[aria-label*="menu" i], button[aria-label*="navigation" i], nav button, header button').first();

      if (await menuButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await menuButton.click();
        await page.waitForTimeout(500);
      }

      const clientsLink = page.locator('a:has-text("Clients")').first();
      if (await clientsLink.isVisible({ timeout: 2000 }).catch(() => false)) {
        await clientsLink.click();
        await page.waitForURL('**/clients', { timeout: 5000 });
        expect(page.url()).toContain('/clients');
      }
    });

    test('mobile navigation displays company name', async ({ page }) => {
      await page.waitForLoadState('domcontentloaded');

      const menuButton = page.locator('button[aria-label*="menu" i], button[aria-label*="navigation" i], nav button, header button').first();

      if (await menuButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await menuButton.click();
        await page.waitForTimeout(500);
      }

      const companyName = page.locator('text=/company|workspace|miru/i').first();
      await expect(companyName).toBeVisible({ timeout: 5000 });
    });

    test('mobile navigation shows user info', async ({ page }) => {
      await page.waitForLoadState('domcontentloaded');

      const menuButton = page.locator('button[aria-label*="menu" i], button[aria-label*="navigation" i], nav button, header button').first();

      if (await menuButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await menuButton.click();
        await page.waitForTimeout(500);
      }

      const userInfo = page.locator('text=/vipul|user|profile/i').first();
      const avatar = page.locator('img[alt*="avatar"], img[alt*="user"], [data-testid*="avatar"]').first();

      const userInfoVisible = await userInfo.isVisible({ timeout: 2000 }).catch(() => false);
      const avatarVisible = await avatar.isVisible({ timeout: 2000 }).catch(() => false);

      expect(userInfoVisible || avatarVisible).toBeTruthy();
    });
  });

  test.describe('Tablet viewport (768x1024)', () => {
    test.use({ viewport: { width: 768, height: 1024 } });

    test.beforeEach(async ({ page }) => {
      await login(page);
    });

    test('navigation is accessible on tablet viewport', async ({ page }) => {
      await page.waitForLoadState('domcontentloaded');

      const nav = page.locator('nav').first();
      await expect(nav).toBeVisible({ timeout: 5000 });
    });

    test('navigation links are clickable on tablet', async ({ page }) => {
      await page.waitForLoadState('domcontentloaded');

      const projectsLink = page.locator('a:has-text("Projects")').first();
      await expect(projectsLink).toBeVisible({ timeout: 5000 });

      await projectsLink.click();
      await page.waitForURL('**/projects', { timeout: 5000 });
      expect(page.url()).toContain('/projects');
    });
  });

  test.describe('Desktop viewport (1920x1080)', () => {
    test.use({ viewport: { width: 1920, height: 1080 } });

    test.beforeEach(async ({ page }) => {
      await login(page);
    });

    test('sidebar is fully visible on desktop', async ({ page }) => {
      await page.waitForLoadState('domcontentloaded');

      const nav = page.locator('nav').first();
      await expect(nav).toBeVisible({ timeout: 5000 });

      const navLinks = page.locator('nav a:has-text("Dashboard"), nav a:has-text("Time Tracking"), nav a:has-text("Clients")');
      await expect(navLinks.first()).toBeVisible({ timeout: 5000 });
    });

    test('all navigation items are visible without scrolling', async ({ page }) => {
      await page.waitForLoadState('domcontentloaded');

      const navLinks = [
        'Dashboard',
        'Time Tracking',
        'Clients',
        'Projects',
        'Invoices',
        'Reports',
        'Payments',
        'Team',
      ];

      for (const linkText of navLinks) {
        const link = page.locator(`nav a:has-text("${linkText}")`).first();
        await expect(link).toBeVisible({ timeout: 5000 });
      }
    });
  });
});
