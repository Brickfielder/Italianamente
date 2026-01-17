import { client } from "../../tina/__generated__/client";
import ClientAboutPage from "./client-about";

export default async function AboutPage() {
  const tinaProps = await client.queries.page({ relativePath: "about.mdx" });
  return <ClientAboutPage {...tinaProps} />;
}
