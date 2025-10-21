import { http, HttpResponse } from 'msw';

// Mock handlers for external APIs
export const handlers = [
  // Contentful GraphQL API
  http.post('https://graphql.contentful.com/content/v1/spaces/:spaceId', () => {
    return HttpResponse.json({
      data: {
        blogPostCollection: {
          items: [
            {
              sys: {
                id: '1',
                firstPublishedAt: '2024-01-01T00:00:00Z',
              },
              title: 'Test Blog Post',
              slug: 'test-blog-post',
              author: 'Test Author',
              seoDescription: 'Test description',
              seoKeywords: ['test', 'blog'],
              summary: 'Test summary',
              content: {
                json: {
                  nodeType: 'document',
                  content: [],
                },
              },
              heroImage: {
                url: 'https://example.com/image.jpg',
              },
              categoriesCollection: {
                items: [
                  {
                    title: 'Test Category',
                    slug: 'test-category',
                  },
                ],
              },
            },
          ],
          total: 1,
          skip: 0,
          limit: 10,
        },
      },
    });
  }),

  // Algolia Search API
  http.post('https://:appId-dsn.algolia.net/1/indexes/:index/query', () => {
    return HttpResponse.json({
      hits: [
        {
          objectID: '1',
          title: 'Test Search Result',
          url: '/blog/test-result/',
          summary: 'Test summary',
        },
      ],
      nbHits: 1,
      page: 0,
      nbPages: 1,
      hitsPerPage: 10,
    });
  }),

  // Add or update Algolia object
  http.post('https://:appId-dsn.algolia.net/1/indexes/:index/:objectId', () => {
    return HttpResponse.json({
      objectID: '1',
      taskID: 12345,
    });
  }),
];
