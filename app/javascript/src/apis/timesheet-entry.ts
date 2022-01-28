import axios from "axios";

axios.defaults.baseURL = "/timesheet-entries";

const create = params => axios.post(params);

const destroy = id => axios.delete(id);

const timesheetEntryApi = { create, destroy };

export default timesheetEntryApi;
