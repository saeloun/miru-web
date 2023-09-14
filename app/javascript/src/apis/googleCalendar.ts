import axios from "./api";

const path = "/calendars";

const redirect = async () => axios.get(`${path}/redirect`);

const googleCalendarApi = { redirect };

export default googleCalendarApi;
