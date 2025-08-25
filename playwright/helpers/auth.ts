import { Page, expect } from '@playwright/test';

export async function login(page: Page, email: string, password: string) {
  await page.goto('/users/sign_in');
  await page.fill('input[name="user[email]"]', email);
  await page.fill('input[name="user[password]"]', password);
  await page.click('button[type="submit"]');
  
  // Wait for successful login
  await page.waitForURL(/^(?!.*sign_in).*/);
}

export async function logout(page: Page) {
  await page.click('[data-testid="user-dropdown"]');
  await page.click('text=Logout');
  await page.waitForURL('**/users/sign_in');
}

export async function createUserAndLogin(page: Page) {
  const email = `test_${Date.now()}@example.com`;
  const password = 'password123';
  
  await page.goto('/users/sign_up');
  await page.fill('input[name="user[first_name]"]', 'Test');
  await page.fill('input[name="user[last_name]"]', 'User');
  await page.fill('input[name="user[email]"]', email);
  await page.fill('input[name="user[password]"]', password);
  await page.fill('input[name="user[password_confirmation]"]', password);
  await page.click('button[type="submit"]');
  
  return { email, password };
}