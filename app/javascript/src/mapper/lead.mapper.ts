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
  donotphone: lead.donotphone,
  assignee_id: lead.assignee_id,
  reporter_id: lead.reporter_id,
  created_by_id: lead.created_by_id,
  updated_by_id: lead.updated_by_id,
  assignee_name: lead.assignee_name,
  reporter_name: lead.reporter_name,
  created_by_name: lead.created_by_name,
  updated_by_name: lead.updated_by_name,
  need: lead.need,
  preferred_contact_method_code: lead.preferred_contact_method_code,
  initial_communication: lead.initial_communication,
  priority_code: lead.priority_code,
  first_name: lead.first_name,
  last_name: lead.last_name,
  source_code: lead.source_code,
  tech_stack_ids: lead.tech_stack_ids,
  emails: lead.emails,
  need_name: lead.need_name,
  preferred_contact_method_code_name: lead.preferred_contact_method_code_name,
  initial_communication_name: lead.initial_communication_name,
  source_code_name: lead.source_code_name,
  priority_code_name: lead.priority_code_name,
  title: lead.title
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
      donotphone: data.lead_details.donotphone,
      assignee_id: data.lead_details.assignee_id,
      reporter_id: data.lead_details.reporter_id,
      created_by_id: data.lead_details.created_by_id,
      updated_by_id: data.lead_details.updated_by_id,
      assignee_name: data.lead_details.assignee_name,
      reporter_name: data.lead_details.reporter_name,
      created_by_name: data.lead_details.created_by_name,
      updated_by_name: data.lead_details.updated_by_name,
      need: data.lead_details.need,
      preferred_contact_method_code: data.lead_details.preferred_contact_method_code,
      initial_communication: data.lead_details.initial_communication,
      priority_code: data.lead_details.priority_code,
      first_name: data.lead_details.first_name,
      last_name: data.lead_details.last_name,
      source_code: data.lead_details.source_code,
      tech_stack_ids: data.lead_details.tech_stack_ids,
      emails: data.lead_details.emails,
      need_name: data.lead_details.need_name,
      preferred_contact_method_code_name: data.lead_details.preferred_contact_method_code_name,
      initial_communication_name: data.lead_details.initial_communication_name,
      source_code_name: data.lead_details.source_code_name,
      priority_code_name: data.lead_details.priority_code_name,
      title: data.lead_details.title
    }
  };
};

export {
  unmapLeadList,
  unmapLeadDetails,
  unmapLeadListForDropdown
};
