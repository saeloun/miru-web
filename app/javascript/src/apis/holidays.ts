import axios from "./api";

const allHolidays = () => axios.get("/holidays");

const updateHolidays = () => axios.patch("/holidays");

const holidaysApi = {
  allHolidays,
  updateHolidays,
};

export default holidaysApi;
