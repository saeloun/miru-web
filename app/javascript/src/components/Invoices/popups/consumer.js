import { createConsumer } from "@rails/actioncable";

const { APP_BASE_URL } = process.env;

const consumer = createConsumer(`ws://${APP_BASE_URL}/cable`);
export default consumer;
