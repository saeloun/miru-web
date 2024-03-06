const mapper = item => ({
  id: item.id,
  firstName: item.firstName,
  lastName: item.lastName,
  name: item.name,
  email: item.email,
  role: item.role,
  status: item.status,
  profilePicture: item.profilePicture,
  isTeamMember: item.isTeamMember,
  employmentType: item.employmentType,
  joinedAtDate: item.joinedAtDate,
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
