import axios from "axios";

const path = "/generate_invoice";

const get = async () => axios.get(path);

const getLineItems = async (urlParam, pageNo, selectedEntries) => axios.get(`${path}/${urlParam}?page=${pageNo}${selectedEntries}`);

const generateInvoice = { get, getLineItems };

export default generateInvoice;
