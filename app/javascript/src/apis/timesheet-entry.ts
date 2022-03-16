import axios from "axios";

const path = "/timesheet_entry";

const create = async params => axios.post(path, params);

const list = async (from, to) => axios.get(`${path}?from=${from}&to=${to}`);

const update = async (id, payload) => axios.put(`${path}/${id}`, payload);

const destroy = async id => axios.delete(`${path}/${id}`);

const destroyBulk = async payload =>
  axios.delete(`${path}/bulk_action?ids=${payload.join(",")}`);

const updateBulk = async payload => axios.patch(`${path}/bulk_action`, payload);

const timesheetEntryApi = {
  list,
  create,
  update,
  destroy,
  destroyBulk,
  updateBulk
};

export default timesheetEntryApi;
