import { teamTabSelector } from "../../constants/selectors/team";

export const addNewUser = (role) => {
  cy.get(teamTabSelector.addNewUserButton).click();
  cy.get(teamTabSelector.newMemberFirstName).type("Test");
  cy.get(teamTabSelector.newMemberLastname).type("user");
  cy.get(teamTabSelector.newMemberEmail).type("test@email.com");
  if (role == "admin") {
    cy.get(teamTabSelector.adminRadioButton).check();
  } else {
    cy.get(teamTabSelector.employeeRadioButton).check();
  }
  cy.get(teamTabSelector.sendInviteButton).click({ force: true });
};

export const deleteTestUser = () => {
  //delete dummy user
  cy.get(teamTabSelector.searchTeamMemberPlaceholder).clear().type("Test");
  cy.get(teamTabSelector.searchIcon).click();

  cy.get(teamTabSelector.deleteTeamMemberButton).first().click();
};
