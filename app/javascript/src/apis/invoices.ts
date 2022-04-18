import axios from "axios";

const path = "/invoices";

const get = async (query = "") =>
  axios.get(query ? `${path}?${query}` : `${path}`);

const invoicesApi = { get };

export default invoicesApi;
