import axios from "./api";

const allLeaves = () => axios.get("/leaves");

const updateLeaveWithLeaveTypes = (year, payload) =>
  axios.patch(`/leave_with_leave_type/${year}`, payload);

const leavesApi = {
  allLeaves,
  updateLeaveWithLeaveTypes,
};

export default leavesApi;
