import { fetchGraphQL } from './api';
import { PAGE_GRAPHQL_FIELDS } from './props/page';

export async function getAllPages(limit = 10) {
  const pages = await fetchGraphQL(
    `query {
      pageCollection(limit: ${limit}, preview: false) {
        items {
          ${PAGE_GRAPHQL_FIELDS}
        }
      }
    }`,
    ['pages']
  );

  return pages?.data?.pageCollection?.items ?? [];
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

  return pages?.data?.pageCollection?.items?.[0];
}