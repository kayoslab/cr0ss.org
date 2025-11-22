import { fetchGraphQL } from './api';
import { KNOWLEDGE_BASE_GRAPHQL_FIELDS, type KnowledgeBaseProps, type KnowledgeBaseCategory } from './props/knowledge-base';

export async function getAllKnowledgeBase(): Promise<KnowledgeBaseProps[]> {
  const result = await fetchGraphQL(
    `query {
      knowledgeBaseCollection(order: order_ASC, preview: false) {
        items {
          ${KNOWLEDGE_BASE_GRAPHQL_FIELDS}
        }
      }
    }`,
    ['knowledgeBase']
  );

  return result.data?.knowledgeBaseCollection?.items ?? [];
}

export async function getKnowledgeBaseBySlug(slug: string): Promise<KnowledgeBaseProps | null> {
  const result = await fetchGraphQL(
    `query {
      knowledgeBaseCollection(where: { slug: "${slug}" }, limit: 1, preview: false) {
        items {
          ${KNOWLEDGE_BASE_GRAPHQL_FIELDS}
        }
      }
    }`,
    [`knowledgeBase-${slug}`]
  );

  return result.data?.knowledgeBaseCollection?.items?.[0] ?? null;
}

export async function getKnowledgeBaseByCategory(category: KnowledgeBaseCategory): Promise<KnowledgeBaseProps | null> {
  const result = await fetchGraphQL(
    `query {
      knowledgeBaseCollection(where: { category: "${category}" }, limit: 1, preview: false) {
        items {
          ${KNOWLEDGE_BASE_GRAPHQL_FIELDS}
        }
      }
    }`,
    [`knowledgeBase-category-${category}`]
  );

  return result.data?.knowledgeBaseCollection?.items?.[0] ?? null;
}
