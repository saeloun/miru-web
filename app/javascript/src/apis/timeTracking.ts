import axios from "./api";

const path = "/timesheet_entry";

// For now, let's just get timesheet entries
// We'll need to update this to fetch clients and projects separately
const get = async () => {
  try {
    const response = await axios.get(path);
    // Transform the response to match what the component expects
    return {
      data: {
        entries: response.data.entries || [],
        clients: [],  // Will need to fetch separately
        projects: [], // Will need to fetch separately
        employees: [] // Will need to fetch separately
      }
    };
  } catch (error) {
    // If timesheet_entry fails, return empty data
    return {
      data: {
        entries: [],
        clients: [],
        projects: [],
        employees: []
      }
    };
  }
};

const getCurrentUserEntries = (from, to, year, uid) =>
  axios.get(`${path}?from=${from}&to=${to}&year=${year}&user_id=${uid}`);

const timeTrackingApi = { get, getCurrentUserEntries };

export default timeTrackingApi;
