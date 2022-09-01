import axios from "axios";

const path = "/devices";
const demandPath = "device_usages/demand";

const get = async (query = "") =>
  axios.get(query ? `${path}?${query}` : `${path}`);

const update = async (id: string, payload: any) => axios.put(`${path}/${id}`, payload);

const destroy = async (id: string) => axios.delete(`${path}/${id}`);

const demand = async (id: number) => axios.get(`${path}/${id}/${demandPath}`);

const devices = { get, update, destroy, demand };

export default devices;
