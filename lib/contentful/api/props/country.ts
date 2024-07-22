export interface CountryProps {
  sys: {
    id: string;
  };
  id: string;
  name: string;
  visited: boolean;
  path: string;
}

export const COUNTRY_GRAPHQL_FIELDS = `
  sys {
    id
  }
  __typename
  id
  name
  visited
  path
`;