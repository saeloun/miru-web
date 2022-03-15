import { signInPath } from "../../constants/routes/paths";
import { navbarSelectors } from "../../constants/selectors/navbar";

describe("root page tests", () => {
  beforeEach(function () {
    cy.visit(signInPath);
    cy.fixture("credentials").then(function (data) {
      this.data = data;
    });
  });

  it("admin should have admin menus items", function () {
    cy.loginAsAdmin();
    cy.get(navbarSelectors.dashboardLink).should("be.visible");
    cy.get(navbarSelectors.clientsLink).should("be.visible");
    cy.get(navbarSelectors.timeTrackingLink).should("be.visible");
    cy.get(navbarSelectors.projectsLink).should("be.visible");
    cy.get(navbarSelectors.invoiceLink).should("be.visible");
    cy.get(navbarSelectors.reportsLink).should("be.visible");
    cy.get(navbarSelectors.teamLink).should("be.visible");
  });

  it("employees should have employee menu items", function () {
    cy.loginAsEmployee();
    cy.get(navbarSelectors.timeTrackingLink).should("be.visible");
    cy.get(navbarSelectors.clientsLink).should("be.visible");
    cy.get(navbarSelectors.teamLink).should("be.visible");
    cy.get(navbarSelectors.projectsLink).should("be.visible");
    cy.get(navbarSelectors.invoiceLink).should("not.exist");
    cy.get(navbarSelectors.dashboardLink).should("not.exist");
    cy.get(navbarSelectors.reportsLink).should("not.exist");
  });
});
