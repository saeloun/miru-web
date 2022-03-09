import { signUpPath } from "../constants/routes/paths";
import { signInPath } from "../constants/routes/paths";
import { authSelectors } from "../constants/selectors/auth";

describe("Sign_up", () => {
    beforeEach(function () {
        cy.visit(signUpPath);
    });

    it("should give error on clicking signup with blank values", function () {
        cy.get(authSelectors.signUpButton).click();

        //should contain error message for empty fields.
        cy.contains(" First and last name can't be blank ");
        cy.contains(" Email can't be blank ");
        cy.contains(" Password can't be blank ");
    });

    it("should contain signUp with Google Link", function () {
        cy.get(authSelectors.signUpwithGoogleButton).should("be.visible");
    });

    it("should contain signUp with Apple Link", function () {
        cy.get(authSelectors.signUpwithAppleButton).should("be.visible");
    });

    it("should contain signIn Link", function () {
        cy.get(authSelectors.signInLink).should("be.visible");
        cy.get(authSelectors.signInLink).click();
        cy.url().should("include", signInPath);
    });
});
