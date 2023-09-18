import axios from "./api";

const path = "/calendars";

const redirect = async () => axios.get(`${path}/redirect`);

const callback = async () => axios.get(`${path}/callback`);

const googleCalendarApi = { redirect, callback };

export default googleCalendarApi;
