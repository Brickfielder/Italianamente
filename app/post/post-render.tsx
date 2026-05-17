import { notFound } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";

import { client } from "../../tina/__generated__/client";
import PostClient from "./post-client";

export async function renderPostByPath(relativePath: string) {
  try {
    noStore();
    const tinaProps = await client.queries.post({ relativePath });
    return <PostClient {...tinaProps} />;
  } catch (error) {
    console.error("Error fetching post:", error);
    notFound();
  }
}
