import axios from "axios";

const path = "/engagements";

const get = async (query = "") =>
  axios.get(query ? `${path}?${query}` : `${path}`);

const update = async (id, payload) => axios.patch(`${path}/${id}`, payload);

const engagements = { get, update };

export default engagements;
