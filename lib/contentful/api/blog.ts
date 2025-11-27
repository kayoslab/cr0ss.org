import { fetchGraphQL } from './api';
import { BLOG_GRAPHQL_FIELDS } from './props/blog';

interface BlogPost {
  [key: string]: unknown;
}

interface BlogCollection {
  items: BlogPost[];
  total: number;
  skip: number;
  limit: number;
}

interface GraphQLResponse {
  data?: {
    blogPostCollection?: BlogCollection;
  };
}

function extractBlogCollection(fetchResponse: GraphQLResponse): BlogCollection {
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
    const query = `query {
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
    }`;

    const blogs = await fetchGraphQL(query, ['blogPosts']);
    const collection = extractBlogCollection(blogs);
    return collection;
  } catch (error) {
    console.error('Error fetching blogs:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
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
  try {
    // Escape any special characters in the slug
    const escapedSlug = slug.replace(/"/g, '\\"');

    const query = `query {
      blogPostCollection(where: { slug: "${escapedSlug}" }, limit: 1, preview: false) {
        total
        items {
          ${BLOG_GRAPHQL_FIELDS}
        }
      }
    }`;

    // Use both the specific slug and the general 'blogPosts' tag
    // This ensures individual posts are revalidated when any blog content changes
    const response = await fetchGraphQL(query, ['blogPosts', slug]);
    if (!response?.data?.blogPostCollection) {
      throw new Error('Invalid response structure');
    }

    const collection = extractBlogCollection(response);
    const blogPost = collection.items[0];
    if (!blogPost) {
      throw new Error(`Blog post with slug ${slug} not found`);
    }

    return blogPost;
  } catch (error) {
    console.error('Error fetching blog:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
    throw error;
  }
}

export async function getBlogById(id: string) {
  try {
    const query = `query {
      blogPost(id: "${id}", preview: false) {
        ${BLOG_GRAPHQL_FIELDS}
      }
    }`;

    const response = await fetchGraphQL(query, ['blogPosts', id]);
    if (!response?.data?.blogPost) {
      throw new Error(`Blog post with id ${id} not found`);
    }

    return response.data.blogPost;
  } catch (error) {
    console.error('Error fetching blog by id:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
    throw error;
  }
}