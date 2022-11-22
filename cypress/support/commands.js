import { authSelectors } from "../constants/selectors/auth";
import { teamTabSelector } from "../constants/selectors/team";
import { invoicesSelector } from "../constants/selectors/invoices";


Cypress.Commands.add("loginAsOwner", function () {
  cy.get(authSelectors.emailField).clear().type(this.data.email);
  cy.get(authSelectors.passwordField).clear().type(this.data.password);
  cy.get(authSelectors.signInButton).click();
  cy.location("pathname").should("eq", "/time-tracking");
});

Cypress.Commands.add("loginAsAdmin", function () {
  cy.fixture("credentials").then(function (data) {
    this.data = data;
  });
  cy.get(authSelectors.emailField).clear().type(this.data.adminEmail);
  cy.get(authSelectors.passwordField).clear().type(this.data.adminPassword);
  cy.get(authSelectors.signInButton).click();
  cy.location("pathname").should("eq", "/time-tracking");
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

Cypress.Commands.add("generateNewInvoice", function(invoice_number, reference){
  cy.get(invoicesSelector.newInvoiceButton).click()
  cy.get(invoicesSelector.addClientButton).click()
  cy.contains("Flipkart").click()
  cy.get(invoicesSelector.invoiceNumberField).click().type(invoice_number)
  cy.get(invoicesSelector.referenceInput).click().type(reference)
  cy.get(invoicesSelector.newLineItemButton).click()
  cy.get(invoicesSelector.entriesList).first().click({force: true})
  cy.get(invoicesSelector.saveInvoice).click()
})
