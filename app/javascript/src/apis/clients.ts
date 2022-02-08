import axios from "axios";

export interface IClient {
  id: number;
  company_id: number;
  name: string;
  email: string;
  address: string;
  phone: string;
  country: string;
  timezone: string;
  created_at: string;
}

export const fetchClients = async (): Promise<IClient[]> => {
  try {
    const response = await axios("/clients");
    const parsedResponse: IClient[] = await response.data;
    return parsedResponse;
  } catch (err) {
    console.log(err);
  }
};
