// import { teamPath, signInPath, mailPath } from "../../constants/routes/paths";
// import { teamTabSelector } from "../../constants/selectors/team";
// import { addNewUser, deleteTestUser } from "../../support/utils/team";

// describe("Team page for Admin", () => {
//   beforeEach(function () {
//     cy.visit(signInPath);
//     cy.fixture("credentials").then(function (data) {
//       this.data = data;
//     });
//     cy.loginAsAdmin();
//     cy.visit(teamPath);
//   });

//   it("should be able to add new Admin user", function () {
//     addNewUser("admin");
//     cy.reload();
//   });
//   it("should be able to add new Emp user", function () {
//     addNewUser();
//   });
//   it("should display all column names", function () {
//     cy.get(teamTabSelector.teamTableHeader).contains("PHOTO");
//     cy.get(teamTabSelector.teamTableHeader).contains("NAME");
//     cy.get(teamTabSelector.teamTableHeader).contains("EMAIL ID");
//     cy.get(teamTabSelector.teamTableHeader).contains("ROLE");
//   });
//   it("should be able to update user details", function () {
//     cy.get(teamTabSelector.teamTableRow)
//       .find(teamTabSelector.editTeamMemberButton)
//       .first()
//       .click(); //TODO: fix cannot click as button invisible
//   });
// });
