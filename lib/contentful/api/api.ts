import { env } from '@/env';

export async function fetchGraphQL(
  query: string,
  tags: string[] = [''],
  revalidate: number | false = 3600 // Default: revalidate every hour (3600 seconds)
) {
  return fetch(
    `https://graphql.contentful.com/content/v1/spaces/${env.CONTENTFUL_SPACE_ID}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${
          env.CONTENTFUL_ACCESS_TOKEN
        }`,
      },
      body: JSON.stringify({ query }),
      next: { tags, revalidate },
    }
  ).then((response) =>
    response.json()
  );
}
