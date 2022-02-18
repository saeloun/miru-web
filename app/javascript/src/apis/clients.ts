import axios from "axios";

const path = "/clients";

const update = async (id, payload) => axios.patch(`${path}/${id}`, payload);

const clients = { update };

export default clients;
