import { Roles, Paths } from "constants/index";

export const dashboardUrl = role => {
  switch (role) {
    case Roles.ADMIN:
    case Roles.OWNER:
      return Paths.DASHBOARD;
    case Roles.BOOK_KEEPER:
      return Paths.PAYMENTS;
    case Roles.CLIENT:
      return "/invoices";
    case Roles.EMPLOYEE:
      return Paths.TIME_TRACKING;
    default:
      return Paths.DASHBOARD;
  }
};
