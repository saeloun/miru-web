/* global process, URL, console */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import runAuthenticationE2E from "./authentication_flow.mjs";

const {
  MIRU_E2E_BASE_URL: baseURL,
  MIRU_E2E_EMAIL: email,
  MIRU_E2E_PASSWORD: password,
} = process.env;
assert.equal(
  new URL(baseURL).hostname,
  "localhost",
  "Run this CI fixture against localhost only"
);
assert.ok(email && password, "An isolated test account is required");
const prefix = path.resolve("tmp/capybara/authentication-e2e");
fs.mkdirSync(path.dirname(prefix), { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.FERRUM_BROWSER_PATH || undefined,
  headless: true,
});
try {
  const page = await browser.newPage({
    viewport: { width: 1280, height: 800 },
  });
  page.setDefaultTimeout(15000);
  console.log(
    JSON.stringify(
      await runAuthenticationE2E(page, { baseURL, email, password, prefix })
    )
  );
} catch (error) {
  console.error(String(error.message).split(password).join("[REDACTED]"));
  process.exitCode = 1;
} finally {
  await browser.close();
}
