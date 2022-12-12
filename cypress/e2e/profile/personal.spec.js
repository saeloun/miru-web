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

  it("should be able to update first name and last name", function(){
    cy.get(profileSelectors.firstName).clear().type(fake.firstName)
    cy.get(profileSelectors.lastName).clear().type(fake.lastName)
    cy.get(profileSelectors.updateProfile).click();

    cy.contains("User updated")
    // Chnage it again to original name
    cy.get(profileSelectors.firstName).clear().type("Supriya")
    cy.get(profileSelectors.lastName).clear().type("Agarwal")
    cy.get(profileSelectors.updateProfile).click();
    cy.contains("User updated")
  })

  it("should be able to change password", function(){
    cy.get(profileSelectors.changePassword).click()
    cy.get(profileSelectors.currentPassword).type("password")
    cy.get(profileSelectors.password).type("password")
    cy.get(profileSelectors.confirmPassword).type("password")
    cy.get(profileSelectors.updateProfile).click()
    cy.contains("Password updated")
  })

});
