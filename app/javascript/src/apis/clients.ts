import axios from "axios";

const path = "/internal_api/v1/clients";

const update = async (id, payload) => axios.patch(`${path}/${id}`, payload);

const clients = { update };

export default clients;
