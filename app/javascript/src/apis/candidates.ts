import axios from "axios";

const path = "recruitments/candidates";

const get = async (queryParam) => axios.get(`${path}${queryParam}`);

const create = async (payload) => axios.post(`${path}`, payload);

const show = async (id) => axios.get(`${path}/${id}`);

const update = async (id, payload) => axios.patch(`${path}/${id}`, payload);

const destroy = async id => axios.delete(`${path}/${id}`);

const candidates = { update, destroy, get, show, create };

export default candidates;
