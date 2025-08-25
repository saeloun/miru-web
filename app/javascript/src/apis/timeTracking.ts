import apiAxios from "./api";
import internalAxios from "./internalApi";

const path = "/timesheet_entry";

// Fetch all required data for time tracking
const get = async (userId?: number) => {
  try {
    // Use the internal API endpoint that returns all data in one call
    // If userId is provided, fetch that user's data, otherwise current user's data
    const url = userId ? `/time-tracking?user_id=${userId}` : "/time-tracking";
    const response = await internalAxios.get(url);
    
    // The API returns:
    // - clients: array of client objects
    // - projects: object keyed by client name
    // - employees: array of employee objects
    // - entries: object keyed by date
    
    return {
      data: {
        entries: response.data.entries || {},
        clients: response.data.clients || [],
        projects: response.data.projects || {},
        employees: response.data.employees || [],
      },
    };
  } catch (error) {
    console.error("Error fetching time tracking data:", error);

    // If request fails, return empty data
    return {
      data: {
        entries: {},
        clients: [],
        projects: {},
        employees: [],
      },
    };
  }
};

const getCurrentUserEntries = (from, to, year, uid) =>
  apiAxios.get(`${path}?from=${from}&to=${to}&year=${year}&user_id=${uid}`);

const timeTrackingApi = { get, getCurrentUserEntries };

export default timeTrackingApi;
