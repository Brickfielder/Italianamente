import ClientHomePage from "./client-home";
import { client } from "../tina/__generated__/client";

export default async function HomePage() {
  const tinaProps = await client.request({
    query: `query HomePage($relativePath: String!) {
      page(relativePath: $relativePath) {
        tiles {
          style
          category
          title
          description
          bulletPoints
          buttonText
          postReference {
            ... on Post {
              title
              category
              _sys {
                filename
                relativePath
                breadcrumbs
              }
            }
          }
        }
      }
    }`,
    variables: { relativePath: "home.mdx" },
  });

  return <ClientHomePage {...tinaProps} />;
}
