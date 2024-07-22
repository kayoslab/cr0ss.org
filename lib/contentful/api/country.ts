import { fetchGraphQL } from './api';
import { COUNTRY_GRAPHQL_FIELDS } from './props/country';

function extractCountries(fetchResponse: {
  data: { countryCollection: { items: any } };
}) {
  var items = fetchResponse?.data?.countryCollection?.items;
  return items
}

export async function getAllCountries() {
  const countries = await fetchGraphQL(
    `query {
      countryCollection(order: id_ASC, preview: false, limit: 1000) {
          items {
            ${COUNTRY_GRAPHQL_FIELDS}
          }
        }
      }`,
    ['countries']
  );

  return extractCountries(countries);
}

export async function getVisitedCountries(visited = true) {  
  const countries = await fetchGraphQL(
    `query {
      countryCollection(where:{visited: ${visited}}, order: id_ASC, preview: false, limit: 1000) {
          items {
            ${COUNTRY_GRAPHQL_FIELDS}
          }
        }
      }`,
    ['countries']
  );

  return extractCountries(countries);
}

export async function getCountry(id: string) {
  const country = await fetchGraphQL(
    `query {
      countryCollection(where:{id: "${id}"}, limit: 1, preview: false) {
          items {
            ${COUNTRY_GRAPHQL_FIELDS}
          }
        }
      }`,
    [id]
  );
  return extractCountries(country)[0];
}