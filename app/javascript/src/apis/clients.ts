import axios from "./api";

const path = "/clients";

const formHeaders = {
  headers: {
    "Content-Type": "multipart/form-data",
  },
};

const get = async queryParam => axios.get(`${path}${queryParam}`);

const create = async payload => axios.post(`${path}`, payload, formHeaders);

const show = async (id, queryParam) => axios.get(`${path}/${id}${queryParam}`);

const update = async (id, payload) =>
  axios.patch(`${path}/${id}`, payload, formHeaders);

const destroy = async id => axios.delete(`${path}/${id}`);

const sendPaymentReminder = async (id, payload) =>
  axios.post(`${path}/${id}/send_payment_reminder`, payload);

const addClientContact = async (id, payload) =>
  axios.post(`${path}/${id}/add_client_contact`, payload);

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
  addClientContact,
};

export default clientApi;
