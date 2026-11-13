import { checkBotId } from 'botid/server';

/**
 * BotID verdict for the current request. The routes it guards are also rate
 * limited, so it fails open: off Vercel (CI's `pnpm start`) there is no OIDC
 * token to verify with, and a BotID outage shouldn't take search down.
 * Each guarded path must also be listed in instrumentation-client.ts, or the
 * browser never attaches the challenge and every visitor reads as a bot.
 */
export async function isBot(): Promise<boolean> {
  if (!process.env.VERCEL) return false;
  try {
    return (await checkBotId()).isBot;
  } catch (error) {
    console.error('BotID check failed; letting the request through:', error);
    return false;
  }
}
