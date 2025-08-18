import axios from "./api";

const path = "/timesheet_entry";

interface TimesheetEntryParams {
  from?: string;
  to?: string;
  user_id?: string | number;
}

const index = async (params?: TimesheetEntryParams) => {
  const queryParams = new URLSearchParams();
  if (params?.from) queryParams.append('from', params.from);
  if (params?.to) queryParams.append('to', params.to);
  if (params?.user_id) queryParams.append('user_id', String(params.user_id));
  
  const queryString = queryParams.toString();
  const url = queryString ? `${path}?${queryString}` : path;
  return axios.get(url);
};

const create = async (params: any, userId?: string | number) => {
  const url = userId ? `${path}?user_id=${userId}` : path;
  return axios.post(url, params);
};

const list = async (from: string, to: string, uid?: string | number) =>
  axios.get(`${path}?from=${from}&to=${to}${uid ? `&user_id=${uid}` : ''}`);

const update = async (id: string | number, payload: any) => 
  axios.put(`${path}/${id}`, payload);

const destroy = async (id: string | number) => 
  axios.delete(`${path}/${id}`);

const destroyBulk = async (payload: any) =>
  axios.delete(`${path}/bulk_action/`, { data: { source: payload } });

const updateBulk = async (payload: any) =>
  axios.patch(`${path}/bulk_action/`, payload);

const timesheetEntryApi = {
  index,
  list,
  create,
  update,
  destroy,
  destroyBulk,
  updateBulk,
};

export default timesheetEntryApi;
