import axios from "./api";

const path = "/calendars";

const redirect = async () => axios.get(`${path}/redirect`);

const callback = async () => axios.get(`${path}/callback`);

const events = async (calendarId, month, year) =>
  axios.get(`${path}/events/${calendarId}?month=${month}&year=${year}`);

const googleCalendarApi = { redirect, callback, events };

export default googleCalendarApi;
