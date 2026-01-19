import { createClient } from "tinacms/dist/client";
import { queries } from "./types";
export const client = createClient({ cacheDir: '/workspace/Italianamente/tina/__generated__/.cache/1768816035103', url: 'http://localhost:4001/graphql', token: 'undefined', queries,  });
export default client;
  