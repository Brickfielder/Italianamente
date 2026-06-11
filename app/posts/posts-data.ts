import { listPosts } from "../../lib/content";
import type { PostDocument } from "../../lib/content/types";

export type PostListItem = PostDocument;

export const fetchPosts = async () => listPosts();
