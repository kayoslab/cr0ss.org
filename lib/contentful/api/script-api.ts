/**
 * Contentful API functions for Node.js scripts
 * Does not use Next.js-specific caching
 */

/**
 * Fetch GraphQL from Contentful (script-friendly version)
 * Does not use Next.js caching features
 */
export async function fetchGraphQLForScript(query: string) {
  const CONTENTFUL_SPACE_ID = process.env.CONTENTFUL_SPACE_ID;
  const CONTENTFUL_ACCESS_TOKEN = process.env.CONTENTFUL_ACCESS_TOKEN;

  if (!CONTENTFUL_SPACE_ID || !CONTENTFUL_ACCESS_TOKEN) {
    throw new Error("Contentful environment variables not set");
  }

  const response = await fetch(
    `https://graphql.contentful.com/content/v1/spaces/${CONTENTFUL_SPACE_ID}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${CONTENTFUL_ACCESS_TOKEN}`,
      },
      body: JSON.stringify({ query }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("Contentful API error response:", JSON.stringify(data, null, 2));
    throw new Error(`Contentful API error: ${response.status} ${response.statusText}`);
  }

  if (data.errors) {
    console.error("GraphQL errors:", JSON.stringify(data.errors, null, 2));
    throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
  }

  return data;
}
