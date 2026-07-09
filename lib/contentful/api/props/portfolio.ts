import { Document } from '@contentful/rich-text-types';
import type { ContentfulLinks } from '../../rich-text-renderer';

export interface PortfolioProps {
  sys: {
    id: string;
    firstPublishedAt: string;
    publishedAt: string;
  };
  slug: string;
  title: string;
  summary: string;
  url?: string | null;
  githubUrl?: string | null;
  external?: boolean | null;
  order?: number | null;
  heroImage?: {
    sys: { id: string };
    url: string;
    title?: string;
    description?: string;
  } | null;
  description?: {
    json: Document;
    links: ContentfulLinks;
  } | null;
}

// Lightweight fields for the list/grid view. Excludes the rich-text
// `description` field, whose `links` blocks make a whole-collection query
// exceed Contentful's GraphQL complexity limit (TOO_COMPLEX_QUERY).
export const PORTFOLIO_LIST_FIELDS = `
  sys {
    id
    firstPublishedAt
    publishedAt
  }
  title
  slug
  summary
  url
  external
  order
  heroImage {
    sys {
      id
    }
    url
    title
    description
  }
`;

// Full field set (includes rich-text `description`) for a single project.
export const PORTFOLIO_GRAPHQL_FIELDS = `
  sys {
    id
    firstPublishedAt
    publishedAt
  }
  title
  slug
  summary
  url
  githubUrl
  external
  order
  heroImage {
    sys {
      id
    }
    url
    title
    description
  }
  description {
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
`;
