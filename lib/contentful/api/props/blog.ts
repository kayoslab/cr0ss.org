import { CategoryProps } from "./category";

export interface BlogProps {
  sys: {
    id: string;
    firstPublishedAt: string;
  };
  slug: string;
  title: string;
  author: string;
  categoriesCollection: { items: [CategoryProps] }
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
  seoKeywords: [string];
}

// Set a variable that contains all the fields needed for blogs when a fetch for content is performed
export const BLOG_GRAPHQL_FIELDS = `
  sys {
    id
    firstPublishedAt
  }
  title
  slug
  author
  authorText
  categoriesCollection(limit: 50) {
    items {
      sys {
        id
      }
      title
      slug
    }
  }
  summary
  heroImage {
    sys {
      id
    }
    url
  }
  details {
    json
    links {
      entries {
        block {
          sys {
            id
          }
          __typename
          ... on CodeSnippet {
            codeSnippet
            language
          }
        }
      }
      assets {
        block {
          sys {
            id
          }
          url
          title
          description
          fileName
        }
      }
    }
  }
  seoDescription
  seoKeywords
`;