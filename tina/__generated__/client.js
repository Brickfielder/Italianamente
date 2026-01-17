import { createClient } from "tinacms/dist/client";
import { queries } from "./types";
export const client = createClient({ url: "http://localhost:4001/graphql", token: "c004ef68526f200b0838cee9fff62ec22558d0f5", queries });
export default client;
