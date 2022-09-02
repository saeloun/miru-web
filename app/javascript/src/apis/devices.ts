import axios from "axios";

const path = "/devices";
const demandPath = "device_usages/demand";
const demandCancelPath = "device_usages/demand_cancel";

const get = async (query = "") =>
  axios.get(query ? `${path}?${query}` : `${path}`);

const update = async (id: string, payload: any) => axios.put(`${path}/${id}`, payload);

const destroy = async (id: string) => axios.delete(`${path}/${id}`);

const demand = async (id: number) => axios.get(`${path}/${id}/${demandPath}`);

const demandCancel = async (id: number) => axios.get(`${path}/${id}/${demandCancelPath}`);

const devices = { get, update, destroy, demand, demandCancel };

export default devices;
