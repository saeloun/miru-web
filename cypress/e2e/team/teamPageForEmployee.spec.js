import { teamPath, signInPath } from "../../constants/routes/paths";
import { teamTabSelector } from "../../constants/selectors/team";
import { addNewUser } from "../../support/utils/team";

describe("Team page for Employee", () => {
  beforeEach(function () {
    cy.visit(signInPath);
    cy.fixture("credentials").then(function (data) {
      this.data = data;
    });
    cy.loginAsEmployee();
    cy.visit(teamPath);
  });

  it("should be not be able to add new user", function () {
    cy.get(teamTabSelector.addNewUserButton).should("not.exist");
  });
  it("should display all column names", function () {
    cy.get(teamTabSelector.teamTableHeader).contains("PHOTO");
    cy.get(teamTabSelector.teamTableHeader).contains("NAME");
    cy.get(teamTabSelector.teamTableHeader).contains("EMAIL ID");
    cy.get(teamTabSelector.teamTableHeader).contains("ROLE");
  });
  it("should not see edit button", function () {
    cy.get(teamTabSelector.editTeamMemberButton).should("not.exist");
  });
  it("should not see delete button", function () {
    cy.get(teamTabSelector.deleteTeamMemberButton).should("not.exist");
  });
});
