import { fetchGraphQL } from './api';
import { PAGE_GRAPHQL_FIELDS } from './props/page';

function extractPageEntries(fetchResponse: {
  data: { pagesCollection: { items: any } };
}) {
  return fetchResponse?.data?.pagesCollection?.items;
}

export async function getPage(slug: string) {
  const pages = await fetchGraphQL(
    `query {
      pageCollection(where:{slug: "${slug}"}, limit: 1, preview: false) {
          items {
            ${PAGE_GRAPHQL_FIELDS}
          }
        }
      }`,
    [slug]
  );

  return pages.data.pageCollection.items[0];
}