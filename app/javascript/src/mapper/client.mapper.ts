const getClientList = (input) => input.client_details.map((client) => ({
  email: client.email,
  id: client.id,
  minutes: client.minutes_spent,
  name: client.name
}));

const unmapClientList = (input) => {
  const { data } = input;
  return {
    clientList: getClientList(data),
    totalMinutes: data.total_minutes
  };
};

const mapProjectDetails = (input) => input.map((project) => ({
  name: project.name,
  minutes: project.minutes_spent,
  team: project.team
}));

const unmapClientDetails = (input) => {
  const { data } = input;
  return {
    clientDetails: {
      id: data.client_details.id,
      name: data.client_details.name,
      email: data.client_details.email
    },
    totalMinutes: data.total_minutes,
    projectDetails: mapProjectDetails(data.project_details)
  };
};

export {
  unmapClientList,
  unmapClientDetails
};
