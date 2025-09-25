import { fetchGraphQL } from './api';
import { COFFEE_GRAPHQL_FIELDS } from './props/coffee';

interface CoffeeCollection {
  items: any[];
  total: number;
  skip: number;
  limit: number;
}

function extractCoffeeCollection(fetchResponse: any): CoffeeCollection {

  if (!fetchResponse?.data?.coffeeCollection) {
    // Return empty collection if no data
    return {
      items: [],
      total: 0,
      skip: 0,
      limit: 0
    };
  }
  return fetchResponse.data.coffeeCollection;
}

export async function getAllCoffee(page = 1, limit = 9) {
  try {
    const query = `query {
      coffeeCollection(
        order: sys_firstPublishedAt_DESC, 
        limit: ${limit}, 
        skip: ${(page - 1) * limit}, 
        preview: false
      ) {
        total
        skip
        limit
        items {
          ${COFFEE_GRAPHQL_FIELDS}
        }
      }
    }`;
    
    const coffees = await fetchGraphQL(query, ['coffee']);
    if (!coffees?.data?.coffeeCollection) {
      throw new Error('Invalid response structure');
    }

    const collection = extractCoffeeCollection(coffees);
    
    return collection;
  } catch (error) {
    console.error('Error fetching coffees:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
    // Return empty collection on error
    return {
      items: [],
      total: 0,
      skip: 0,
      limit: limit
    };
  }
}

export async function getCoffees(coffeeIds: [string]) {
  try {    
    const ids = (coffeeIds ?? []).map(id => `"${id}"`).join(",");
    
    const query = `query {
      coffeeCollection(
        where: {
          sys: {
            id_in: [${ids}]
          }
        }
        order: sys_firstPublishedAt_DESC, 
        skip: 0,
        preview: false
      ) {
        total
        skip
        limit
        items {
          ${COFFEE_GRAPHQL_FIELDS}
        }
      }
    }`;
    const response = await fetchGraphQL(query, coffeeIds);

    if (!response?.data?.coffeeCollection) {
      throw new Error('Invalid response structure');
    }

    const collection = extractCoffeeCollection(response);
    
    return collection;
  } catch (error) {
    console.error('Error fetching coffee:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
    throw error;
  }
}

export async function getCoffee(id: string) {
  try {    
    const query = `query {
      coffeeCollection(where: { sys_id: "${id}" }, limit: 1, preview: false) {
        total
        items {
          ${COFFEE_GRAPHQL_FIELDS}
        }
      }
    }`;

    const response = await fetchGraphQL(query, [id]);
    if (!response?.data?.coffeeCollection) {
      throw new Error('Invalid response structure');
    }

    const collection = extractCoffeeCollection(response);
    const coffee = collection.items[0];
    if (!coffee) {
      throw new Error(`Coffee with id ${id} not found`);
    }
    
    return coffee;
  } catch (error) {
    console.error('Error fetching coffee:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
    }
    throw error;
  }
}