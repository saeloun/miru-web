import axios from "./api";

const path = "/clients";

const get = async queryParam => axios.get(`${path}${queryParam}`);

const create = async payload => axios.post(`${path}`, payload);

const show = async (id, queryParam) => axios.get(`${path}/${id}${queryParam}`);

const update = async (id, payload) => axios.patch(`${path}/${id}`, payload);

const destroy = async id => axios.delete(`${path}/${id}`);

const sendPaymentReminder = async (id, payload) =>
  axios.post(`${path}/${id}`, payload);

const invoices = async (query = "") =>
  axios.get(query ? `${path}/invoices?${query}` : `${path}/invoices`);

const clientApi = {
  update,
  destroy,
  get,
  show,
  create,
  invoices,
  sendPaymentReminder,
};

export default clientApi;
