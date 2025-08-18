import axios from "./api";

const path = "/timesheet_entry";

// Fetch all required data for time tracking
const get = async () => {
  try {
    // Fetch all data in parallel
    const [entriesResponse, teamResponse, projectsResponse, clientsResponse] = await Promise.all([
      axios.get(path).catch(() => ({ data: { entries: [] } })),
      axios.get("/team").catch(() => ({ data: { combinedDetails: [] } })),
      axios.get("/projects").catch(() => ({ data: { projects: [] } })),
      axios.get("/clients").catch(() => ({ data: { client_details: [] } }))
    ]);

    // Transform team members to the format expected by the component
    const employees = (teamResponse.data.combinedDetails || []).map(member => ({
      id: member.id,
      first_name: member.firstName,
      last_name: member.lastName,
      full_name: member.name || `${member.firstName} ${member.lastName}`
    }));

    // Transform projects to the format expected by the component
    const projects = (projectsResponse.data.projects || []).reduce((acc, project) => {
      const clientId = project.client_id || project.clientId;
      if (!acc[clientId]) {
        acc[clientId] = [];
      }
      acc[clientId].push({
        id: project.id,
        name: project.name,
        client_id: clientId,
        billable: project.billable
      });
      return acc;
    }, {});

    // Transform clients to the format expected by the component
    const clients = (clientsResponse.data.client_details || []).reduce((acc, client) => {
      acc[client.id] = client.name;
      return acc;
    }, {});

    return {
      data: {
        entries: entriesResponse.data.entries || [],
        clients,
        projects,
        employees
      }
    };
  } catch (error) {
    console.error("Error fetching time tracking data:", error);
    // If any request fails, return empty data
    return {
      data: {
        entries: [],
        clients: {},
        projects: {},
        employees: []
      }
    };
  }
};

const getCurrentUserEntries = (from, to, year, uid) =>
  axios.get(`${path}?from=${from}&to=${to}&year=${year}&user_id=${uid}`);

const timeTrackingApi = { get, getCurrentUserEntries };

export default timeTrackingApi;
