import axios from "axios";

const path = "/invoices";

const get = async () => axios.get(`${path}`);

const post = async (body) => axios.post(`${path}`, body);

const patch = async (id, body) => axios.post(`${path}/${id}`, body);

const invoicesApi = { get, post, patch };

export default invoicesApi;
