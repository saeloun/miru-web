const getList = (input) => input.lead_details.map((lead) => ({
  id: lead.id,
  name: lead.name,
  description: lead.description,
  budget_amount: lead.budget_amount,
  budget_status_code: lead.budget_status_code,
  industry_code: lead.industry_code,
  quality_code: lead.quality_code,
  state_code: lead.state_code,
  status_code: lead.status_code,
  budget_status_code_name: lead.budget_status_code_name,
  industry_code_name: lead.industry_code_name,
  quality_code_name: lead.quality_code_name,
  state_code_name: lead.state_code_name,
  status_code_name: lead.status_code_name,
  donotemail: lead.donotemail,
  donotbulkemail: lead.donotbulkemail,
  donotfax: lead.donotfax,
  donotphone: lead.donotphone
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
      description: data.lead_details.description,
      budget_amount: data.lead_details.budget_amount,
      budget_status_code: data.lead_details.budget_status_code,
      industry_code: data.lead_details.industry_code,
      quality_code: data.lead_details.quality_code,
      state_code: data.lead_details.state_code,
      status_code: data.lead_details.status_code,
      budget_status_code_name: data.lead_details.budget_status_code_name,
      industry_code_name: data.lead_details.industry_code_name,
      quality_code_name: data.lead_details.quality_code_name,
      state_code_name: data.lead_details.state_code_name,
      status_code_name: data.lead_details.status_code_name,
      donotemail: data.lead_details.donotemail,
      donotbulkemail: data.lead_details.donotbulkemail,
      donotfax: data.lead_details.donotfax,
      donotphone: data.lead_details.donotphone
    }
  };
};

export {
  unmapLeadList,
  unmapLeadDetails,
  unmapLeadListForDropdown
};
