import { createClient } from "tinacms/dist/client";
import { queries } from "./types";

const token = process.env.TINA_TOKEN;

export const client = createClient({
  url: "http://localhost:4001/graphql",
  token,
  queries,
});
export default client;
