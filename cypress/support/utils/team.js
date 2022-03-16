import { teamTabSelector } from "../../constants/selectors/team";

export const addNewUser = role => {
  cy.get(teamTabSelector.addNewUserButton).click();
  cy.get(teamTabSelector.newMemberFirstName).type("Dummy Emp FirstName");
  cy.get(teamTabSelector.newMemberLastname).type("Dummy Emp LastName");
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
  cy.get(teamTabSelector.searchTeamMemberPlaceholder).clear().type("dummy");
  cy.get(teamTabSelector.searchIcon).click();

  cy.get(teamTabSelector.deleteTeamMemberButton).first().click();
};
