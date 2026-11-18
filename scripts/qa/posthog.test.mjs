import assert from "node:assert/strict";
import { mkdir, readFile } from "node:fs/promises";
import { basename } from "node:path";
import { gunzipSync } from "node:zlib";
import { runInNewContext } from "node:vm";
import { chromium } from "playwright";
import ts from "typescript";

const replayCalls = [];
const pageviews = [];
let sdkConfig;
const sdk = {
  init: (_token, config) => {
    sdkConfig = config;
  },
  get_property: () => "miru:user:42",
  identify: () => {},
  group: () => {},
  capture: (name, properties) => pageviews.push({ name, properties }),
  logger: { info: () => {} },
  startSessionRecording: () => replayCalls.push("start"),
  stopSessionRecording: () => replayCalls.push("stop"),
};
const analytics = {};
runInNewContext(
  ts.transpileModule(
    await readFile("app/javascript/src/utils/posthog.ts", "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } }
  ).outputText,
  {
    exports: analytics,
    require: () => ({ default: sdk }),
    document: { querySelector: () => ({ getAttribute: () => "synthetic" }) },
    window: { location: { origin: "http://127.0.0.1:3179" } },
    URL,
  }
);
analytics.initializeProductAnalytics();
const scrubbedError = sdkConfig.before_send({
  properties: {
    $web_vitals_FCP_value: 123,
    $web_vitals_FCP_event: {
      name: "https://app.miru.so/?token=private-secret",
    },
    $exception_message: "private@example.test",
    title: "private@example.test",
    $prev_pageview_pathname: "/invoices/private-secret/view",
    $set_once: { $initial_pathname: "/invoices/private-secret/view" },
    $heatmap_data: {
      "https://app.miru.so/users/password/edit?token=private-secret#private": [
        { x: 1, y: 2 },
      ],
      "https://app.miru.so/users/password/edit?token=another-secret": [
        { x: 3, y: 4 },
      ],
    },
    $exception_list: [
      {
        type: "TypeError",
        value: "private@example.test",
        stacktrace: {
          frames: [
            {
              filename:
                "https://app.miru.so/assets/app.js?token=private-secret",
              lineno: 42,
              context_line: "private@example.test",
              vars: { token: "private-secret" },
            },
          ],
        },
      },
    ],
  },
});
assert.ok(JSON.stringify(scrubbedError).includes("TypeError"));
assert.ok(!JSON.stringify(scrubbedError).includes("private@example.test"));
assert.ok(!JSON.stringify(scrubbedError).includes("private-secret"));
assert.ok(!JSON.stringify(scrubbedError).includes("another-secret"));
assert.equal(
  scrubbedError.properties.$heatmap_data[
    "https://app.miru.so/users/password/edit"
  ].length,
  2
);
assert.equal(scrubbedError.properties.$web_vitals_FCP_value, 123);
for (const pathname of [
  "/team",
  "/team/42",
  "/team/42/employment",
  "/team/42/billing-identity",
  "/team/42/automation",
  "/team/42/employee-records",
  "/consultant-payroll",
  "/salary-slips",
  "/tax-declarations",
  "/india-tax",
  "/signed-documents",
  "/agreements",
  "/interview-feedback",
  "/interview-reviews",
  "/assignment-reviews",
]) {
  replayCalls.length = 0;
  analytics.syncProductAnalytics({ userId: 42, companyId: 99, pathname });
  assert.deepEqual(replayCalls, ["stop"], `${pathname} must stop replay`);
}
replayCalls.length = 0;
analytics.syncProductAnalytics({
  userId: 42,
  companyId: 99,
  pathname: "/projects",
});
assert.deepEqual(replayCalls, ["start"], "Product routes must allow replay");
pageviews.length = 0;
for (const pathname of ["/clients/1", "/clients/1", "/clients/2"]) {
  analytics.syncProductAnalytics({ userId: 42, companyId: 99, pathname });
}
assert.equal(
  pageviews.length,
  2,
  "Different resources must count as separate visits without duplicate rerenders"
);
assert.ok(
  pageviews.every(event =>
    event.properties.$current_url.endsWith("/clients/:id")
  )
);

const base = new URL(process.env.BASE_URL || "http://127.0.0.1:3179");
assert.ok(["127.0.0.1", "localhost"].includes(base.hostname));
const browser = await chromium.launch({
  executablePath:
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
});
const events = [];
const logs = [];
const errors = [];
const requests = [];
const browserOptions = {
  userAgent: `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${browser.version()} Safari/537.36`,
};
const context = await browser.newContext(browserOptions);
// All analytics are intercepted; simulate a visitor who has not opted out.
await context.addInitScript(() => {
  Object.defineProperty(navigator, "globalPrivacyControl", {
    get: () => false,
  });
  Object.defineProperty(navigator, "doNotTrack", { get: () => "0" });
  Object.defineProperty(navigator, "msDoNotTrack", { get: () => "0" });
  Object.defineProperty(window, "doNotTrack", { get: () => "0" });
  Object.defineProperty(navigator, "webdriver", { get: () => false });
  localStorage.setItem("__ph_opt_in_out_phc_synthetic", "1");
});
const page = await context.newPage();
page.on("pageerror", error => errors.push(error.message));
await context.route("**/*", async route => {
  const request = route.request();
  const url = new URL(request.url());
  if (url.hostname === "posthog.example.test") {
    requests.push(
      `${request.method()} ${url.pathname} ${Array.from(
        url.searchParams.keys()
      ).join(",")}`
    );
    const headers = {
      "Access-Control-Allow-Origin": base.origin,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers":
        request.headers()["access-control-request-headers"] || "Content-Type",
      "Access-Control-Allow-Credentials": "true",
    };
    if (request.method() === "OPTIONS")
      return route.fulfill({ status: 204, headers });
    if (url.pathname.endsWith(".js")) {
      return route.fulfill({
        status: 200,
        contentType: "application/javascript",
        body: await readFile(
          `node_modules/posthog-js/dist/${basename(url.pathname)}`
        ),
      });
    }
    if (request.method() === "POST" && !url.pathname.includes("/flags")) {
      const body = request.postDataBuffer();
      const text =
        body[0] === 0x1f && body[1] === 0x8b
          ? gunzipSync(body).toString()
          : url.searchParams.get("compression") === "base64"
          ? Buffer.from(body.toString(), "base64").toString()
          : body.toString();
      const payload = JSON.parse(text);
      if (payload.resourceLogs) {
        for (const resource of payload.resourceLogs)
          for (const scope of resource.scopeLogs)
            logs.push(...scope.logRecords);
      } else {
        events.push(
          ...(Array.isArray(payload) ? payload : payload.batch || [payload])
        );
      }
    }
    return route.fulfill({
      status: 200,
      headers,
      json: {
        featureFlags: {},
        featureFlagPayloads: {},
        supportedCompression: [],
        heatmaps: true,
        sessionRecording: {
          endpoint: "/s/",
          recorderVersion: "v2",
          scriptConfig: { script: "lazy-recorder" },
          masking: { maskAllInputs: true, maskTextSelector: "*" },
          consoleLogRecordingEnabled: false,
        },
        surveys: [],
      },
    });
  }
  if (url.origin !== base.origin) {
    return route.fulfill({ status: 200, body: "" });
  }
  if (url.pathname === "/api/v1/users/_me") {
    return route.fulfill({
      status: 200,
      json: {
        user: {
          id: 42,
          first_name: "Synthetic",
          last_name: "Owner",
          email: "synthetic@example.test",
          confirmed: true,
          locale: "en-US",
          current_workspace_id: 99,
        },
        company: {
          id: 99,
          name: "Synthetic workspace",
          base_currency: "USD",
          plan_tier: "pro",
          subscription_status: "active",
        },
        company_role: "owner",
      },
    });
  }
  if (url.pathname.startsWith("/api/")) {
    assert.equal(request.method(), "GET", "QA must not write app data");
    return route.fulfill({
      status: 200,
      json: { companies: [], workspaces: [], current_timer: null },
    });
  }
  return route.continue();
});

try {
  await page.goto(new URL("/signup?token=synthetic-secret#private", base).href);
  await page.getByRole("button", { name: /create account|sign up/i }).waitFor();
  await page.waitForFunction(() =>
    document.querySelector('[data-testid="app-loaded"]')
  );
  await page.waitForTimeout(1000);
  await page.mouse.click(10, 10);
  await page.waitForTimeout(11000);
  assert.ok(
    events.some(event => event.event === "$$heatmap"),
    "The enabled SDK must emit actual heatmap data"
  );
  assert.ok(
    events.some(event => event.event === "$pageview"),
    `Expected a pageview; requests: ${requests.join(
      ", "
    )}; errors: ${errors.join(", ")}; DNT: ${await page.evaluate(
      () => navigator.doNotTrack
    )}`
  );
  assert.ok(
    !JSON.stringify(events).includes("synthetic-secret"),
    JSON.stringify(
      events.flatMap(event =>
        Object.entries(event.properties || {})
          .filter(([, value]) =>
            JSON.stringify(value)?.includes("synthetic-secret")
          )
          .map(([key]) => `${event.event}.${key}`)
      )
    )
  );
  assert.ok(!JSON.stringify(events).includes("#private"));
  assert.ok(logs.some(log => log.body.stringValue === "miru.page_view"));
  assert.ok(!JSON.stringify(logs).includes("synthetic-secret"));
  assert.ok(!JSON.stringify(logs).includes("#private"));
  assert.ok(
    !requests.some(path => path.includes("/s/")),
    "Auth pages must not record replay"
  );
  assert.deepEqual(errors, []);
  await mkdir("output/playwright", { recursive: true });
  await page.screenshot({
    path: "output/playwright/posthog-signup.png",
    fullPage: true,
  });

  await page.goto(new URL("/posthog-qa", base).href);
  const fixtureAt = await page.evaluate(() => {
    const fixture = document.createElement("div");
    fixture.style.cssText =
      "position:fixed;top:20px;left:20px;z-index:2147483647";
    fixture.innerHTML =
      '<p>replay-private-text</p><input id="replay-qa-input" value="replay-private-input">';
    document.body.append(fixture);
    return Date.now();
  });
  await page.waitForTimeout(2000);
  await page.locator("#replay-qa-input").click();
  await page.waitForTimeout(12000);
  assert.ok(
    events.some(
      event =>
        event.event === "$identify" &&
        event.properties.distinct_id === "miru:user:42"
    )
  );
  assert.ok(
    events.some(
      event =>
        event.event === "$groupidentify" &&
        event.properties.$group_key === "miru:company:99"
    )
  );
  assert.ok(!JSON.stringify(events).includes("synthetic@example.test"));
  assert.deepEqual(errors, [], "Identity setup must not crash the app");

  const snapshots = () =>
    events
      .filter(event => event.event === "$snapshot")
      .flatMap(event => event.properties.$snapshot_data || [])
      .map(snapshot => {
        if (snapshot.cv !== "2024-10") return snapshot;
        const decode = value =>
          JSON.parse(gunzipSync(Buffer.from(value, "latin1")).toString());
        if (typeof snapshot.data === "string")
          return { ...snapshot, data: decode(snapshot.data) };
        return {
          ...snapshot,
          data: Object.fromEntries(
            Object.entries(snapshot.data).map(([key, value]) => [
              key,
              ["texts", "attributes", "removes", "adds"].includes(key) &&
              typeof value === "string"
                ? decode(value)
                : value,
            ])
          ),
        };
      });
  assert.ok(
    snapshots().length > 0,
    `The actual recorder must emit snapshots: ${JSON.stringify({
      requests,
      types: [...new Set(events.map(event => event.event))],
    })}`
  );
  assert.ok(!JSON.stringify(snapshots()).includes("replay-private-text"));
  assert.ok(!JSON.stringify(snapshots()).includes("replay-private-input"));
  const hasMaskedInput = value =>
    value &&
    typeof value === "object" &&
    ((value.tagName === "input" &&
      /^\*+$/.test(value.attributes?.value || "")) ||
      Object.values(value).some(hasMaskedInput));
  assert.ok(
    snapshots()
      .filter(snapshot => snapshot.timestamp >= fixtureAt)
      .some(hasMaskedInput),
    "Replay must contain the fixture input with its value masked"
  );

  await page.evaluate(() => {
    history.pushState({}, "", "/settings/posthog-qa");
    dispatchEvent(new PopStateEvent("popstate"));
  });
  await page.waitForTimeout(6000);
  assert.ok(
    events.some(
      event =>
        event.event === "$pageview" &&
        event.properties.$current_url === `${base.origin}/settings/posthog-qa`
    ),
    "The app must process the sensitive SPA transition"
  );
  const stoppedAt = await page.evaluate(() => {
    document.body.append(document.createElement("div"));
    return Date.now();
  });
  await page.waitForTimeout(12000);
  assert.equal(
    snapshots().filter(snapshot => snapshot.timestamp > stoppedAt).length,
    0,
    "Recorder must stop after a sensitive SPA transition"
  );

  await page.goto(new URL("/signup", base).href);
  await page.waitForTimeout(7000);
  const lastPageview = events
    .filter(event => event.event === "$pageview")
    .at(-1);
  assert.notEqual(
    lastPageview.properties.distinct_id,
    "miru:user:42",
    "Guest navigation must reset the previous identity"
  );

  const disabled = await browser.newContext(browserOptions);
  const disabledPage = await disabled.newPage();
  const disabledRequests = [];
  disabledPage.on("request", request => {
    if (new URL(request.url()).hostname === "posthog.example.test")
      disabledRequests.push(request.url());
  });
  await disabled.route("**/*", async route => {
    const url = new URL(route.request().url());
    if (url.origin !== base.origin)
      return route.fulfill({ status: 200, body: "" });
    if (route.request().isNavigationRequest()) {
      const response = await route.fetch();
      const html = (await response.text()).replace(
        /<meta name="posthog-[^"]+"[^>]+>/g,
        ""
      );
      return route.fulfill({ response, body: html });
    }
    return route.continue();
  });
  await disabledPage.goto(new URL("/signup", base).href);
  await disabledPage
    .getByRole("button", { name: /create account|sign up/i })
    .waitFor();
  await disabledPage.waitForTimeout(1000);
  assert.deepEqual(
    disabledRequests,
    [],
    "Missing configuration must disable PostHog entirely"
  );
  await disabled.close();

  await context.route("https://posthog.example.test/**", route =>
    route.abort()
  );
  await page.reload();
  await page.getByRole("button", { name: /create account|sign up/i }).waitFor();
  assert.deepEqual(errors, [], "PostHog outage must not crash Miru");
  console.log(
    "PASS: Brave signup, URL redaction, identity/reset, decoded replay masking, sensitive SPA replay stop, browser logs, disabled configuration, analytics outage"
  );
} finally {
  await browser.close();
}
