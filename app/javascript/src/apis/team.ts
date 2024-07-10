import axios from "./api";

const path = "/team";

const get = (query = "") => axios.get(query ? `${path}?${query}` : path);
const search = term => {
  const payload = { "q[first_name_or_last_name_or_email_cont]": term };
  const queryParams = new URLSearchParams(payload).toString();

  return axios.get(`${path}?${queryParams}`);
};

const destroyTeamMember = id => axios.delete(`${path}/${id}`);

const updateTeamMember = (id, payload) => axios.put(`${path}/${id}`, payload);

const destroyTeamMemberAvatar = id => axios.delete(`${path}/${id}/avatar`);

const updateTeamMemberAvatar = (id, payload, config) =>
  axios.put(`${path}/${id}/avatar`, payload, config);

const updateTeamMembers = payload =>
  axios.put(`${path}/update_team_members`, payload);

//TODO: connect Invitation flow
const inviteMember = payload => axios.post("/invitations", payload);
const resendInvite = id => axios.post(`/invitations/${id}/resend`);
const updateInvitedMember = (id, payload) =>
  axios.put(`/invitations/${id}`, payload);
const deleteInvitedMember = id => axios.delete(`/invitations/${id}`);

const teamApi = {
  get,
  search,
  destroyTeamMember,
  destroyTeamMemberAvatar,
  updateTeamMember,
  updateInvitedMember,
  updateTeamMemberAvatar,
  deleteInvitedMember,
  inviteMember,
  updateTeamMembers,
  resendInvite,
};

export default teamApi;
