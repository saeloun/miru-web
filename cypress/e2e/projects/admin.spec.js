import { projects, signInPath, clientsPath} from "../../constants/routes/paths";
import { projectsSelectors } from "../../constants/selectors/projects";
import { fake } from "../../fixtures/fake";

describe("Projects specs for admin", () => {
  const projectName = fake.projectName
  const editedProjectName = fake.projectName
  const clientName = fake.clientName
  const email = fake.email
  const address = fake.address
  beforeEach(function () {
    cy.visit(signInPath);
    cy.fixture("credentials").then(function (data) {
      this.data = data;
    });
    cy.loginAsAdmin();
    cy.visit(projects);
  });

  it("should have header and add new project button", function () {
    cy.get(projectsSelectors.projectsHeading).should("be.visible");
    cy.get(projectsSelectors.addNewProjectButton).should('be.visible')
  });

  it("should display all the project list", function () {
    cy.get(projectsSelectors.projectsList).should('be.visible');
  })

  it("should be able to add a new project", function (){
    cy.visit(clientsPath);
    cy.addNewClient(clientName,email,address)
    cy.visit(projects)
    cy.get(projectsSelectors.addNewProjectButton).should('be.visible').click();
    cy.get('select').select(clientName);
    cy.get(projectsSelectors.projectName).type(projectName);
    cy.get(projectsSelectors.addProjectButton).click();
    cy.contains(projectName).should('be.visible')
  })

  it("should be able to edit a project", function(){
    cy.contains(projectName).trigger('mouseover')
    cy.get(projectsSelectors.editIcon).first().click({force: true})
    cy.get(projectsSelectors.projectName).clear().type(editedProjectName);
    cy.get(projectsSelectors.addProjectButton).click();
    cy.contains(projectName).should('not.exist')
    cy.contains(editedProjectName).should('be.visible')
  })

  it("should be able to delete a project", function(){
    cy.contains(editedProjectName).trigger('mouseover')
    cy.get(projectsSelectors.deleteIcon).first().click({force: true})
    cy.get(projectsSelectors.deleteProjectButton).click()
    cy.contains(editedProjectName).should('not.exist')
  })
});
