import { teamPath, signInPath } from "../../constants/routes/paths";
import { navbarSelectors } from "../../constants/selectors/navbar";

describe("Team page for Employee", () => {
  beforeEach(function () {
    cy.visit(signInPath);
    cy.fixture("credentials").then(function (data) {
      this.data = data;
    });
    cy.loginAsEmployee();
    cy.visit(teamPath);
  });

  it("should be able to add new user", function () {});
  it("should display all column names", function () {});
  it("should be able to update user details", function () {});
});
