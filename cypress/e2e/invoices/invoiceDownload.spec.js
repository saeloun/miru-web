
import { invoicesPath, signInPath } from "../../constants/routes/paths";
import { invoicesSelector } from "../../constants/selectors/invoices";
import { fake } from "../../fixtures/fake";

describe("invoices index page", () => {
  beforeEach(function () {
    cy.visit(signInPath);
    cy.fixture("credentials").then(function (data) {
      this.data = data;
    });
    cy.loginAsAdmin();
    cy.visit(invoicesPath);
  });

  it("should download a sent invoice", function(){
    const invoice_number = fake.invoiceNumber
    const reference = fake.validReference
    cy.sendInvoice(invoice_number, reference)
    cy.get(invoicesSelector.invoiceDownload).first().click({force: true})
    cy.readFile(`cypress/downloads/${invoice_number}.pdf`).should('exist')
  })

  it("should have disabled button for draft invoice", function(){
    const invoice_number = fake.invoiceNumber
    const reference = fake.validReference
    cy.generateNewInvoice(invoice_number, reference);
    cy.get(invoicesSelector.invoiceDownload).first().should('be.disabled',)
  })

  it("should download invoice from view invoice page", function(){
    const invoice_number = fake.invoiceNumber
    const reference = fake.validReference
    cy.sendInvoice(invoice_number, reference)
    cy.visit(invoicesPath)
    cy.get(invoicesSelector.searchBar).clear().type(invoice_number).type('{enter}')
    cy.get(invoicesSelector.viewInvoice).first().click({force:true})
    cy.get(invoicesSelector.moreOptionsView).click()
    cy.get(invoicesSelector.invoiceDownloadPage).click({force: true})
    cy.readFile(`cypress/downloads/${invoice_number}.pdf`).should('exist')
  })

  it("should not have download button for draft invoice on view invoice", function(){
    const invoice_number = fake.invoiceNumber
    const reference = fake.validReference
    cy.generateNewInvoice(invoice_number, reference);
    cy.get(invoicesSelector.searchBar).clear().type(invoice_number).type('{enter}')
    cy.get(invoicesSelector.viewInvoice).first().click({force:true})
    cy.get(invoicesSelector.moreOptionsView).click()
    cy.get(invoicesSelector.invoiceDownloadPage).should('not.exist')
  })

});
