import { fetchGraphQL } from './api';
import { CATEGORY_GRAPHQL_FIELDS } from './props/category';
import { BLOG_GRAPHQL_FIELDS } from './props/blog';

function extractPageEntries(fetchResponse: {
  data: { pagesCollection: { items: any } };
}) {
  return fetchResponse?.data?.pagesCollection?.items;
}


export async function getCategory(slug: string) {
  const pages = await fetchGraphQL(
    `query {
      blogCategoryCollection(where: { slug: "${slug}" }, limit: 1) {
          items {
            ${CATEGORY_GRAPHQL_FIELDS}
          }
        }
      }`,
    [slug]
  );
  return pages.data.blogCategoryCollection.items[0];
}

function extractAllBlogEntriesForCategory(fetchResponse: {
    data: { blogCategoryCollection: { items: [ {linkedFrom: { blogPostCollection: { items: any } } } ] } };
}) {
    return fetchResponse?.data?.blogCategoryCollection?.items[0]?.linkedFrom.blogPostCollection.items;
}
  
export async function getBlogsForCategory(slug: string, limit: number = 10) {
    const blogs = await fetchGraphQL(
        `query {
        blogCategoryCollection(where: { slug: "${slug}" }, limit: 1) {
            items {
            linkedFrom {
                blogPostCollection(order: sys_firstPublishedAt_DESC, limit: ${limit}, preview: false) {
                total
                items {
                    ${BLOG_GRAPHQL_FIELDS}
                }
                }
            }
            }
        }
        }`,
        ['blogPosts']
    );

    return extractAllBlogEntriesForCategory(blogs);
}