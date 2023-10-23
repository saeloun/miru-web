import Projects from "components/Projects";
import ProjectDetails from "components/Projects/Details";
import { Roles } from "constants/index";

const { ADMIN, OWNER, EMPLOYEE } = Roles;

export const ProjectsRoutes = [
  {
    path: "/projects",
    Component: Projects,
    authorisedRoles: [ADMIN, OWNER, EMPLOYEE],
  },
  {
    path: "/projects/:projectId",
    Component: ProjectDetails,
    authorisedRoles: [ADMIN, OWNER],
  },
];
