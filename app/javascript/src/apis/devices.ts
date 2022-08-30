import axios from "axios";

const path = "/devices";

const get = async (query = "") =>
  axios.get(query ? `${path}?${query}` : `${path}`);

const update = async (id: string, payload: any) => axios.put(`${path}/${id}`, payload);

const destroy = async (id: string) => axios.delete(`${path}/${id}`);

const devices = { get, update, destroy };

export default devices;
