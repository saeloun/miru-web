const unmapList = (input) => {
  const { team } = input.data;
  return team.map(item => ({
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
