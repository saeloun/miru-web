const getList = (input) => input.candidate_details.map((candidate) => ({
  id: candidate.id,
  first_name: candidate.first_name,
  email: candidate.email,
  last_name: candidate.last_name,
  consultancy_id: candidate.consultancy_id
}));

const unmapCandidateList = (input) => {
  const { data } = input;
  return {
    recruitmentCandidate: getList(data)
  };
};

const unmapCandidateListForDropdown = (input) => {
  const recruitmentCandidate = input.data.candidate_details;
  return recruitmentCandidate.map(item => ({
    label: item.first_name,
    value: item.id
  }));
};

const unmapConsulantancyDetails = (input) => {
  const { data } = input;
  return {
    leadDetails: {
      id: data.candidate_details.id,
      first_name: data.candidate_details.first_name,
      email: data.candidate_details.email,
      last_name: data.candidate_details.last_name,
      consultancy_id: data.candidate_details.consultancy_id
    }
  };
};

export {
  unmapCandidateList,
  unmapConsulantancyDetails,
  unmapCandidateListForDropdown
};
