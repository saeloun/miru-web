import { expect, test } from "@playwright/test";
import {
    createAuthFixture,
    deleteAuthFixture,
    expectToast,
    fillSignInForm,
    getCurrentTotpCode,
    goToSignIn,
    mockAuthenticatedDashboard,
    signInWithSeedUser,
} from "./helpers";

test.describe("Public Forms - Sign In", () => {
    test("seeded admin can sign in from the public login form", async ({
        page,
    }) => {
        await signInWithSeedUser(page);
        await expect(page).toHaveURL(/\/dashboard$/);
    });

    test("invalid credentials show inline and toast feedback", async ({
        page,
    }) => {
        await goToSignIn(page);
        await fillSignInForm(page, {
            email: "vipul@saeloun.com",
            password: "DefinitelyWrongPassword123!",
        });

        await page.getByRole("button", { name: /^sign in$/i }).click();

        await expect(
            page.getByText(/invalid email or password/i).first(),
        ).toBeVisible();
        await expectToast(page, /invalid email or password/i);
    });

    test("client-side validation blocks malformed email addresses", async ({
        page,
    }) => {
        await goToSignIn(page);
        await fillSignInForm(page, {
            email: "not-an-email",
            password: "Password123!",
        });

        await page.getByRole("button", { name: /^sign in$/i }).click();

        await expect(
            page.getByText(/invalid email address/i),
        ).toBeVisible();
    });

    test("unconfirmed users are sent to the email confirmation page", async ({
        page,
    }) => {
        const fixture = await createAuthFixture({ confirmed: false });

        try {
            await goToSignIn(page);
            await fillSignInForm(page, {
                email: fixture.email,
                password: fixture.password,
            });

            await page.getByRole("button", { name: /^sign in$/i }).click();

            await expect(page).toHaveURL(/\/email_confirmation\?email=/);
            await expect(
                page.getByText(fixture.email),
            ).toBeVisible();
        } finally {
            await deleteAuthFixture(fixture);
        }
    });

    test("TOTP users can complete the second step and land on dashboard", async ({
        page,
    }) => {
        const fixture = await createAuthFixture({
            role: "admin",
            totpEnabled: true,
        });

        try {
            await goToSignIn(page);
            await fillSignInForm(page, {
                email: fixture.email,
                password: fixture.password,
            });

            await page.getByRole("button", { name: /^sign in$/i }).click();

            await expect(
                page.getByRole("heading", {
                    name: /two-factor authentication/i,
                }),
            ).toBeVisible();

            const code = await getCurrentTotpCode(fixture.email);
            await page.getByLabel(/authentication code/i).fill(code);
            await page
                .getByRole("button", { name: /verify and sign in/i })
                .click();

            await page.waitForURL(/\/dashboard$/, { timeout: 15_000 });
            await expect(page).toHaveURL(/\/dashboard$/);
        } finally {
            await deleteAuthFixture(fixture);
        }
    });

    test("passkey-required sign-in can complete with a mocked credential", async ({
        page,
    }) => {
        await page.addInitScript(() => {
            (window as Window & {
                __passkeyGetCalled?: boolean;
            }).__passkeyGetCalled = false;

            class FakePublicKeyCredential {}

            Object.defineProperty(window, "PublicKeyCredential", {
                configurable: true,
                value: FakePublicKeyCredential,
            });

            Object.defineProperty(window.navigator, "credentials", {
                configurable: true,
                value: {
                    get: async () => {
                        (window as Window & {
                            __passkeyGetCalled?: boolean;
                        }).__passkeyGetCalled = true;

                        return {
                            authenticatorAttachment: "platform",
                            getClientExtensionResults: () => ({}),
                            id: "cred-1",
                            rawId: new Uint8Array([1, 2, 3]).buffer,
                            response: {
                                authenticatorData: new Uint8Array([4, 5, 6]).buffer,
                                clientDataJSON: new Uint8Array([7, 8, 9]).buffer,
                                signature: new Uint8Array([10, 11, 12]).buffer,
                                userHandle: null,
                            },
                            type: "public-key",
                        };
                    },
                },
            });
        });

        await mockAuthenticatedDashboard(page, "passkey@example.com");

        await page.route("**/api/v1/users/login", route =>
            route.fulfill({
                body: JSON.stringify({
                    pending_token: "passkey-pending-token",
                    public_key: {
                        allowCredentials: [],
                        challenge: "AQ",
                    },
                    requires_passkey: true,
                }),
                contentType: "application/json",
                status: 200,
            }),
        );

        await page.route("**/api/v1/users/passkeys/authenticate", route =>
            route.fulfill({
                body: JSON.stringify({
                    company: {
                        id: 999,
                        name: "Codex Workspace",
                    },
                    company_role: "admin",
                    user: {
                        email: "passkey@example.com",
                        token: "passkey-token",
                    },
                }),
                contentType: "application/json",
                status: 200,
            }),
        );

        await goToSignIn(page);
        await fillSignInForm(page, {
            email: "passkey@example.com",
            password: "Password123!",
        });

        await page.getByRole("button", { name: /^sign in$/i }).click();

        await expect
            .poll(
                () =>
                    page.evaluate(
                        () =>
                            (
                                window as Window & {
                                    __passkeyGetCalled?: boolean;
                                }
                            ).__passkeyGetCalled === true,
                    ),
                { timeout: 10_000 },
            )
            .toBe(true);

        await page.waitForURL(/\/dashboard$/, { timeout: 15_000 });
        await expect(page).toHaveURL(/\/dashboard$/);
    });
});
