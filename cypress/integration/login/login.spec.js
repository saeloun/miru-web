import { signInPath } from "../../constants/routes/paths";
import { authSelectors } from "../../constants/selectors/auth";

describe("sign in test", () => {
  beforeEach(function () {
    cy.visit(signInPath);
    cy.fixture('credentials').then(function (data) {
      this.data = data
  })
  });

  it("should give error on clicking signin with blank values", function () {
    cy.get(authSelectors.signInButton).click();
    cy.contains("Invalid Email or password");
  });

  it("should give error with incorrect credentials", function () {
    cy.get(authSelectors.emailField).clear().type(this.data.email)
    cy.get(authSelectors.passwordField).clear().type(this.data.incorrectPassword)
    cy.get(authSelectors.signInButton).click();
    cy.contains("Invalid Email or password");
  });

  it("should login as owner", function () {
    cy.loginAsOwner();
  });

  it("should login as admin", function () {
    cy.loginAsAdmin();
  });

  it("should login as employee", function () {
    cy.loginAsEmployee();
  });

  it("should contain forgot password link", function(){
    cy.get(authSelectors.forgotPasswordLink).should("be.visible");
    cy.get(authSelectors.forgotPasswordLink).click();
    cy.location('pathname').should('eq', '/users/password/new')
  })


  it("should contain signup link", function(){
    cy.get(authSelectors.signUpLink).should("be.visible");
    cy.get(authSelectors.signUpLink).click();
    cy.location('pathname').should('eq', '/users/sign_up')
  })
});
