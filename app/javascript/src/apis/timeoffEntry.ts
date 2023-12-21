import axios from "./api";

const create = payload => axios.patch(`/timeoff_entries`, payload);

const update = (id, payload) => axios.patch(`/timeoff_entries/${id}`, payload);

const destroy = id => axios.delete(`/timeoff_entries/${id}`);

const clientMembersApi = {
  create,
  update,
  destroy,
};

export default clientMembersApi;
