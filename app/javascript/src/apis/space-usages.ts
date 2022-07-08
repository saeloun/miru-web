import axios from "axios";

const path = "/space_usages";

const create = async (params, userId) => axios.post(`${path}?user_id=${userId}`, params);

const list = async (from, to, uid) => axios.get(`${path}?from=${from}&to=${to}&user_id=${uid}`);

const update = async (id, payload) => axios.put(`${path}/${id}`, payload);

const destroy = async (id) => axios.delete(`${path}/${id}`);

const destroyBulk = async payload =>
  axios.delete(`${path}/bulk_action/`, { data: { source: payload } });

const updateBulk = async payload => axios.patch(`${path}/bulk_action/`, payload);

const spaceUsagesApi = {
  list,
  create,
  update,
  destroy,
  destroyBulk,
  updateBulk
};

export default spaceUsagesApi;
