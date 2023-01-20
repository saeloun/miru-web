import { timetracking, signInPath} from "../../constants/routes/paths";
import { timeTrackingSelectors } from "../../constants/selectors/timeTracking";
import { fake } from "../../fixtures/fake";

describe("Time tracking specs for admin", () => {

  beforeEach(function () {
    cy.visit(signInPath);
    cy.fixture("credentials").then(function (data) {
      this.data = data;
    });


    cy.loginAsAdmin();
    cy.visit(timetracking);
  });

  it("should select a date and add entry", function () {
    cy.intercept("POST",'timesheet_entry/').as('saveTimesheet')
    // Select the 15th date
     // Select the random date
     const randomDay = Math.floor(Math.random() * 28) + 1;
    cy.get(timeTrackingSelectors.monthCalender).contains(randomDay).click()
    cy.get(timeTrackingSelectors.newEntry).click();
    cy.get(timeTrackingSelectors.clientSelector).select('Flipkart')
    cy.get(timeTrackingSelectors.notes).clear().type("test entry")
    cy.get(timeTrackingSelectors.timeInput).clear().type("4:00")
    cy.get(timeTrackingSelectors.saveButton).click()
    // cy.wait('@saveTimesheet')
    cy.contains("Timesheet created")
  });

});
