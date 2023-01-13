import { createConsumer } from "@rails/actioncable";

const consumer = createConsumer(`wss://staging-miru.saeloun.com/cable`);
export default consumer;
