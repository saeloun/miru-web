import axios from "axios";

export const fetchClients = async setClients => {
  try {
    const response = await axios("/internal_api/clients");
    const parsedResponse = await response.data;
    setClients(parsedResponse);
  } catch (err) {
    console.log(err);
  }
};
