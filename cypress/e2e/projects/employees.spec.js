import { projects, signInPath } from "../../constants/routes/paths";
import { projectsSelectors } from "../../constants/selectors/projects";

describe("Projects specs for employyes", () => {
  beforeEach(function () {
    cy.visit(signInPath);
    cy.fixture("credentials").then(function (data) {
      this.data = data;
    });
    cy.loginAsEmployee();
    cy.visit(projects);
  });

  it("should have header and display all projects list", function () {
    cy.get(projectsSelectors.projectsHeading).should("be.visible");
    cy.get(projectsSelectors.projectsList).should('be.visible');
  });

  it("should not have a add new project button", function () {
    cy.get(projectsSelectors.addNewProjectButton).should('not.exist')

  })

  it("should not have edit and delete icons", function(){
    cy.get(projectsSelectors.editIcon).should('not.exist')
    cy.get(projectsSelectors.deleteIcon).should('not.exist')
  })
});
