type TeamStatus = "active" | "inactive" | "invited";

interface RawTeamMember {
  status?: boolean | string | null;
  statusText?: string | null;
  isTeamMember?: boolean;
  [key: string]: unknown;
}

const normalizeStatus = (item: RawTeamMember): TeamStatus => {
  const rawStatus = item.statusText ?? item.status;
  if (rawStatus === true) return "active";

  if (rawStatus === false) return item.isTeamMember ? "inactive" : "invited";

  const normalizedStatus = String(rawStatus ?? "").toLowerCase();
  if (normalizedStatus === "pending") return "invited";

  if (normalizedStatus === "active") return "active";

  if (normalizedStatus === "inactive") return "inactive";

  if (normalizedStatus === "invited") return "invited";

  return item.isTeamMember ? "active" : "invited";
};

const mapper = (item: RawTeamMember) => ({
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
  status: normalizeStatus(item),
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
  combinedDetails = combinedDetails.map(item => ({ ...mapper(item) }));

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
