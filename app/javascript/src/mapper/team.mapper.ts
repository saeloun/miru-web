const unmapList = (input) => {
  const { team } = input.data;
  return team.map(item => ({
    id: item.id,
    firstName: item.firstName,
    lastName: item.lastName,
    name: item.name,
    email: item.email,
    role: item.role,
    status: item.status,
    profilePicture: item.profilePicture
  }));
};

export {
  unmapList
};
