import axios from "axios";

const path = "/team";

const get = () => axios.get(path);
const search = (term) => {
  const payload = { "q[first_name_or_last_name_or_email_cont]": term };
  const queryParams = new URLSearchParams(payload).toString();
  return axios.get(`${path}?${queryParams}`);
};

const destroyTeamMember = (id) => axios.delete(`${path}/${id}`);

const updateTeamMember = (id, payload) => axios.put(`${path}/${id}`, payload);

//TODO: connect Invitation flow
const inviteMember = (payload) => axios.post("/invitations", payload);
const updateInvitedMember = (id, payload) =>
  axios.put(`/invitations/${id}`, payload);
const deleteInvitedMember = (id) => axios.delete(`/invitations/${id}`);

const teamApi = {
  get,
  search,
  destroyTeamMember,
  updateTeamMember,
  updateInvitedMember,
  deleteInvitedMember,
  inviteMember,
};

export default teamApi;
