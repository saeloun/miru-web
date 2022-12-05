import {
  organisationSettingsPath,
  signInPath,
} from "../../constants/routes/paths";
import { orgSettingsSelectors } from "../../constants/selectors/orgSettings";

describe("organisation settings", () => {
  beforeEach(function () {
    cy.visit(signInPath);
    cy.fixture("credentials").then(function (data) {
      this.data = data;
    });
    cy.loginAsAdmin();
    cy.visit(organisationSettingsPath);
  });

  it("should be able to upload a logo", function () {
    cy.get("input[type=file]").selectFile(
      "cypress/fixtures/images/saeloun.jpg",
      { force: true }
    );
    cy.get(orgSettingsSelectors.updateButton).click();
    cy.contains("Changes saved successfully");
  });

  it("should delete logo", function () {
    cy.get(orgSettingsSelectors.deleteLogo).click({ force: true });
    cy.contains("Company Logo successfully removed");
  });

  it("should throw error on empty company name", function () {
    cy.get(orgSettingsSelectors.companyName).clear();
    cy.get(orgSettingsSelectors.updateButton).click();
    cy.contains("Name cannot be blank");
  });

  it("should update company name", function () {
    cy.get(orgSettingsSelectors.companyName)
      .clear()
      .type("Saeloun India Pvt. Ltd.");
    cy.get(orgSettingsSelectors.updateButton).click();
    cy.contains("Changes saved successfully");
  });

  it("should throw error on empty business phone", function () {
    cy.get(orgSettingsSelectors.businessPhone).clear();
    cy.get(orgSettingsSelectors.updateButton).click();
    cy.contains("Phone number cannot be blank");
  });

  it("should update contact details", function () {
    cy.get(orgSettingsSelectors.address)
      .clear()
      .type("403, Sky Vista, Pune, India");
    cy.get(orgSettingsSelectors.businessPhone).clear().type("+91 0000000000");
    cy.get(orgSettingsSelectors.updateButton).click();
    cy.contains("Changes saved successfully");
  });

  it("should throw error on empty standard rate", function () {
    cy.get(orgSettingsSelectors.standardRate).clear();
    cy.get(orgSettingsSelectors.updateButton).click();
    cy.contains("Amount must be a number");
  });

  it("should update location, currency and rate", function () {
    cy.get(orgSettingsSelectors.country)
      .click()
      .find("input")
      .focus()
      .type("United States")
      .type("{enter}");
    cy.get(orgSettingsSelectors.baseCurrency)
      .click()
      .find("input")
      .focus()
      .type("US Dollar ($)")
      .type("{enter}");
    cy.get(orgSettingsSelectors.standardRate).clear().type("100000");
    cy.get(orgSettingsSelectors.updateButton).click();
    cy.contains("Changes saved successfully");
  });

  it("should update date,time and year", function () {
    cy.get(orgSettingsSelectors.timezone)
      .click()
      .find("input")
      .focus()
      .type("(GMT-05:00) Indiana (East)")
      .type("{enter}");
    cy.get(orgSettingsSelectors.dateFormat)
      .click()
      .find("input")
      .focus()
      .type("MM-DD-YYYY")
      .type("{enter}");
    cy.get(orgSettingsSelectors.fiscalYear)
      .click()
      .find("input")
      .focus()
      .type("January-December")
      .type("{enter}");
    cy.get(orgSettingsSelectors.updateButton).click();
    cy.contains("Changes saved successfully");
  });
});
