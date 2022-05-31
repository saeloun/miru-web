import axios from "axios";

const path = "/leads";

const index = async (leadId) => axios.get(`${path}/${leadId}/line_items`);

const create = async (leadId, payload) => axios.post(`${path}/${leadId}/line_items`, payload);

const show = async (leadId, id, queryParam) => axios.get(`${path}/${leadId}/line_items/${id}${queryParam}`);

const update = async (leadId, id, payload) => axios.patch(`${path}/${leadId}/line_items/${id}`, payload);

const destroy = async (leadId, id) => axios.delete(`${path}/${leadId}/line_items/${id}`);

const leadLineItems = { index, create, show, update, destroy };

export default leadLineItems;
