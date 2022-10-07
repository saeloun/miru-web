import axios from "axios";

const path = "/generate_invoice";

const get = async () => axios.get(path);

const getLineItems = async (queryParams) => axios.get(`${path}?${queryParams}`);

const generateInvoice = { get, getLineItems };

export default generateInvoice;
