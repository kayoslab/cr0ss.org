import { fetchGraphQL } from './api';
import { BLOG_GRAPHQL_FIELDS } from './props/blog';

function extractBlogEntries(fetchResponse: {
  data: { blogPostCollection: { items: any } };
}) {
  return fetchResponse?.data?.blogPostCollection?.items;
}

export async function getAllBlogs(limit = 10) {
  const blogs = await fetchGraphQL(
    `query {
      blogPostCollection(where:{slug_exists: true}, order: date_DESC, limit: ${limit}, preview: false) {
          items {
            ${BLOG_GRAPHQL_FIELDS}
          }
        }
      }`,
    ['blogPosts']
  );
  return extractBlogEntries(blogs);
}

export async function getBlog(slug: string) {
  const blog = await fetchGraphQL(
    `query {
      blogPostCollection(where:{slug: "${slug}"}, limit: 1, preview: false) {
          items {
            ${BLOG_GRAPHQL_FIELDS}
          }
        }
      }`,
    [slug]
  );

  return extractBlogEntries(blog)[0];
}