import axios from "axios";

const path = "/invoices";

const get = async (query = "") =>
  axios.get(query ? `${path}?${query}` : `${path}`);

const post = async (body) => axios.post(`${path}`, body);

const patch = async (id, body) => axios.post(`${path}/${id}`, body);

const getInvoice = async (id) => axios.get(`${path}/${id}`);

const sendInvoice = async (id, payload) =>
  axios.post(`${path}/${id}/send_invoice`, payload);

const invoicesApi = { get, post, patch, sendInvoice, getInvoice };

export default invoicesApi;
