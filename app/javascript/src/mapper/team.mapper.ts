const mapper = (item) => ({
  id: item.id,
  firstName: item.firstName,
  lastName: item.lastName,
  name: item.name,
  email: item.email,
  role: item.role,
  status: item.status,
  profilePicture: item.profilePicture,
  teamLead: item.teamLead,
  department: item.department ? { id: item.department.id, name: item.department.name } : null,
});

const unmapList = (input) => {

  let { team, invitation } = input.data;
  team = team.map(item => ({
    ...mapper(item),
    isTeamMember: true
  }));

  invitation = invitation.map(item => ({
    ...mapper(item),
    isTeamMember: false
  }));

  return [...team, ...invitation];
};

export {
  unmapList
};
