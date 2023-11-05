import axios from "./api";

const get = clientId => axios.get(`/clients/${clientId}/client_members`);

const update = (id, clientId, payload) =>
  axios.patch(`/clients/${clientId}/client_members/${id}`, payload);

const clientMembersApi = {
  get,
  update,
};

export default clientMembersApi;
