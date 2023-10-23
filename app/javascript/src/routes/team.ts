import Details from "components/Team/Details";
import EmploymentDetails from "components/Team/Details/EmploymentDetails";
import EmploymentEdit from "components/Team/Details/EmploymentDetails/Edit";
import MobileNav from "components/Team/Details/Layout/MobileNav";
import PersonalDetails from "components/Team/Details/PersonalDetails";
import PersonalEdit from "components/Team/Details/PersonalDetails/Edit";
import List from "components/Team/List";
import { Roles } from "constants/index";

const { ADMIN, OWNER, BOOK_KEEPER } = Roles;

export const TeamRoutes = [
  {
    path: "/team",
    Component: List,
    authorisedRoles: [ADMIN, OWNER, BOOK_KEEPER],
  },
  {
    path: "/team/*",
    Component: Details,
    authorisedRoles: [ADMIN, OWNER, BOOK_KEEPER],
  },
];

export const TeamSubRoutes = [
  {
    path: "/:memberId",
    Component: PersonalDetails,
    authorisedRoles: [ADMIN, OWNER, BOOK_KEEPER],
  },
  {
    path: "/:memberId/edit",
    Component: PersonalEdit,
    authorisedRoles: [ADMIN, OWNER, BOOK_KEEPER],
  },
  {
    path: "/options",
    Component: MobileNav,
    authorisedRoles: [ADMIN, OWNER, BOOK_KEEPER],
  },
  {
    path: "/:memberId/details",
    Component: PersonalDetails,
    authorisedRoles: [ADMIN, OWNER, BOOK_KEEPER],
  },
  {
    path: "/:memberId/employment",
    Component: EmploymentDetails,
    authorisedRoles: [ADMIN, OWNER, BOOK_KEEPER],
  },
  {
    path: "/:memberId/employment/edit",
    Component: EmploymentEdit,
    authorisedRoles: [ADMIN, OWNER, BOOK_KEEPER],
  },
];
