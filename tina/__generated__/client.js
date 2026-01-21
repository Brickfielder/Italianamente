import { createClient } from "tinacms/dist/client";
import { queries } from "./types";
export const client = createClient({ url: "http://localhost:4001/graphql", token: "737f9531eb418dfb9ddc762ad875eb0a71646b5a", queries });
export default client;
