const getList = (input) => input.lead_details.map((lead) => ({
  email: lead.email,
  id: lead.id,
  address: lead.address,
  phone: lead.phone,
  name: lead.name
}));

const unmapLeadList = (input) => {
  const { data } = input;
  return {
    leadList: getList(data)
  };
};

// const mapProjectDetails = (input) => input.map((project) => ({
//   id: project.id,
//   name: project.name,
//   minutes: project.minutes_spent,
//   team: project.team
// }));

// const unmapClientListForDropdown = (input) => {
//   const clientList = input.data.client_details;
//   return clientList.map(item => ({
//     label: item.name,
//     value: item.id
//   }));
// };

// const unmapClientDetails = (input) => {
//   const { data } = input;
//   return {
//     clientDetails: {
//       id: data.client_details.id,
//       name: data.client_details.name,
//       email: data.client_details.email,
//       phone: data.client_details.phone || "--",
//       address: data.client_details.address || "--"
//     },
//     overdueOutstandingAmount: data.overdue_outstanding_amount,
//     totalMinutes: data.total_minutes,
//     projectDetails: mapProjectDetails(data.project_details)
//   };
// };

export {
  unmapLeadList
};
