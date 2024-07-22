export interface BlogProps {
  sys: {
    id: string;
  };
  slug: string;
  title: string;
  summary: string;
  author: string;
  heroImage?: {
    sys: {
      id: string;
    };
    url: string;
  };
  categoryName: string;
  date: Date;
  details: {
    json: any;
    links?: any;
  };
}

// Set a variable that contains all the fields needed for blogs when a fetch for content is performed
export const BLOG_GRAPHQL_FIELDS = `
  sys {
    id
  }
  __typename
  title
  slug
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
  date
  author
  categoryName
  heroImage {
    sys {
      id
    }
    __typename
    url
  }
`;