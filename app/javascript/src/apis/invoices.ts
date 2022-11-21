import axios from "axios";

const path = "/invoices";

const get = async (query = "") =>
  axios.get(query ? `${path}?${query}` : `${path}`);

const post = async (body) => axios.post(`${path}`, body);

const patch = async (id, body) => axios.post(`${path}/${id}`, body);

const destroy = (id) => axios.delete(`${path}/${id}`);

const destroyBulk = (invoice_ids) =>
  axios.post(`${path}/bulk_deletion`, invoice_ids);

const getInvoice = async (id) => axios.get(`${path}/${id}`);

const editInvoice = async (id) => axios.get(`${path}/${id}/edit`);

const updateInvoice = async (id, body) => axios.patch(`${path}/${id}/`, body);

const sendInvoice = async (id, payload) =>
  axios.post(`${path}/${id}/send_invoice`, payload);

const invoicesApi = {
  get,
  post,
  patch,
  destroy,
  sendInvoice,
  getInvoice,
  destroyBulk,
  editInvoice,
  updateInvoice,
};

export default invoicesApi;
