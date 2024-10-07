import { fetchGraphQL } from './api';
import { PAGE_GRAPHQL_FIELDS } from './props/page';

function extractPageEntries(fetchResponse: {
  data: { blogPostCollection: { items: any } };
}) {
  return fetchResponse?.data?.blogPostCollection?.items;
}

export async function getAllPages(limit = 10) {
  const blogs = await fetchGraphQL(
    `query {
      pageCollection(where:{slug_exists: true}, order: date_DESC, limit: ${limit}, preview: false) {
          items {
            ${PAGE_GRAPHQL_FIELDS}
          }
        }
      }`,
    ['blogPosts']
  );
  return extractPageEntries(blogs);
}

export async function getPage(slug: string) {
  const blog = await fetchGraphQL(
    `query {
      pageCollection(where:{slug: "${slug}"}, limit: 1, preview: false) {
          items {
            ${PAGE_GRAPHQL_FIELDS}
          }
        }
      }`,
    [slug]
  );

  return extractPageEntries(blog)[0];
}