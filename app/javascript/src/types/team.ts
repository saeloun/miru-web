export type TeamStatus = "active" | "inactive" | "invited";

export interface TeamMember {
  id?: number | string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  role?: string;
  designation?: string;
  department?: string;
  status?: TeamStatus;
  profilePicture?: string;
  isTeamMember?: boolean;
  employmentType?: string;
  joinedAtDate?: string;
  joinedDate?: string;
  lastActive?: string;
  hoursLogged?: number;
  billableHours?: number;
  projects?: number;
}
