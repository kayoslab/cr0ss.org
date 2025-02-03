import { fetchGraphQL } from './api';
import { BLOG_GRAPHQL_FIELDS } from './props/blog';

interface BlogCollection {
  items: any[];
  total: number;
  skip: number;
  limit: number;
}

function extractBlogCollection(fetchResponse: any): BlogCollection {
  if (!fetchResponse?.data?.blogPostCollection) {
    // Return empty collection if no data
    return {
      items: [],
      total: 0,
      skip: 0,
      limit: 0
    };
  }
  return fetchResponse.data.blogPostCollection;
}

export async function getAllBlogs(page = 1, limit = 9) {
  try {
    const blogs = await fetchGraphQL(
      `query {
        blogPostCollection(
          order: sys_firstPublishedAt_DESC, 
          limit: ${limit}, 
          skip: ${(page - 1) * limit}, 
          preview: false
        ) {
          total
          skip
          limit
          items {
            ${BLOG_GRAPHQL_FIELDS}
          }
        }
      }`,
      ['blogPosts']
    );
    
    return extractBlogCollection(blogs);
  } catch (error) {
    console.error('Error fetching blogs:', error);
    // Return empty collection on error
    return {
      items: [],
      total: 0,
      skip: 0,
      limit: limit
    };
  }
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
  return extractBlogCollection(blog).items[0];
}