import { signInPath } from "../../constants/routes/paths";
import { signUpPath } from "../../constants/routes/paths";
import { authSelectors } from "../../constants/selectors/auth";
import { fake } from "../../fixtures/fake";

describe("Sign Up", () => {
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

  it("should contain signIn Link", function () {
    cy.get(authSelectors.signInLink).should("be.visible");
    cy.get(authSelectors.signInLink).click();
    cy.url().should("include", signInPath);
  });

  it("should throw an error if both password don't match", function () {
    cy.get(authSelectors.firstNameInput).type("test");
    cy.get(authSelectors.lastNameInput).type("user");
    cy.get(authSelectors.emailInput).type("testuser@hotmail.com");
    cy.get(authSelectors.passwordInput).type("password");
    cy.get(authSelectors.confirmPasswordInput).type("password123");
    cy.get(authSelectors.signUpButton).click();
    cy.contains("Passwords dont' match");
  });

  it("should throw an error if email is already registered", function () {
    cy.get(authSelectors.firstNameInput).type("test");
    cy.get(authSelectors.lastNameInput).type("user");
    cy.get(authSelectors.emailInput).type("supriya@example.com");
    cy.get(authSelectors.passwordInput).type("password");
    cy.get(authSelectors.confirmPasswordInput).type("password");
    cy.get(authSelectors.signUpButton).click();
    cy.contains("Email ID already exists");
  });

  it("user should be able to signup by entering correct values", function () {
    cy.get(authSelectors.firstNameInput).type(fake.firstName);
    cy.get(authSelectors.lastNameInput).type(fake.lastName);
    cy.get(authSelectors.emailInput).type(fake.email);
    cy.get(authSelectors.passwordInput).type("password");
    cy.get(authSelectors.confirmPasswordInput).type("password");
    cy.get(authSelectors.signUpButton).click();
    cy.contains("Verification link has been sent to your email ID");
  });
});
