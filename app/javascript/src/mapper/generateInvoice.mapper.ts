const unmapClientListDropdown = ({ data }) => data.company_client_list.map(client => ({
  address: client.address,
  value: client.id,
  label: client.name,
  phone: client.phone_number
}));

export {
  unmapClientListDropdown
};
