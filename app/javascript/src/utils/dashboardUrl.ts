import { Roles, Paths } from "constants/index";

export const dashboardUrl = role => {
  let url;

  switch (role) {
    case Roles.BOOK_KEEPER:
      url = Paths.PAYMENTS;
      break;
    case Roles.OWNER:
    case Roles.CLIENT:
      url = "/invoices";
      break;
    default:
      url = Paths.TIME_TRACKING;
      break;
  }

  return url;
};
