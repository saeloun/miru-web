import { clientsPath, signInPath } from "../../constants/routes/paths";
import { clientsSelectors } from "../../constants/selectors/clients";

describe("Clients page for employees", () => {
  beforeEach(function () {
    cy.visit(signInPath);
    cy.fixture("credentials").then(function (data) {
      this.data = data;
    });
    cy.loginAsEmployee();
    cy.visit(clientsPath);
  });
  it("should display all clients names and header", function () {
    cy.get(clientsSelectors.clientsListTable).should("be.visible")
    cy.get(clientsSelectors.clientsListTable).contains("HOURS LOGGED");
    cy.get(clientsSelectors.clientsListTable).contains("EMAIL ID");
    cy.get(clientsSelectors.clientsListTable).contains("CLIENT");
  });

  it("should not be able to add new client", function () {
    cy.get(clientsSelectors.newClientButton).should("not.exist");
  });

  it("should not be able to see clients chart data", function () {
    cy.get(clientsSelectors.clientsAdminData).should("not.exist");
  });

  it("should not be able to see edit & delete client button", function () {
    cy.get(clientsSelectors.editIcon).should("not.exist");
    cy.get(clientsSelectors.deleteIcon).should("not.exist");
  });
});
