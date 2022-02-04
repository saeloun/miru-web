import axios from "axios";

axios.defaults.baseURL = "api/v1/timesheet-entries";

const create = async params => axios.post("/", params);

const list = async (from, to) => axios.get(`?from=${from}&to=${to}`);

const update = async (id, payload) => axios.put(`/${id}`, payload);

const destroy = async id => axios.delete(`/${id}`);

const timesheetEntryApi = { list, create, update, destroy };

export default timesheetEntryApi;
