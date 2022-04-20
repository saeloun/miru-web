import axios from "axios";

const path = "/invoices";

const get = async (query = "") =>
  axios.get(query ? `${path}?${query}` : `${path}`);

const post = async (body) => axios.post(`${path}`, body);

const patch = async (id, body) => axios.post(`${path}/${id}`, body);

const invoicesApi = { get, post, patch };

export default invoicesApi;
