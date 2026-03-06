import ClientHomePage from "./client-home";
import { client } from "../tina/__generated__/client";

export default async function HomePage() {
  const tinaProps = await client.queries.page({ relativePath: "home.mdx" });

  return <ClientHomePage {...tinaProps} />;
}
