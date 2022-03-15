import { authSelectors } from "../constants/selectors/auth";

Cypress.Commands.add("loginAsOwner", function () {
  cy.get(authSelectors.emailField).clear().type(this.data.email);
  cy.get(authSelectors.passwordField).clear().type(this.data.password);
  cy.get(authSelectors.signInButton).click();
  cy.location("pathname").should("eq", "/dashboard");
});

Cypress.Commands.add("loginAsAdmin", function () {
  cy.fixture("credentials").then(function (data) {
    this.data = data;
  });
  cy.get(authSelectors.emailField).clear().type(this.data.adminEmail);
  cy.get(authSelectors.passwordField).clear().type(this.data.adminPassword);
  cy.get(authSelectors.signInButton).click();
  cy.location("pathname").should("eq", "/dashboard");
});

Cypress.Commands.add("loginAsEmployee", function () {
  cy.fixture("credentials").then(function (data) {
    this.data = data;
  });
  cy.get(authSelectors.emailField).clear().type(this.data.employeeEmail);
  cy.get(authSelectors.passwordField).clear().type(this.data.employeePassword);
  cy.get(authSelectors.signInButton).click();
  cy.location("pathname").should("eq", "/time-tracking");
});
