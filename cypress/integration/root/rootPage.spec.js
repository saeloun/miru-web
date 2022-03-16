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
    cy.get(navbarSelectors.dashboardTab).should("be.visible");
    cy.get(navbarSelectors.clientsTab).should("be.visible");
    cy.get(navbarSelectors.timeTrackingTab).should("be.visible");
    cy.get(navbarSelectors.projectsTab).should("be.visible");
    cy.get(navbarSelectors.invoiceTab).should("be.visible");
    cy.get(navbarSelectors.reportsTab).should("be.visible");
    cy.get(navbarSelectors.teamTab).should("be.visible");
  });

  it("employees should have employee menu items", function () {
    cy.loginAsEmployee();
    cy.get(navbarSelectors.timeTrackingTab).should("be.visible");
    cy.get(navbarSelectors.clientsTab).should("be.visible");
    cy.get(navbarSelectors.teamTab).should("be.visible");
    cy.get(navbarSelectors.projectsTab).should("be.visible");
    cy.get(navbarSelectors.invoiceTab).should("not.exist");
    cy.get(navbarSelectors.dashboardTab).should("not.exist");
    cy.get(navbarSelectors.reportsTab).should("not.exist");
  });
});
