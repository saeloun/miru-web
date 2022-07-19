import axios from "axios";

const path = "/team";

const get = () => axios.get(path);

const destroyTeamMember = id => axios.delete(`${path}/${id}`);

const updateTeamMember = (id,payload) => axios.put(`${path}/${id}`,payload);

//TODO: connect Invitation flow
const inviteMember = payload => axios.post("/invitations",payload);
const updateInvitedMember = (id,payload) => axios.put(`/invitations/${id}`,payload);
const deleteInvitedMember = id => axios.delete(`/invitations/${id}`);

export {
  get,
  destroyTeamMember,
  updateTeamMember,
  updateInvitedMember,
  deleteInvitedMember,
  inviteMember
};
