import axios from "./api";

const path = "/timeoff_entries";

const create = async (payload, userId) =>
  axios.post(`${path}?user_id=${userId}`, payload);

const update = async (id, payload) => axios.put(`${path}/${id}`, payload);

const destroy = async id => axios.delete(`${path}/${id}`);

const timeoffEntryApi = {
  create,
  update,
  destroy,
};

export default timeoffEntryApi;
