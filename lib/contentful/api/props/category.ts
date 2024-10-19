export interface CategoryProps {
    sys: {
      id: string;
    };
    slug: string;
    title: string;
  }
  
  // Set a variable that contains all the fields needed for blogs when a fetch for content is performed
  export const CATEGORY_GRAPHQL_FIELDS = `
    sys {
      id
    }
    __typename
    title
    slug
  `;