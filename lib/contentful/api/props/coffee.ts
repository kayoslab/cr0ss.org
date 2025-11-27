export interface CoffeeyProps {
    sys: {
        id: string
    };
    slug: string;
    name: string;
    roaster: string;
    url?: string | null;
    photo?: {
      url: string;
      title?: string;
      description?: string;
    } | null;
    farmer?: string | null;
    farm?: string | null;
    process?: string | null;
    region?: string | null;
    variety?: string | null;
    scaScore?: number | null;
    brewingRecipe?: string | null;
    decaffeinated?: boolean | null;
    tastingNotes?: string[] | null;
    country?: {
      sys: { id: string }
      name: string
    } | null;
}
  
  // Set a variable that contains all the fields needed for coffee when a fetch for content is performed
  export const COFFEE_GRAPHQL_FIELDS = `
    sys {
      id
    }
    slug
    name
    roaster
    url
    photo {
      url
      title
      description
    }
    farmer
    farm
    process
    region
    variety
    scaScore
    brewingRecipe
    decaffeinated
    tastingNotes
    country {
        sys {
            id
        }
        name
    }
  `;