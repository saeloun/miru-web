import axios from "./api";

const path = "/payments/settings";

const get = async () => axios.get(`${path}`);

const connectStripe = async () => axios.post(`${path}/stripe/connect`);

const disconnectStripe = async () => axios.delete(`${path}/stripe/disconnect`);

const paymentSettings = { get, connectStripe, disconnectStripe };

export default paymentSettings;
