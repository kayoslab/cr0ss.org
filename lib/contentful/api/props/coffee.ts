export interface CoffeeyProps {
    sys: { 
        id: string 
    };
    name: string;
    roaster: string;
    process?: string | null;
    region?: string | null;
    variety?: string | null;
    decaffeinated?: boolean | null;
    tastingNotes?: string[] | null;
    country?: {
      sys: { id: string } 
      name: string
    } | null;
}
  
  // Set a variable that contains all the fields needed for blogs when a fetch for content is performed
  export const COFFEE_GRAPHQL_FIELDS = `
    sys { 
      id
    }
    name
    roaster
    process
    region
    variety
    decaffeinated
    tastingNotes
    country { 
        sys { 
            id 
        }
        name
    }
  `;