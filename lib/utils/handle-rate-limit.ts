export async function handleRateLimit(response: Response) {
  if (response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    throw new Error(`Rate limit exceeded. Try again in ${retryAfter || 'a few'} seconds.`);
  }
} 