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

const unmapCandidateDetails = (input) => {
  const { data } = input;
  return {
    candidateDetails: {
      id: data.candidate_details.id,
      first_name: data.candidate_details.first_name,
      last_name: data.candidate_details.last_name,
      email: data.candidate_details.email,
      consultancy_id: data.candidate_details.consultancy_id
    }
  };
};

export {
  unmapCandidateList,
  unmapCandidateDetails,
  unmapCandidateListForDropdown
};
