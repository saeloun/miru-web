import axios from "axios";

const path = "/clients";

const update = async (id, payload) => axios.patch(`${path}/${id}`, payload);

const deleteClient = async id => axios.delete(`${path}/${id}`);

const clients = { update, deleteClient };

export default clients;
