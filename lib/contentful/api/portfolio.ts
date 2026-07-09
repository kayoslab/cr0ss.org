import { fetchGraphQL } from './api';
import {
  PORTFOLIO_GRAPHQL_FIELDS,
  PORTFOLIO_LIST_FIELDS,
  type PortfolioProps,
} from './props/portfolio';

interface PortfolioCollection {
  items: PortfolioProps[];
  total: number;
  skip: number;
  limit: number;
}

interface GraphQLResponse {
  data?: {
    portfolioProjectCollection?: PortfolioCollection;
  };
}

function extractCollection(response: GraphQLResponse): PortfolioCollection {
  if (!response?.data?.portfolioProjectCollection) {
    return { items: [], total: 0, skip: 0, limit: 0 };
  }
  return response.data.portfolioProjectCollection;
}

/** All portfolio projects, ordered by the `order` field (ascending). */
export async function getAllProjects(): Promise<PortfolioCollection> {
  try {
    const query = `query {
      portfolioProjectCollection(order: order_ASC, limit: 100, preview: false) {
        total
        skip
        limit
        items {
          ${PORTFOLIO_LIST_FIELDS}
        }
      }
    }`;

    const response = await fetchGraphQL(query, ['portfolioProjects']);
    return extractCollection(response);
  } catch (error) {
    console.error('Error fetching portfolio projects:', error);
    return { items: [], total: 0, skip: 0, limit: 0 };
  }
}

/** A single portfolio project by slug, or null if not found. */
export async function getProject(slug: string): Promise<PortfolioProps | null> {
  try {
    const escapedSlug = slug.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const query = `query {
      portfolioProjectCollection(where: { slug: "${escapedSlug}" }, limit: 1, preview: false) {
        items {
          ${PORTFOLIO_GRAPHQL_FIELDS}
        }
      }
    }`;

    const response = await fetchGraphQL(query, ['portfolioProjects', slug]);
    const collection = extractCollection(response);
    return collection.items[0] ?? null;
  } catch (error) {
    console.error('Error fetching portfolio project:', error);
    return null;
  }
}
