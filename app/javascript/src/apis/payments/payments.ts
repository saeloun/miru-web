import axios from "../api";

const path = "/payments";

const get = (queryParams = "") => axios.get(`${path}${queryParams}`);

const create = async payload => axios.post(`${path}`, payload);

const show = async (id, queryParam) => axios.get(`${path}/${id}${queryParam}`);

const update = async (id, payload) => axios.patch(`${path}/${id}`, payload);

const destroy = async id => axios.delete(`${path}/${id}`);

const getInvoiceList = () => axios.get(`${path}/new`);

const payments = { update, destroy, get, show, create, getInvoiceList };

export default payments;
