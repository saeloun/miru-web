import axios from "axios";

const path = "/invoices";

const get = async () => axios.get(`${path}`);

const invoicesApi = { get };

export default invoicesApi;
