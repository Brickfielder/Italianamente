import { notFound } from "next/navigation";

import { getPost } from "../../lib/content";
import PostClient from "./post-client";

export async function renderPostByPath(relativePath: string) {
  const post = await getPost(relativePath);
  if (!post || post.status === "archived") {
    notFound();
  }

  return <PostClient post={post} />;
}
