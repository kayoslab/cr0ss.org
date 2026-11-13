import { initBotId } from 'botid/client/core';

// The public endpoints that spend Algolia quota. Each one also calls isBot()
// (lib/rate/bot.ts) server-side; the two lists must stay in sync.
initBotId({
  protect: [
    { path: '/api/algolia/search', method: 'GET' },
    { path: '/api/algolia/analytics', method: 'POST' },
  ],
});
