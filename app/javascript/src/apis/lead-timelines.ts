import axios from "axios";

const path = "/leads";

const index = async (leadId, query = "") =>
  axios.get(query ? `${path}/${leadId}/timelines?${query}` : `${path}/${leadId}/timelines`);

const create = async (leadId, payload) => axios.post(`${path}/${leadId}/timelines`, payload);

const edit = async (leadId, id) => axios.get(`${path}/${leadId}/timelines/${id}/edit`);

const update = async (leadId, id, payload) => axios.patch(`${path}/${leadId}/timelines/${id}`, payload);

const show = async (leadId, id, queryParam) => axios.get(`${path}/${leadId}/timelines/${id}${queryParam}`);

const destroy = async (leadId, id) => axios.delete(`${path}/${leadId}/timelines/${id}`);

const leadTimelines = { index, create, show, edit, update, destroy };

export default leadTimelines;
