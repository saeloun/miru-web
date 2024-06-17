import axios from "./api";

const allLeaves = () => axios.get("/leaves");

const customLeaves = (year, payload) =>
  axios.patch(`/custom_leaves/${year}`, payload);

const updateLeaveWithLeaveTypes = (year, payload) =>
  axios.patch(`/leave_with_leave_type/${year}`, payload);

const leavesApi = {
  allLeaves,
  customLeaves,
  updateLeaveWithLeaveTypes,
};

export default leavesApi;
