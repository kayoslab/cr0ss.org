import { fetchGraphQL } from './api';
import { BLOG_GRAPHQL_FIELDS } from './props/blog';
import { CategoryProps } from './props/category';

function extractAllBlogEntries(fetchResponse: {
  data: { blogPostCollection: { items: any } };
}) {
  return fetchResponse?.data?.blogPostCollection?.items;
}

export async function getAllBlogs(limit = 10) {
  const blogs = await fetchGraphQL(
    `query {
      blogPostCollection(order: sys_firstPublishedAt_DESC, limit: ${limit}, preview: false) {
        items {
          ${BLOG_GRAPHQL_FIELDS}
        }
      }
    }`,
    ['blogPosts']
  );
  return extractAllBlogEntries(blogs);
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

  console.log(extractAllBlogEntries(blog)[0].categoriesCollection.items.map((category:CategoryProps)=>(category.title)).join(','));
  
  return extractAllBlogEntries(blog)[0];
}