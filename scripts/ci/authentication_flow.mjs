/* global URL, fetch, crypto, PublicKeyCredential, document */
export default async function runAuthenticationE2E(page, fixture) {
  const { baseURL, email, password, prefix } = fixture;
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  const result = {};
  const login = async () => {
    if (!new URL(page.url()).pathname.match(/\/(login|user\/sign_in)$/))
      await page.goto(`${baseURL}/login`);
    await page.getByRole("textbox", { name: "Email", exact: true }).fill(email);
    await page
      .getByRole("textbox", { name: "Password", exact: true })
      .fill(password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
  };
  const waitSignedIn = async () => {
    await page.waitForURL(url =>
      /\/(dashboard|time-tracking)$/.test(url.pathname)
    );
    if (page.viewportSize().width >= 768)
      await page.getByRole("button", { name: "Logout", exact: true }).waitFor();
    const status = await page.evaluate(
      async () => (await fetch("/api/v1/users/_me")).status
    );
    if (status !== 200) throw new Error("Authenticated session unavailable");
  };
  const confirmPassword = async () => {
    await page.getByLabel("Current password", { exact: true }).fill(password);
    await page.getByRole("button", { name: "Continue", exact: true }).click();
  };
  const logout = async () => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page
      .getByRole("button", { name: "Logout", exact: true })
      .first()
      .click();
    await page.waitForURL(url => /\/(login|user\/sign_in)$/.test(url.pathname));
    await page.getByRole("textbox", { name: "Email", exact: true }).waitFor();
  };
  const codeFor = (secret, offset = 0) =>
    page.evaluate(
      async ({ secret, offset }) => {
        const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
        let bits = 0,
          value = 0;
        const bytes = [];
        for (const character of secret) {
          value = (value << 5) | alphabet.indexOf(character);
          bits += 5;
          if (bits >= 8) {
            bits -= 8;
            bytes.push((value >>> bits) & 255);
          }
        }
        const counter = new ArrayBuffer(8);
        new DataView(counter).setBigUint64(
          0,
          BigInt(Math.floor((Date.now() + offset) / 30000))
        );
        const key = await crypto.subtle.importKey(
          "raw",
          new Uint8Array(bytes),
          { name: "HMAC", hash: "SHA-1" },
          false,
          ["sign"]
        );
        const digest = new Uint8Array(
          await crypto.subtle.sign("HMAC", key, counter)
        );
        const index = digest[digest.length - 1] & 15;
        return (
          (new DataView(digest.buffer).getUint32(index) & 0x7fffffff) %
          1000000
        )
          .toString()
          .padStart(6, "0");
      },
      { secret, offset }
    );

  await login();
  await waitSignedIn();
  result.passwordLogin = true;
  await page.goto(`${baseURL}/settings/profile`);
  await page
    .getByRole("region", { name: "Sign-in security", exact: true })
    .waitFor();
  await page
    .getByText("Two-factor verification is off", { exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "Set up authenticator", exact: true })
    .click();
  await page
    .getByLabel("Current password", { exact: true })
    .fill("wrong-password");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("dialog").getByRole("alert").waitFor();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancel", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Set up authenticator", exact: true })
    .click();
  await confirmPassword();
  const authenticator = page.getByRole("region", {
    name: "Authenticator app",
    exact: true,
  });
  await authenticator
    .getByLabel("Verification code", { exact: true })
    .waitFor();
  await authenticator
    .getByRole("button", { name: "Cancel", exact: true })
    .click();
  await page
    .getByText("Two-factor verification is off", { exact: true })
    .waitFor();
  result.cancelSetupAndRetryPassword = true;
  await page
    .getByRole("button", { name: "Set up authenticator", exact: true })
    .click();
  const setupResponse = page.waitForResponse(response =>
    response.url().endsWith("/users/totp/setup")
  );
  await confirmPassword();
  const setup = await (await setupResponse).json();
  const qr = page.getByRole("img", {
    name: "Scan this QR code with your authenticator app",
  });
  await qr.waitFor();
  if (!(await qr.evaluate(image => image.complete && image.naturalWidth > 0)))
    throw new Error("QR image failed");
  await page
    .getByLabel("Verification code", { exact: true })
    .fill(await codeFor(setup.secret));
  const confirmedResponse = page.waitForResponse(response =>
    response.url().endsWith("/users/totp/confirm")
  );
  await page.getByRole("button", { name: "Enable 2FA", exact: true }).click();
  const confirmed = await (await confirmedResponse).json();
  if (confirmed.recovery_codes?.length !== 8)
    throw new Error("Recovery codes unavailable");
  const downloadEvent = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download recovery codes", exact: true })
    .click();
  if ((await downloadEvent).suggestedFilename() !== "miru-recovery-codes.txt")
    throw new Error("Unexpected recovery download");
  result.authenticatorSetupAndDownload = true;

  const cdp = await page.context().newCDPSession(page);
  await cdp.send("WebAuthn.disable");
  await cdp.send("WebAuthn.enable");
  await cdp.send("WebAuthn.addVirtualAuthenticator", {
    options: {
      protocol: "ctap2",
      transport: "internal",
      hasResidentKey: true,
      hasUserVerification: true,
      isUserVerified: true,
      automaticPresenceSimulation: true,
    },
  });
  await page.evaluate(() => {
    Object.defineProperty(PublicKeyCredential, "parseCreationOptionsFromJSON", {
      value: undefined,
    });
  });
  await page.getByRole("button", { name: "Add passkey", exact: true }).click();
  const registrationResponse = page.waitForResponse(
    response =>
      response.url().endsWith("/users/passkeys") &&
      response.request().method() === "POST"
  );
  await confirmPassword();
  if ((await registrationResponse).status() !== 201)
    throw new Error("Passkey registration failed");
  await page
    .getByRole("switch", { name: "Use passkeys for two-factor verification" })
    .click();
  const requirementResponse = page.waitForResponse(response =>
    response.url().endsWith("/users/passkeys/requirement")
  );
  await confirmPassword();
  if ((await requirementResponse).status() !== 200)
    throw new Error("Passkey could not coexist with TOTP");
  result.passkeySetup = true;
  await page
    .getByRole("button", { name: "Rename My passkey", exact: true })
    .click();
  await page.getByLabel("Passkey name", { exact: true }).fill("Work Mac");
  await page.getByRole("button", { name: "Save name", exact: true }).click();
  await page
    .getByRole("button", { name: "Rename Work Mac", exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "I've saved these codes", exact: true })
    .click();
  await page
    .getByText("Passkey name updated", { exact: true })
    .last()
    .waitFor({ state: "hidden" });
  if (
    await authenticator.evaluate(
      element => element.scrollWidth > element.clientWidth + 1
    )
  ) {
    throw new Error("Authenticator controls overflow their panel");
  }
  await page
    .getByRole("region", { name: "Sign-in security", exact: true })
    .screenshot({
      path: `${prefix}-account-desktop.png`,
      animations: "disabled",
    });
  result.passkeyRename = true;

  await logout();
  await login();
  await page.getByRole("heading", { name: "Verify it’s you" }).waitFor();
  if (
    await page
      .getByLabel("Trust this browser for 30 days", { exact: false })
      .isChecked()
  )
    throw new Error("Trust must default off");
  await page.screenshot({
    path: `${prefix}-desktop.png`,
    animations: "disabled",
  });
  await page
    .getByLabel("Trust this browser for 30 days", { exact: false })
    .check();
  await page
    .getByRole("button", { name: "Verify with a passkey or Touch ID" })
    .click();
  await waitSignedIn();
  result.passkeyLogin = true;
  await logout();
  await login();
  await waitSignedIn();
  result.trustedBrowserLogin = true;

  await page.goto(`${baseURL}/settings/profile/edit`);
  await page
    .getByRole("button", { name: "Revoke all trusted browsers", exact: true })
    .click();
  const revokedResponse = page.waitForResponse(response =>
    response.url().endsWith("/totp/revoke_trusted_browsers")
  );
  await confirmPassword();
  if ((await revokedResponse).status() !== 200)
    throw new Error("Trust revocation failed");
  await logout();
  await login();
  await page.getByRole("heading", { name: "Verify it’s you" }).waitFor();
  await page
    .getByLabel("Authentication code", { exact: true })
    .fill(await codeFor(setup.secret, 30000));
  await page
    .getByRole("button", { name: "Verify and sign in", exact: true })
    .click();
  await waitSignedIn();
  result.revocationAndTotpLogin = true;

  await logout();
  await login();
  await page.getByRole("heading", { name: "Verify it’s you" }).waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: `${prefix}-mobile.png`,
    fullPage: true,
    animations: "disabled",
  });
  await page
    .getByRole("button", { name: "Switch to dark mode", exact: true })
    .click();
  await page.waitForFunction(() =>
    document.documentElement.classList.contains("dark")
  );
  await page
    .getByRole("button", { name: "Use a recovery code instead", exact: true })
    .click();
  await page.screenshot({
    path: `${prefix}-mobile-dark.png`,
    fullPage: true,
    animations: "disabled",
  });
  await page
    .getByLabel("Recovery code", { exact: false })
    .fill(confirmed.recovery_codes[0]);
  await page
    .getByRole("button", { name: "Verify and sign in", exact: true })
    .click();
  await waitSignedIn();
  result.recoveryCodeLogin = true;
  await logout();
  await login();
  await page.getByRole("heading", { name: "Verify it’s you" }).waitFor();
  await page
    .getByRole("button", { name: "Use a recovery code instead", exact: true })
    .click();
  await page
    .getByLabel("Recovery code", { exact: false })
    .fill(confirmed.recovery_codes[0]);
  const reusedResponse = page.waitForResponse(response =>
    response.url().endsWith("/totp/authenticate")
  );
  await page
    .getByRole("button", { name: "Verify and sign in", exact: true })
    .click();
  if ((await reusedResponse).status() !== 422)
    throw new Error("Recovery code was reusable");
  if (errors.length) throw new Error(JSON.stringify(errors));
  result.recoveryReplayRejected = true;
  await page
    .getByLabel("Recovery code", { exact: false })
    .fill(confirmed.recovery_codes[1]);
  await page
    .getByRole("button", { name: "Verify and sign in", exact: true })
    .click();
  await waitSignedIn();
  await page.goto(`${baseURL}/settings/profile`);
  await page
    .getByRole("button", { name: "Rename Work Mac", exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "Regenerate recovery codes", exact: true })
    .click();
  await confirmPassword();
  await page
    .getByRole("button", { name: "Download recovery codes", exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "I've saved these codes", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Turn off authenticator", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Cancel", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Turn off authenticator", exact: true })
    .click();
  await confirmPassword();
  await page
    .getByRole("button", { name: "Set up authenticator", exact: true })
    .waitFor();
  await page
    .getByText("Two-factor verification is on", { exact: true })
    .waitFor();
  await page
    .getByRole("switch", { name: "Use passkeys for two-factor verification" })
    .click();
  await page
    .getByRole("dialog")
    .getByText("This turns off two-factor verification.", { exact: false })
    .waitFor();
  await confirmPassword();
  await page
    .getByText("Two-factor verification is off", { exact: true })
    .waitFor();
  await page
    .getByRole("button", { name: "Remove Work Mac", exact: true })
    .click();
  await confirmPassword();
  await page.getByText("No passkeys added yet.", { exact: true }).waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("link", { name: "Edit", exact: true }).waitFor();
  await page.getByText("No passkeys added yet.", { exact: true }).waitFor();
  const darkMode = page.getByRole("button", {
    name: "Switch to dark mode",
    exact: true,
  });
  if (await darkMode.isVisible()) await darkMode.click();
  await page.waitForFunction(() =>
    document.documentElement.classList.contains("dark")
  );
  await page
    .getByText("Sign-in security updated", { exact: true })
    .last()
    .waitFor({ state: "hidden" });
  await page
    .getByRole("region", { name: "Sign-in security", exact: true })
    .screenshot({
      path: `${prefix}-account-mobile-dark.png`,
      animations: "disabled",
    });
  await page.route("**/api/v1/users/totp", route =>
    route.fulfill({ status: 503, json: { error: "Unavailable" } })
  );
  await page.reload();
  await page
    .getByText(
      "Could not load sign-in security. Try again before making changes.",
      { exact: true }
    )
    .waitFor();
  await page.unroute("**/api/v1/users/totp");
  await page.getByRole("button", { name: "Retry", exact: true }).click();
  await page
    .getByText("Two-factor verification is off", { exact: true })
    .waitFor();
  if (errors.length) throw new Error(JSON.stringify(errors));
  result.accountSecurityManagement = true;
  result.pageErrors = errors;
  return result;
}
