import axios from "axios";

const path = "/generate_invoice";

const get = async () => axios.get(path);

const generateInvoice = { get };

export default generateInvoice;
