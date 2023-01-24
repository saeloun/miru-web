import { timetracking, signInPath} from "../../constants/routes/paths";
import { timeTrackingSelectors } from "../../constants/selectors/timeTracking";
import { fake } from "../../fixtures/fake";

describe("Time tracking specs for admin", () => {
  const randomDay = Math.floor(Math.random() * 28) + 1;

  beforeEach(function () {
    cy.visit(signInPath);
    cy.fixture("credentials").then(function (data) {
      this.data = data;
    });
    cy.loginAsAdmin();
    cy.visit(timetracking);
  });

  it("should select a date and add entry", function () {
     // Select the random date
    cy.get(timeTrackingSelectors.monthCalender).contains(randomDay).click()
    cy.get(timeTrackingSelectors.newEntry).click();
    cy.get(timeTrackingSelectors.clientSelector).select('Flipkart')
    cy.get(timeTrackingSelectors.notes).clear().type("test entry")
    cy.get(timeTrackingSelectors.timeInput).clear().type("4:00")
    cy.get(timeTrackingSelectors.saveButton).click()
    cy.contains("Timesheet created")
  });

  it("should be able to edit an entry", function(){
    cy.get(timeTrackingSelectors.monthCalender).contains(randomDay).click()
    cy.get(timeTrackingSelectors.editEntry).first().click()
    cy.get(timeTrackingSelectors.notes).clear().type("test edited entry")
    cy.get(timeTrackingSelectors.updateButton).click()
    cy.contains("Timesheet updated")
  })

  it("should be able to delete a timesheet entry", function(){
    cy.get(timeTrackingSelectors.monthCalender).contains(randomDay).click()
    cy.get(timeTrackingSelectors.deleteEntry).first().click()
    cy.contains("Timesheet deleted")
  })

});
