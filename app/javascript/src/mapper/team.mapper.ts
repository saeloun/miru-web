const unmapList = (input) => input.map(item => ({
  name: `${item.first_name} ${item.last_name}`,
  email: item.email,
  role: item.role
})
);

export {
  unmapList
};
