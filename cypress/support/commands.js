import { authSelectors } from "../constants/selectors/auth";
import { teamTabSelector } from "../constants/selectors/team";

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

//add new admin user from Team tab
Cypress.Commands.add("addNewAdminUser", function () {
  cy.get(teamTabSelector.addNewUserButton).click();
  cy.get(teamTabSelector.newMemberFirstName).type("Dummy Admin FirstName");
  cy.get(teamTabSelector.newMemberLastname).type("Dummy Admin LastName");
  cy.get(teamTabSelector.newMemberEmail).type("test@email.com");
  cy.get(teamTabSelector.adminRadioButton).check();
  cy.get(teamTabSelector.sendInviteButton).click();
});

//add new employee user from Team tab
Cypress.Commands.add("addNewEmpUser", function () {
  cy.get(teamTabSelector.addNewUserButton).click();
  cy.get(teamTabSelector.newMemberFirstName).type("Dummy Emp FirstName");
  cy.get(teamTabSelector.newMemberLastname).type("Dummy Emp LastName");
  cy.get(teamTabSelector.newMemberEmail).type("test@email.com");
  cy.get(teamTabSelector.employeeRadioButton).check();
  cy.get(teamTabSelector.sendInviteButton).click();
});
