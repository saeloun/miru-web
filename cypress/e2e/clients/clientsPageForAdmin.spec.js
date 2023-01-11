import { clientsPath, signInPath } from "../../constants/routes/paths";
import { clientsSelectors } from "../../constants/selectors/clients";
import { fake } from "../../fixtures/fake";

describe("Clients page for admin", () => {
  const clientName = fake.clientName
  const email = fake.email
  const address = fake.address
  const editedClientName = fake.clientName
  const editedAddress = fake.address
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

  it.only("should be able to add new client", function () {

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

  it.only("should be able to edit client details", function(){
    cy.get(clientsSelectors.searchBar).clear().type(clientName)
    cy.wait(3000)
    cy.contains(clientName).first().click({force: true});
    cy.get(clientsSelectors.threeDotsMenu).click();
    cy.contains("Edit").click()
    cy.get(clientsSelectors.editClientName).clear().type(editedClientName)
    cy.get(clientsSelectors.editClientAddress).clear().type(editedAddress)
    cy.get(clientsSelectors.editClientPhone).clear().type("+91111100000")
    cy.get(clientsSelectors.editClientSubmit).click()

  })

  it.only("should  be able to delete a client", function () {
    cy.get(clientsSelectors.searchBar).clear().type(editedClientName)
    cy.wait(3000)
    cy.contains(editedClientName).first().click({force: true})
    cy.get(clientsSelectors.threeDotsMenu).click();
    cy.contains("Delete").click()
    cy.get(clientsSelectors.deleteButton).click()
  });
});
