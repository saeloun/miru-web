import { profileSettings, signInPath } from "../../constants/routes/paths";
import { profileSelectors } from "../../constants/selectors/profile";
import { fake } from "../../fixtures/fake";

describe("Sign Up", () => {
  beforeEach(function () {
    cy.visit(signInPath);
    cy.fixture("credentials").then(function (data) {
      this.data = data;
    });
    cy.loginAsAdmin();
    cy.visit(profileSettings);
  });

  it("should upload a profile picture", function () {
    cy.get('input[type=file]').selectFile('cypress/fixtures/logo.png', {force: true});
    cy.get(profileSelectors.updateProfile).click();
    cy.contains("User updated")
  });

  it("should delete a profile picture", function(){
    cy.get(profileSelectors.deleteImage).click({force: true})
    cy.contains("Avatar deleted successfully")
  })

});
