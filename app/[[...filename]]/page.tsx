import ClientHomePage from "../client-home";
import ClientPage from "./client-page";
import { client } from "../../tina/__generated__/client";

type PageParams = {
  filename?: string[];
};

export default async function Page({ params }: { params?: PageParams }) {
  const filename = params?.filename?.length ? params.filename.join("/") : "home";

  if (filename === "home") {
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

  const tinaProps = await client.request({
    query: `query PageQuery($relativePath: String!) {
      page(relativePath: $relativePath) {
        ... on Document {
          _sys {
            filename
            breadcrumbs
            basename
            relativePath
            extension
          }
          id
        }
        ... on Page {
          title
          body
          # Querying the "tiles" list directly (No fragments needed!)
          tiles {
            __typename
            style        # Was "type"
            category
            title
            description  # Was "content"
            bulletPoints # Was "points"
            buttonText   # Was "linkText"
            
            # The Critical Link Logic
            postReference {
              ... on Post {
                _sys {
                  breadcrumbs
                  filename
                  relativePath
                }
              }
            }
          }
        }
      }
    }`,
    variables: { relativePath: `${filename}.mdx` },
  });

  return <ClientPage {...tinaProps} />;
}

export async function generateStaticParams() {
  const pages = await client.queries.pageConnection();
  const paths =
    pages.data?.pageConnection?.edges
      ?.filter((edge) => edge?.node?._sys?.filename !== "home")
      .map((edge) => ({
        filename: edge?.node?._sys?.breadcrumbs,
      })) || [];

  return paths;
}
