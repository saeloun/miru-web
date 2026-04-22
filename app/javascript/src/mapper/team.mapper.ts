type TeamStatus = "active" | "inactive" | "invited";

interface RawTeamMember {
  status?: boolean | string | null;
  statusText?: string | null;
  status_text?: string | null;
  isTeamMember?: boolean;
  id?: number | string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  phone?: string;
  profilePicture?: string;
  role?: string;
  designation?: string;
  department?: string;
  employmentType?: string;
  joinedAtDate?: string;
  hoursLogged?: number;
  billableHours?: number;
  projects?: number;
}

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
  status: TeamStatus;
  profilePicture?: string;
  isTeamMember?: boolean;
  employmentType?: string;
  joinedAtDate?: string;
  hoursLogged?: number;
  billableHours?: number;
  projects?: number;
}

// Accepts legacy boolean status and modern string status/statusText payloads.
// Unknown or missing values default to active for team members and invited for invitations.
const normalizeStatusToString = (item: RawTeamMember): TeamStatus => {
  const rawStatus = item.statusText ?? item.status_text ?? item.status;
  if (rawStatus === true) return "active";

  if (rawStatus === false) return item.isTeamMember ? "inactive" : "invited";

  const normalizedStatus = String(rawStatus ?? "").toLowerCase();
  if (normalizedStatus === "pending") return "invited";

  if (normalizedStatus === "active") return "active";

  if (normalizedStatus === "inactive") return "inactive";

  if (normalizedStatus === "invited") return "invited";

  return item.isTeamMember ? "active" : "invited";
};

export const mapTeamMember = (item: RawTeamMember): TeamMember => ({
  id: item.id,
  firstName: item.firstName,
  lastName: item.lastName,
  name: item.name,
  email: item.email,
  phone: item.phone,
  avatar: item.profilePicture,
  role: item.role,
  designation: item.designation,
  department: item.department,
  status: normalizeStatusToString(item),
  profilePicture: item.profilePicture,
  isTeamMember: item.isTeamMember,
  employmentType: item.employmentType,
  joinedAtDate: item.joinedAtDate,
  hoursLogged: item.hoursLogged,
  billableHours: item.billableHours,
  projects: item.projects,
});

const unmapList = input => {
  let { combinedDetails } = input.data;
  combinedDetails = combinedDetails.map(item => ({ ...mapTeamMember(item) }));

  return combinedDetails;
};

const unmapPagyData = input => {
  const { paginationDetails } = input.data;

  return {
    items: paginationDetails.items,
    next: paginationDetails.next,
    page: paginationDetails.page,
    pages: paginationDetails.pages,
    last: paginationDetails.last,
    prev: paginationDetails.prev,
  };
};

export { unmapList, unmapPagyData };
