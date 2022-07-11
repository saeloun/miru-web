import { invoicesPath, signInPath } from "../../constants/routes/paths";
import { invoicesSelector } from "../../constants/selectors/invoices";

describe("invoices index page", () => {
  before(function () {
    cy.visit(signInPath);
    cy.fixture("credentials").then(function (data) {
      this.data = data;
    });
    cy.loginAsAdmin();
    cy.visit(invoicesPath);
  });

  it("should have header and add new invoice button", function () {
    cy.get(invoicesSelector.invoicesHeading).should("be.visible");
    cy.get(invoicesSelector.newInvoiceButton).should('be.visible')
  });

  it.only("should display all the invoices list", function () {
    cy.get(invoicesSelector.invoicesList).should('be.visible');
    cy.generateNewInvoice()
  })

});
