import ClientPage from "./client-page";
import { client } from "../../tina/__generated__/client";

export default async function Page({ params }: { params: { filename: string[] } }) {
  // 1. Calculate the file to load.
  const filename = params.filename ? params.filename.join("/") : "home";

  // 2. Run a custom query that handles Fragments (Polymorphism)
  // We use "... on PageTilesStandard" to tell GraphQL which fields belong to which template.
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
          tiles {
            __typename
            
            # FRAGMENT 1: If it is a "Standard" tile
            ... on PageTilesStandard {
              category
              title
              points
              linkText
              postReference {
                ... on Post {
                  _sys {
                    breadcrumbs
                    filename
                  }
                }
              }
            }

            # FRAGMENT 2: If it is an "Idiom" tile
            ... on PageTilesIdiom {
              category
              title
              content
              postReference {
                ... on Post {
                  _sys {
                    breadcrumbs
                    filename
                  }
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

// Generate static pages
export async function generateStaticParams() {
  const pages = await client.queries.pageConnection();
  const paths = pages.data?.pageConnection?.edges?.map((edge) => ({
    filename: edge?.node?._sys.breadcrumbs,
  }));
  return paths || [];
}