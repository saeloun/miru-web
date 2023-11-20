import axios from "./api";

const allHolidays = () => axios.get("/holidays");

const updateHolidays = (year, payload) =>
  axios.patch(`/holidays/${year}`, payload);

const holidaysApi = {
  allHolidays,
  updateHolidays,
};

export default holidaysApi;
