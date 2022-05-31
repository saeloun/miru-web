import axios from "axios";

const path = "/leads";

const index = async (leadId) => axios.get(`${path}/${leadId}/quotes`);

const create = async (leadId, payload) => axios.post(`${path}/${leadId}/quotes`, payload);

const show = async (leadId, id, queryParam) => axios.get(`${path}/${leadId}/quotes/${id}${queryParam}`);

const update = async (leadId, id, payload) => axios.patch(`${path}/${leadId}/quotes/${id}`, payload);

const destroy = async (leadId, id) => axios.delete(`${path}/${leadId}/quotes/${id}`);

const leadQuotes = { index, create, show, update, destroy };

export default leadQuotes;
