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

const updateTeamMemberAvatar = (id, payload) =>
  axios.put(`${path}/${id}/avatar`, payload);

//TODO: connect Invitation flow
const inviteMember = payload => axios.post("/invitations", payload);
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
};

export default teamApi;
