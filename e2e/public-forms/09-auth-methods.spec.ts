import { expect, test } from "@playwright/test";
import {
    createAuthFixture,
    deleteAuthFixture,
    deleteUserByEmail,
    fillSignInForm,
    fillSignUpForm,
    goToSignIn,
    goToSignUp,
    signInAs,
    uniqueAuthEmail,
} from "./helpers";

type OAuthMockConfig = {
    authPath: string;
    label: string;
    successHeading: string;
};

async function expectAuthButtonsVisible(page) {
    await expect(
        page.getByRole("button", { name: /continue with google/i }),
    ).toBeVisible();
    await expect(
        page.getByRole("button", { name: /continue with github/i }),
    ).toBeVisible();
}

async function expectAuthThemeVisible(page, pageLoader: () => Promise<void>) {
    await pageLoader();

    const themeToggle = page.getByRole("button", {
        name: /switch to .* mode/i,
    });
    await expect(themeToggle).toBeVisible();
    await expectAuthButtonsVisible(page);

    const initialTheme = await page.evaluate(() =>
        document.documentElement.classList.contains("dark"),
    );

    await themeToggle.click();

    await expect
        .poll(() =>
            page.evaluate(() =>
                document.documentElement.classList.contains("dark"),
            ),
        )
        .toBe(!initialTheme);

    await expectAuthButtonsVisible(page);
}

async function mockOAuthFlow(page, config: OAuthMockConfig) {
    const requests: string[] = [];
    const postBodies: string[] = [];

    await page.route(`**${config.authPath}`, async route => {
        requests.push(route.request().url());
        postBodies.push(route.request().postData() || "");
        await route.fulfill({
            body: `<!doctype html>
              <html lang="en">
                <head><title>${config.label} mocked success</title></head>
                <body><h1>${config.successHeading}</h1></body>
              </html>`,
            contentType: "text/html",
            status: 200,
        });
    });

    return {
        async clickAndWait(button, pageToUse) {
            await button.click();
            await expect(
                pageToUse.getByRole("heading", { name: config.successHeading }),
            ).toBeVisible();
            await expect.poll(() => requests.length).toBe(1);
            expect(new URL(requests[0]).pathname).toBe(config.authPath);
            expect(postBodies[0]).toContain("authenticity_token=");
        },
    };
}

test.describe("Public Forms - Authentication Methods", () => {
    test("social login, email signup, legal controls, and theme switching stay visible", async ({
        page,
    }) => {
        await expectAuthThemeVisible(page, () => goToSignIn(page));

        await expect(
            page.getByRole("button", { name: /^sign in$/i }),
        ).toBeVisible();
        await expect(page.locator("#email")).toBeVisible();
        await expect(page.locator("#password")).toBeVisible();

        await expectAuthThemeVisible(page, () => goToSignUp(page));

        await expect(
            page.getByRole("button", { name: /^create account$/i }),
        ).toBeVisible();
        await expect(page.locator("#termsOfService")).toBeVisible();

        const termsButton = page
            .getByRole("button", { name: /terms of service/i })
            .first();
        const privacyButton = page
            .getByRole("button", { name: /privacy policy/i })
            .first();

        await expect(termsButton).toBeVisible();
        await expect(privacyButton).toBeVisible();

        await termsButton.click();
        await expect(
            page.getByRole("heading", { name: /terms of service/i }),
        ).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(
            page.getByRole("heading", { name: /terms of service/i }),
        ).not.toBeVisible();

        await privacyButton.click();
        await expect(
            page.getByRole("heading", { name: /privacy policy for miru inc/i }),
        ).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(
            page.getByRole("heading", { name: /privacy policy for miru inc/i }),
        ).not.toBeVisible();
    });

    test("email signup works and existing client and organization users can log in", async ({
        page,
    }) => {
        const email = uniqueAuthEmail("e2e-auth-signup");
        const password = `MiruAuth!${Date.now().toString(36)}Aa1`;

        const clientFixture = await createAuthFixture({
            confirmed: true,
            role: "client",
        });
        const organizationFixture = await createAuthFixture({
            confirmed: true,
            role: "admin",
        });

        try {
            await goToSignUp(page);
            await fillSignUpForm(page, {
                agreeToTerms: true,
                confirmPassword: password,
                email,
                firstName: "Codex",
                lastName: "Auth",
                password,
            });
            await page.getByRole("button", { name: /create account/i }).click();

            await expect(page).toHaveURL(/\/email_confirmation\?email=/);
            await expect(page.getByText(email)).toBeVisible();

            await signInAs(page, clientFixture.email, clientFixture.password);
            await expect(page).toHaveURL(/\/invoices(\?.*)?$/);

            await signInAs(page, organizationFixture.email, organizationFixture.password);
            await expect(page).toHaveURL(/\/dashboard(\?.*)?$/);
        } finally {
            await deleteUserByEmail(email);
            await deleteAuthFixture(clientFixture);
            await deleteAuthFixture(organizationFixture);
        }
    });

    test("google and github buttons submit through a mocked oauth redirect flow", async ({
        page,
    }) => {
        await goToSignIn(page);

        const googleFlow = await mockOAuthFlow(page, {
            authPath: "/users/auth/google_oauth2",
            label: "Google",
            successHeading: "Google OAuth mocked success",
        });

        await googleFlow.clickAndWait(
            page.getByRole("button", { name: /continue with google/i }),
            page,
        );

        await goToSignIn(page);

        const githubFlow = await mockOAuthFlow(page, {
            authPath: "/users/auth/github",
            label: "GitHub",
            successHeading: "GitHub OAuth mocked success",
        });

        await githubFlow.clickAndWait(
            page.getByRole("button", { name: /continue with github/i }),
            page,
        );
    });
});
