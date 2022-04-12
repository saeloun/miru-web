import axios from "axios";

const path = "/clients";

const get = async (queryParam) => axios.get(`${path}${queryParam}`);

const show = async (id, queryParam) => axios.get(`${path}/${id}${queryParam}`);

const update = async (id, payload) => axios.patch(`${path}/${id}`, payload);

const destroy = async id => axios.delete(`${path}/${id}`);

const clients = { update, destroy, get, show };

export default clients;
