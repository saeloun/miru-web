const getList = (input) => input.lead_details.map((lead) => ({
  id: lead.id,
  name: lead.name,
  budget_amount: lead.budget_amount,
  budget_status_code: lead.budget_status_code,
  industry_code: lead.industry_code,
  quality_code: lead.quality_code,
  state_code: lead.state_code,
  status_code: lead.status_code
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

const unmapLeadListForDropdown = (input) => {
  const leadList = input.data.lead_details;
  return leadList.map(item => ({
    label: item.name,
    value: item.id
  }));
};

const unmapLeadDetails = (input) => {
  const { data } = input;
  return {
    leadDetails: {
      id: data.lead_details.id,
      name: data.lead_details.name,
      budget_amount: data.lead_details.budget_amount,
      budget_status_code: data.lead_details.budget_status_code,
      industry_code: data.lead_details.industry_code,
      quality_code: data.lead_details.quality_code,
      state_code: data.lead_details.state_code,
      status_code: data.lead_details.status_code
    }
  };
};

export {
  unmapLeadList,
  unmapLeadDetails,
  unmapLeadListForDropdown
};
