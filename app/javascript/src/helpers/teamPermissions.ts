import { Roles } from "constants/index";

type TeamPermissionMember = {
  id?: number | string;
  role?: string;
};

type TeamPermissionUser = {
  id?: number | string;
};

export const canDeleteTeamMember = (
  companyRole: string,
  member: TeamPermissionMember,
  currentUser: TeamPermissionUser
) => {
  if (companyRole !== Roles.OWNER && companyRole !== Roles.ADMIN) return false;

  if (companyRole === Roles.OWNER && member.id === currentUser.id) return false;

  if (companyRole === Roles.ADMIN && member.role === Roles.OWNER) return false;

  return true;
};
