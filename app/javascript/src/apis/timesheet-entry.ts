import axios from "axios";

const path = "/timesheet_entry";

const create = async params => axios.post(path, params);

const list = async (from, to) => axios.get(`${path}?from=${from}&to=${to}`);

const update = async (id, payload) => axios.put(`${path}/${id}`, payload);

const destroy = async id => axios.delete(`${path}/${id}`);

const createMany = async payload => axios.post(`${path}/many`, payload);

const updateMany = async payload => axios.delete(`${path}/many`, payload);

const timesheetEntryApi = {
  list,
  create,
  update,
  destroy,
  createMany,
  updateMany
};

export default timesheetEntryApi;
