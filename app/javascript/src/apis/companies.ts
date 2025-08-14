import api from "./api";

const path = "/companies";

const index = async () => api.get(`${path}`);

const create = payload => api.post(path, payload);

const update = (id, payload) => api.put(`${path}/${id}`, payload);

const destroy = id => api.delete(`${path}/${id}`);

const removeLogo = id => api.delete(`${path}/${id}/purge_logo`);

const companiesApi = {
  index,
  create,
  update,
  destroy,
  removeLogo,
};

export default companiesApi;
