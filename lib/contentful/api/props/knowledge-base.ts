export type KnowledgeBaseCategory =
  | 'about-me'
  | 'professional'
  | 'skills'
  | 'philosophy'
  | 'projects';

export interface KnowledgeBaseProps {
  sys: {
    id: string;
  };
  title: string;
  slug: string;
  category: KnowledgeBaseCategory;
  content: string;
  order: number;
}

export const KNOWLEDGE_BASE_GRAPHQL_FIELDS = `
  sys {
    id
  }
  title
  slug
  category
  content
  order
`;
