import axios from "axios";

const path = "/clients";

const get = async (queryParam) => axios.get(`${path}${queryParam}`);

const create = async (payload) => axios.post(`${path}`, payload);

const show = async (id, queryParam) => axios.get(`${path}/${id}${queryParam}`);

const update = async (id, payload) => axios.patch(`${path}/${id}`, payload);

const destroy = async id => axios.delete(`${path}/${id}`);

const removeLogo = (id) => axios.delete(`${path}/${id}/purge_logo`);

const clientApi = { update, destroy, get, show, create, removeLogo };

export default clientApi;
