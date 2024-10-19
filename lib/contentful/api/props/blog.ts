export interface BlogProps {
  sys: {
    id: string;
  };
  slug: string;
  title: string;
  author: string;
  summary: string;
  heroImage?: {
    sys: {
      id: string;
    };
    url: string;
  };
  details: {
    json: any;
    links?: any;
  };
  authorText: string;
  seoDescription: string;
  seoKeywords: string;
}

// Set a variable that contains all the fields needed for blogs when a fetch for content is performed
export const BLOG_GRAPHQL_FIELDS = `
  sys {
    id
  }
  __typename
  title
  slug
  author
  summary
  details {
    json
    links {
      assets {
          block {
              fileName
              title
              description
              url
              sys {
                  id
              }
          }
      }
    }
  }
  heroImage {
    sys {
      id
    }
    __typename
    url
  }
  authorText
  seoDescription
  seoKeywords
`;