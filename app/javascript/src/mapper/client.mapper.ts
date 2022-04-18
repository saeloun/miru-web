const getClientList = (input) => input.client_details.map((client) => ({
  email: client.email,
  id: client.id,
  minutes: client.minutes_spent,
  name: client.name
}));
const unmapClient = (input) => {
  const { data } = input;
  return {
    clientList: getClientList(data),
    totalMinutes: data.total_minutes
  };
};

export default unmapClient;
