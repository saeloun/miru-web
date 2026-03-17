import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const [configPath, outputPath] = process.argv.slice(2);

if (!configPath || !outputPath) {
  console.error("usage: node script/launch_matrix/verify.mjs <config.json> <output.json>");
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const baseUrl = process.env.LAUNCH_MATRIX_BASE_URL || "http://127.0.0.1:3000";

const visibleSelectorScript = `
  (() => {
    const visible = el => {
      const style = getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return style.display !== "none" &&
        style.visibility !== "hidden" &&
        parseFloat(style.opacity || "1") > 0 &&
        rect.width > 0 &&
        rect.height > 0;
    };

    return {
      path: location.pathname,
      fullPath: location.pathname + location.search,
      dark: document.documentElement.classList.contains("dark"),
      body: document.body.innerText.slice(0, 1200),
      fullText: document.body.innerText,
      headings: [...document.querySelectorAll("h1,h2,h3")]
        .map(el => el.textContent.trim())
        .filter(Boolean)
        .slice(0, 12),
      buttons: [...document.querySelectorAll("button,a,[role='button']")]
        .filter(visible)
        .map(el => (el.innerText || el.getAttribute("aria-label") || "").trim())
        .filter(Boolean)
        .slice(0, 30),
      inputs: [...document.querySelectorAll("input,textarea,select")]
        .filter(visible)
        .map(el => ({
          tag: el.tagName,
          type: el.getAttribute("type") || "",
          name: el.getAttribute("name") || "",
          placeholder: el.getAttribute("placeholder") || "",
          label:
            el.getAttribute("aria-label") ||
            (el.id && document.querySelector('label[for="' + el.id + '"]')?.textContent?.trim()) ||
            "",
          background: getComputedStyle(el).backgroundColor,
          color: getComputedStyle(el).color,
          border: getComputedStyle(el).borderColor
        }))
        .slice(0, 40),
      controls: [...document.querySelectorAll("button,a,[role='button'],input,textarea,select,[role='combobox']")]
        .filter(visible)
        .map(el => ({
          tag: el.tagName,
          role: el.getAttribute("role") || "",
          text: (
            el.getAttribute("aria-label") ||
            (el.id && document.querySelector('label[for="' + el.id + '"]')?.textContent?.trim()) ||
            el.getAttribute("placeholder") ||
            el.textContent ||
            ""
          ).trim(),
          background: getComputedStyle(el).backgroundColor,
          color: getComputedStyle(el).color,
          border: getComputedStyle(el).borderColor
        }))
        .filter(control => control.text)
        .slice(0, 200)
    };
  })()
`;

const sanitizeName = value => value.replace(/[^a-z0-9_-]+/gi, "_");

async function gotoStable(page, url, waitMs = 2500) {
  try {
    await page.goto(url, { waitUntil: "domcontentloaded" });
  } catch {
  }
  await page.waitForTimeout(waitMs);
}

async function login(page, roleConfig) {
  await gotoStable(page, `${baseUrl}/login`, 1200);
  await page.getByRole("textbox", { name: "Email" }).fill(roleConfig.email);
  await page.getByRole("textbox", { name: "Password" }).fill(roleConfig.password);
  await page.getByRole("button", { name: "Sign in" }).click();
  try {
    await page.waitForURL(url => !url.toString().includes("/login"), { timeout: 10000 });
  } catch {
  }
  await page.waitForTimeout(1500);
}

async function clickVisibleControl(page, text) {
  const button = page.getByRole("button", { name: text, exact: true });
  if (await button.count()) {
    await button.first().click();
    return;
  }

  const link = page.getByRole("link", { name: text, exact: true });
  if (await link.count()) {
    await link.first().click();
    return;
  }

  const fallback = page.locator("button, a, [role='button']").filter({ hasText: text });
  if (await fallback.count()) {
    await fallback.first().click();
    return;
  }

  throw new Error(`Could not find clickable control: ${text}`);
}

function evaluateCheck(check, snapshot, consoleErrors) {
  const failures = [];
  const expectConfig = check.expect || {};
  const normalizedPath = snapshot.path;
  const searchableText = [
    snapshot.fullText || "",
    ...(snapshot.headings || []),
    ...(snapshot.buttons || [])
  ].join("\n");

  if (expectConfig.final_path && normalizedPath !== expectConfig.final_path) {
    failures.push(`expected path ${expectConfig.final_path} but got ${normalizedPath}`);
  }

  for (const text of expectConfig.contains_text || []) {
    if (!searchableText.includes(text)) {
      failures.push(`missing text: ${text}`);
    }
  }

  if (expectConfig.min_buttons && snapshot.buttons.length < expectConfig.min_buttons) {
    failures.push(`expected at least ${expectConfig.min_buttons} visible buttons, got ${snapshot.buttons.length}`);
  }

  if (expectConfig.min_inputs && snapshot.inputs.length < expectConfig.min_inputs) {
    failures.push(`expected at least ${expectConfig.min_inputs} visible inputs, got ${snapshot.inputs.length}`);
  }

  for (const controlText of expectConfig.visible_controls || []) {
    const matched = (snapshot.controls || []).some(control =>
      control.text.includes(controlText)
    ) || (snapshot.inputs || []).some(input =>
      [input.label, input.placeholder, input.name, input.type]
        .filter(Boolean)
        .some(value => value.includes(controlText))
    );

    if (!matched) {
      failures.push(`missing visible control: ${controlText}`);
    }
  }

  if (expectConfig.enforce_dark_inputs && snapshot.dark) {
    const whiteInputs = (snapshot.inputs || []).filter(input =>
      ["rgb(255, 255, 255)", "rgba(255, 255, 255, 1)"].includes(input.background)
    );

    if (whiteInputs.length > 0) {
      failures.push(
        `found ${whiteInputs.length} white inputs in dark mode: ${whiteInputs
          .map(input => input.label || input.name || input.placeholder || input.type || input.tag)
          .join(", ")}`
      );
    }
  }

  return {
    name: check.name,
    role: check.role,
    theme: check.theme,
    requested_path: check.path,
    final_path: normalizedPath,
    passed: failures.length === 0,
    failures,
    console_errors: consoleErrors,
    snapshot
  };
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const results = [];
  const screenshotRoot = path.join("tmp", "launch_matrix", "screenshots");
  fs.mkdirSync(screenshotRoot, { recursive: true });

  for (const group of config.groups) {
    for (const check of group.checks) {
      const context = await browser.newContext({
        viewport: { width: 1440, height: 1100 }
      });

      await context.addInitScript(theme => {
        localStorage.setItem("miru-theme", theme);
        document.documentElement.classList.toggle("dark", theme === "dark");
      }, check.theme);

      const page = await context.newPage();
      const consoleErrors = [];

      page.on("console", msg => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
      });

      if (check.role !== "guest") {
        await login(page, config.roles[check.role]);
      }

      await gotoStable(page, `${baseUrl}${check.path}`, check.wait_ms || 2500);

      for (const text of check.actions?.click_controls || []) {
        await clickVisibleControl(page, text);
        await page.waitForTimeout(check.actions?.wait_ms || 1200);
      }

      const snapshot = await page.evaluate(visibleSelectorScript);
      const result = evaluateCheck(check, snapshot, consoleErrors);

      if (!result.passed) {
        const screenshotName = `${sanitizeName(group.name)}-${sanitizeName(check.name)}.png`;
        const screenshotPath = path.join(screenshotRoot, screenshotName);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        result.screenshot = screenshotPath;
      }

      results.push(result);
      await context.close();
    }
  }

  await browser.close();

  const summary = {
    base_url: baseUrl,
    generated_at: new Date().toISOString(),
    total: results.length,
    passed: results.filter(result => result.passed).length,
    failed: results.filter(result => !result.passed).length,
    results
  };

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(summary, null, 2));

  const markdownPath = outputPath.replace(/\.json$/, ".md");
  const lines = [
    "# Launch Matrix Report",
    "",
    `- Base URL: ${summary.base_url}`,
    `- Generated At: ${summary.generated_at}`,
    `- Passed: ${summary.passed}/${summary.total}`,
    `- Failed: ${summary.failed}/${summary.total}`,
    ""
  ];

  for (const result of results) {
    lines.push(`## ${result.name}`);
    lines.push("");
    lines.push(`- Status: ${result.passed ? "pass" : "fail"}`);
    lines.push(`- Role: ${result.role}`);
    lines.push(`- Theme: ${result.theme}`);
    lines.push(`- Requested: ${result.requested_path}`);
    lines.push(`- Final: ${result.final_path}`);
    if (result.failures.length) {
      lines.push(`- Failures: ${result.failures.join("; ")}`);
    }
    if (result.console_errors.length) {
      lines.push(`- Console Errors: ${result.console_errors.join(" | ")}`);
    }
    lines.push("");
  }

  fs.writeFileSync(markdownPath, `${lines.join("\n")}\n`);

  if (summary.failed > 0) process.exit(1);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
