
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

  it("should have header and add new invoice button", function () {
    cy.get(invoicesSelector.invoicesHeading).should("be.visible");
    cy.get(invoicesSelector.newInvoiceButton).should('be.visible')
  });

  it("should display all the invoices list", function () {
    cy.get(invoicesSelector.invoicesList).should('be.visible');
  })

  it("should generate an invoice and save it as a draft", function (){
    const invoice_number = fake.invoiceNumber
    const reference = fake.validReference
    cy.generateNewInvoice(invoice_number, reference);
    cy.get(invoicesSelector.invoicesList).first().contains(invoice_number);
  })

  it("should throw error when generating an invoice without entering details", function(){
    cy.get(invoicesSelector.newInvoiceButton).click();
    cy.get(invoicesSelector.sendInvoice).click({force: true});
    cy.contains("Please select client and enter invoice number to proceed");
  })

  it("should throw an error when reference is greater than 12 characters", function(){
    const invoice_number = fake.invoiceNumber
    const reference = fake.invalidReference
    cy.get(invoicesSelector.newInvoiceButton).click()
    cy.get(invoicesSelector.addClientButton).click()
    cy.contains("Flipkart").click()
    cy.get(invoicesSelector.invoiceNumberField).click().type(invoice_number)
    cy.get(invoicesSelector.referenceInput).click().type(reference)
    cy.get(invoicesSelector.newLineItemButton).click()
    cy.get(invoicesSelector.entriesList).first().click({force: true})
    cy.get(invoicesSelector.saveInvoice).click()
    cy.contains("Reference is too long (maximum is 12 characters)")
  })

  it("should generate an invoice and send email", function (){
    const invoice_number = fake.invoiceNumber
    const reference = fake.validReference
    cy.get(invoicesSelector.newInvoiceButton).click()
    cy.get(invoicesSelector.addClientButton).click()
    cy.contains("Flipkart").click()
    cy.get(invoicesSelector.invoiceNumberField).click().type(invoice_number)
    cy.get(invoicesSelector.referenceInput).click().type(reference)
    cy.get(invoicesSelector.newLineItemButton).click()
    cy.get(invoicesSelector.entriesList).first().click({force: true})
    cy.get(invoicesSelector.sendInvoice).click({force: true})
    cy.get(invoicesSelector.sendEmail).click()
  })

  it("should edit an invoice", function(){
    const invoice_number = fake.invoiceNumber
    const reference = fake.validReference
    cy.generateNewInvoice(invoice_number, reference);
    cy.get(invoicesSelector.searchBar).clear().type(invoice_number).type('{enter}')
    cy.get(invoicesSelector.edit).click({force: true})
    cy.get(invoicesSelector.newLineItemButton).click()
    cy.get(invoicesSelector.entriesList).first().click({force: true})
    cy.get(invoicesSelector.saveInvoice).click()
  })

});
