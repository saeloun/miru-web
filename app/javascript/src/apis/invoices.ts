import axios from "axios";

const path = "/invoices";

const get = async (query = "") =>
  axios.get(query ? `${path}?${query}` : `${path}`);

const post = async (body) => axios.post(`${path}`, body);

const patch = async (id, body) => axios.post(`${path}/${id}`, body);

const sendInvoice = async (id, payload) =>
  axios.post(`${path}/${id}/send_invoice`, payload);

const invoicesApi = { get, post, patch, sendInvoice };

export default invoicesApi;
