import { createConsumer } from "@rails/actioncable";

const consumer = createConsumer(process.env.WEBSOCKET_URL);
export default consumer;
