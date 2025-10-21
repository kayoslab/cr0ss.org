import { fetchGraphQL } from './api';
import { CATEGORY_GRAPHQL_FIELDS } from './props/category';
import { BLOG_GRAPHQL_FIELDS } from './props/blog';

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

interface BlogPost {
  [key: string]: unknown;
}

interface CategoryGraphQLResponse {
    data?: {
      blogCategoryCollection?: {
        items: [{
          linkedFrom: {
            blogPostCollection: {
              items: BlogPost[];
              total: number;
            };
          };
        }];
      };
    };
}

function extractAllBlogEntriesForCategory(fetchResponse: CategoryGraphQLResponse) {
    const collection = fetchResponse?.data?.blogCategoryCollection?.items[0]?.linkedFrom.blogPostCollection;
    return {
        items: collection?.items ?? [],
        total: collection?.total ?? 0
    };
}
  
export async function getBlogsForCategory(slug: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const blogs = await fetchGraphQL(
        `query {
        blogCategoryCollection(where: { slug: "${slug}" }, limit: 1) {
            items {
            linkedFrom {
                blogPostCollection(order: sys_firstPublishedAt_DESC, limit: ${limit}, skip: ${skip}, preview: false) {
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