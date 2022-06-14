const getList = (input) => input.consultancy_details.map((consultancy) => ({
  id: consultancy.id,
  name: consultancy.name,
  email: consultancy.email,
  address: consultancy.address,
  phone: consultancy.phone
}));

const unmapConsultancyList = (input) => {
  const { data } = input;
  return {
    recruitmentConsultancy: getList(data)
  };
};

const unmapConsultancyListForDropdown = (input) => {
  const recruitmentConsultancy = input.data.consultancy_details;
  return recruitmentConsultancy.map(item => ({
    label: item.name,
    value: item.id
  }));
};

const unmapConsulantancyDetails = (input) => {
  const { data } = input;
  return {
    leadDetails: {
      id: data.consultancy_details.id,
      name: data.consultancy_details.name,
      email: data.consultancy_details.email,
      address: data.consultancy_details.address,
      phone: data.consultancy_details.phone
    }
  };
};

export {
  unmapConsultancyList,
  unmapConsulantancyDetails,
  unmapConsultancyListForDropdown
};
