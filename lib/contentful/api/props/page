export interface PageProps {
  sys: {
    id: string;
  };
  slug: string;
  title: string;
  date: Date;
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
}

// Set a variable that contains all the fields needed for pages when a fetch for content is performed
export const PAGE_GRAPHQL_FIELDS = `
  sys {
    id
  }
  __typename
  title
  slug
  date
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
`;