import axios from "axios";

const path = "/clients";

const get = async (queryParam) => axios.get(`${path}${queryParam}`);

const update = async (id, payload) => axios.patch(`${path}/${id}`, payload);

const destroy = async id => axios.delete(`${path}/${id}`);

const clients = { update, destroy, get };

export default clients;
