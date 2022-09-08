const getList = (input: any) => input.candidate_details.map((candidate: any) => ({
  id: candidate.id,
  name: candidate.name,
  description: candidate.description,
  cover_letter: candidate.cover_letter,
  status_code: candidate.status_code,
  status_code_name: candidate.status_code_name,
  assignee_id: candidate.assignee_id,
  assignee_name: candidate.assignee_name,
  reporter_id: candidate.reporter_id,
  reporter_name: candidate.reporter_name,
  created_by_id: candidate.created_by_id,
  created_by_name: candidate.created_by_name,
  updated_by_id: candidate.updated_by_id,
  updated_by_name: candidate.updated_by_name,
  preferred_contact_method_code: candidate.preferred_contact_method_code,
  preferred_contact_method_code_name: candidate.preferred_contact_method_code_name,
  initial_communication: candidate.initial_communication,
  initial_communication_name: candidate.initial_communication_name,
  source_code: candidate.source_code,
  source_code_name: candidate.source_code_name,
  tech_stack_ids: candidate.tech_stack_ids || [],
  tech_stack_names: candidate.tech_stack_names,
  mobilephone: candidate.mobilephone,
  telephone: candidate.telephone,
  country: candidate.country,
  skypeid: candidate.skypeid,
  linkedinid: candidate.linkedinid,
  company_id: candidate.company_id,
  address: candidate.address,
  discarded_at: candidate.discarded_at,
  title: candidate.title,
  first_name: candidate.first_name,
  last_name: candidate.last_name,
  email: candidate.email,
  emails: candidate.emails || [],
  consultancy_id: candidate.consultancy_id
}));

const unmapCandidateList = (input: any) => {
  const { data } = input;

  return {
    recruitmentCandidate: getList(data)
  };
};

const unmapCandidateListForDropdown = (input: any) => {
  const recruitmentCandidate = input.data.candidate_details;
  return recruitmentCandidate.map((item: any) => ({
    label: item.name,
    value: item.id
  }));
};

const unmapCandidateDetails = (input: any) => {
  const { data } = input;
  return {
    candidateDetails: {
      id: data.candidate_details.id,
      name: data.candidate_details.name,
      description: data.candidate_details.description,
      cover_letter: data.candidate_details.cover_letter,
      status_code: data.candidate_details.status_code,
      status_code_name: data.candidate_details.status_code_name,
      assignee_id: data.candidate_details.assignee_id,
      assignee_name: data.candidate_details.assignee_name,
      reporter_id: data.candidate_details.reporter_id,
      reporter_name: data.candidate_details.reporter_name,
      created_by_id: data.candidate_details.created_by_id,
      created_by_name: data.candidate_details.created_by_name,
      updated_by_id: data.candidate_details.updated_by_id,
      updated_by_name: data.candidate_details.updated_by_name,
      preferred_contact_method_code: data.candidate_details.preferred_contact_method_code,
      preferred_contact_method_code_name: data.candidate_details.preferred_contact_method_code_name,
      initial_communication: data.candidate_details.initial_communication,
      initial_communication_name: data.candidate_details.initial_communication_name,
      source_code: data.candidate_details.source_code,
      source_code_name: data.candidate_details.source_code_name,
      tech_stack_ids: data.candidate_details.tech_stack_ids || [],
      tech_stack_names: data.candidate_details.tech_stack_names,
      mobilephone: data.candidate_details.mobilephone,
      telephone: data.candidate_details.telephone,
      country: data.candidate_details.country,
      skypeid: data.candidate_details.skypeid,
      linkedinid: data.candidate_details.linkedinid,
      company_id: data.candidate_details.company_id,
      address: data.candidate_details.address,
      discarded_at: data.candidate_details.discarded_at,
      title: data.candidate_details.title,
      first_name: data.candidate_details.first_name,
      last_name: data.candidate_details.last_name,
      email: data.candidate_details.email,
      emails: data.candidate_details.emails || [],
      consultancy_id: data.candidate_details.consultancy_id
    }
  };
};

export {
  unmapCandidateList,
  unmapCandidateDetails,
  unmapCandidateListForDropdown
};
