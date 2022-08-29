import axios from "axios";

const path = "/devices";

const get = async (query = "") =>
  axios.get(query ? `${path}?${query}` : `${path}`);

const devices = { get };

export default devices;
