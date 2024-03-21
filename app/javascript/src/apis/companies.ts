import axios from "./api";

const path = "/companies";
const authApi = axios.create({
  baseURL: "/internal_api/v1",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-CSRF-TOKEN": document
      .querySelector('[name="csrf-token"]')
      .getAttribute("content"),
  },
});

const formHeaders = {
  headers: {
    "Content-Type": "multipart/form-data",
  },
};

const index = async () => axios.get(`${path}`);

const create = payload => authApi.post(path, payload, formHeaders);

const update = (id, payload) =>
  axios.put(`${path}/${id}`, payload, formHeaders);

const destroy = id => axios.delete(`${path}/${id}`);

const removeLogo = id => axios.delete(`${path}/${id}/purge_logo`);

const companiesApi = {
  index,
  create,
  update,
  destroy,
  removeLogo,
};

export default companiesApi;
