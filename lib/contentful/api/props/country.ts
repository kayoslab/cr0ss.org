export interface CountryProps {
  sys: {
    id: string;
  };
  id: string;
  name: string;
  data: {
    path: string;
  }
}

export const COUNTRY_GRAPHQL_FIELDS = `
  sys {
    id
    publishedAt
  }
  __typename
  id
  name
  data
`;