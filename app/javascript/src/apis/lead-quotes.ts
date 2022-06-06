import axios from "axios";

const path = "/leads";

const index = async (leadId, queryParam) => axios.get(`${path}/${leadId}/quotes${queryParam}`);

const create = async (leadId, payload) => axios.post(`${path}/${leadId}/quotes`, payload);

const edit = async (leadId, id) => axios.get(`${path}/${leadId}/quotes/${id}/edit`);

const update = async (leadId, id, payload) => axios.patch(`${path}/${leadId}/quotes/${id}`, payload);

const show = async (leadId, id, queryParam) => axios.get(`${path}/${leadId}/quotes/${id}${queryParam}`);

const destroy = async (leadId, id) => axios.delete(`${path}/${leadId}/quotes/${id}`);

const updateLineItems = async (leadId, id, leadLineItemIds) => axios.get(`${path}/${leadId}/quotes/${id}/update_line_items?lead_line_item_ids=${leadLineItemIds}`);

const leadQuotes = { index, create, show, edit, update, destroy, updateLineItems };

export default leadQuotes;
