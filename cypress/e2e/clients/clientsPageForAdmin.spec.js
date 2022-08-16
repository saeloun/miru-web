import { clientsPath, signInPath } from "../../constants/routes/paths";
import { clientsSelectors } from "../../constants/selectors/clients";
import { fake } from "../../fixtures/fake";

describe("Clients page for admin", () => {
  beforeEach(function () {
    cy.visit(signInPath);
    cy.fixture("credentials").then(function (data) {
      this.data = data;
    });
    cy.loginAsAdmin();
    cy.visit(clientsPath);
  });

  it("should display all clients names and header", function () {
    cy.get(clientsSelectors.clientsListTable).should("be.visible")
    cy.get(clientsSelectors.clientsListTable).contains("HOURS LOGGED");
    cy.get(clientsSelectors.clientsListTable).contains("EMAIL ID");
    cy.get(clientsSelectors.clientsListTable).contains("CLIENT");
  });

  it("should be able to add new client", function () {
    const clientName = fake.clientName
    const email = fake.email
    const address = fake.address
    cy.get(clientsSelectors.newClientButton).should("be.visible").click();
    cy.get(clientsSelectors.addClientHeading).should("be.visible");
    cy.get(clientsSelectors.nameInput).type(clientName)
    cy.get(clientsSelectors.emailInput).type(email)
    cy.get(clientsSelectors.addressInput).type(address)
    cy.get(clientsSelectors.submitButton).click()
  });

  it("should be able to see clients chart data", function () {
    cy.get(clientsSelectors.clientsAdminData).should("be.visible");
  });

  it("should  be able to delete a client", function () {
    cy.get(clientsSelectors.deleteIcon).should("be.visible");
  });
});
