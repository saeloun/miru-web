const mapper = (item) => ({
  id: item.id,
  firstName: item.firstName,
  lastName: item.lastName,
  name: item.name,
  email: item.email,
  role: item.role,
  status: item.status,
  profilePicture: item.profilePicture,
});

const unmapList = (input) => {
  let { team, invitation } = input.data;
  team = team.map((item) => ({
    ...mapper(item),
    isTeamMember: true,
  }));

  invitation = invitation.map((item) => ({
    ...mapper(item),
    isTeamMember: false,
  }));

  return [...team, ...invitation];
};

export { unmapList };
