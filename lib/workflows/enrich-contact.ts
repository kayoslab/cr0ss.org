import { sleep, FatalError } from 'workflow';
import { generateEmbedding } from '@/lib/ai/embeddings';
import {
  getContactById,
  insertContactEmbedding,
  setContactStatus,
} from '@/lib/db/contacts';
import { ZProfileMetadata } from '@/lib/db/models';

// Steps read process.env directly: this file is bundled by the workflow
// compiler and must stay free of module-level side effects like env validation.
const APIFY_BASE = 'https://api.apify.com/v2';
const MAX_POLLS = 40; // 40 × 15s ≈ 10 minutes

/** Coerce an unknown JSON value to a trimmed string, or undefined. */
function str(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim().length > 0) return value.trim();
  return undefined;
}

/**
 * Kick off an Apify actor run for a captured contact.
 * Returns the Apify run id, or null when enrichment is not configured.
 */
async function startApifyRun(contactId: string): Promise<string | null> {
  'use step';
  const token = process.env.APIFY_TOKEN;
  const actorId = process.env.APIFY_ACTOR_ID;
  if (!token || !actorId) {
    // Enrichment not configured — leave the seed for manual handling.
    await setContactStatus(contactId, 'failed');
    return null;
  }

  const contact = await getContactById(contactId);
  if (!contact) throw new FatalError(`Contact ${contactId} not found`);

  // Input for harvestapi/linkedin-profile-scraper: `queries` accepts LinkedIn
  // profile URLs or public identifiers. The company anchor has no URL, so a
  // profile scraper can't resolve it — swap in a search actor for that path.
  const input = {
    queries: [
      contact.anchorType === 'linkedin'
        ? contact.anchorValue
        : `${contact.name} ${contact.anchorValue}`,
    ],
  };

  // Apify REST uses `username~actorName`; accept the `username/actorName` form too.
  const actorPath = actorId.trim().replace('/', '~');

  const res = await fetch(
    `${APIFY_BASE}/acts/${actorPath}/runs?token=${token}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }
  );
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new FatalError(`Apify run start failed: ${res.status} ${body.slice(0, 300)}`);
  }
  const json = (await res.json()) as { data?: { id?: string } };
  const runId = json.data?.id;
  if (!runId) throw new FatalError('Apify run id missing in response');

  await setContactStatus(contactId, 'enriching', { apifyRunId: runId });
  return runId;
}

/** Poll a single Apify run's status. */
async function getApifyRunStatus(runId: string): Promise<string> {
  'use step';
  const token = process.env.APIFY_TOKEN;
  const res = await fetch(`${APIFY_BASE}/actor-runs/${runId}?token=${token}`);
  if (!res.ok) throw new FatalError(`Apify status check failed: ${res.status}`);
  const json = (await res.json()) as { data?: { status?: string } };
  return json.data?.status ?? 'UNKNOWN';
}

/**
 * Fetch the enriched profile, build a searchable text blob, embed it, and
 * store the vector. Marks the contact enriched on success.
 */
async function buildAndEmbed(contactId: string, runId: string): Promise<void> {
  'use step';
  const token = process.env.APIFY_TOKEN;
  const contact = await getContactById(contactId);
  if (!contact) throw new FatalError(`Contact ${contactId} not found`);

  const res = await fetch(
    `${APIFY_BASE}/actor-runs/${runId}/dataset/items?token=${token}&limit=1`
  );
  if (!res.ok) throw new FatalError(`Apify dataset fetch failed: ${res.status}`);
  const items = (await res.json()) as Array<Record<string, unknown>>;
  const raw = items[0] ?? {};

  // An actor can "succeed" but return an error item (e.g. Apify plan limits) or
  // no usable data. Don't pollute the contact memory — mark it failed instead.
  const actorError = str(raw.error);
  const hasProfileData =
    str(raw.fullName) ||
    str(raw.name) ||
    str(raw.firstName) ||
    str(raw.headline) ||
    str(raw.companyName) ||
    str(raw.jobTitle);
  if (actorError || !hasProfileData) {
    await setContactStatus(contactId, 'failed');
    console.error(
      `Enrichment produced no usable profile for ${contactId}: ${actorError ?? 'empty result'}`
    );
    return;
  }

  // Extract across common actor shapes. harvestapi: firstName/lastName,
  // location.linkedinText, currentPosition[]/experience[]; flatter actors expose
  // fullName/companyName/jobTitle directly — the fallbacks cover both.
  const loc = (raw.location ?? {}) as { linkedinText?: unknown };
  const positions = (
    Array.isArray(raw.currentPosition)
      ? raw.currentPosition
      : Array.isArray(raw.experience)
        ? raw.experience
        : []
  ) as Array<Record<string, unknown>>;
  const cur = positions[0] ?? {};
  const emails = Array.isArray(raw.emails) ? raw.emails : [];
  const fullName =
    [str(raw.firstName), str(raw.lastName)].filter(Boolean).join(' ') ||
    str(raw.fullName) ||
    str(raw.name);
  const about = str(raw.about);

  const profile = ZProfileMetadata.parse({
    name: fullName || contact.name,
    headline: str(raw.headline),
    company: str(cur.companyName) ?? str(raw.companyName) ?? str(raw.company),
    role: str(cur.position) ?? str(raw.jobTitle) ?? str(raw.title),
    location: str(loc.linkedinText) ?? str(raw.location) ?? str(raw.addressWithCountry),
    linkedinUrl:
      str(raw.linkedinUrl) ??
      str(raw.profileUrl) ??
      (contact.anchorType === 'linkedin' ? contact.anchorValue : undefined),
    email: str(emails[0]) ?? str(raw.email),
    about,
    metAt: contact.campaignId ?? str(raw.metAt),
  });

  // Mash the useful fields into one blob — this is what becomes searchable.
  const blob = [
    profile.name,
    profile.headline,
    profile.company && `Company: ${profile.company}`,
    profile.role && `Role: ${profile.role}`,
    profile.location && `Location: ${profile.location}`,
    about && `About: ${about.slice(0, 400)}`,
    `Met via ${contact.anchorType}: ${contact.anchorValue}`,
    contact.campaignId && `Met at: ${contact.campaignId}`,
    contact.message && `Note: ${contact.message}`,
  ]
    .filter(Boolean)
    .join('. ');

  const embedding = await generateEmbedding(blob);
  await insertContactEmbedding(contactId, blob, embedding, profile);
  await setContactStatus(contactId, 'enriched');
}

/** Mark a contact as failed when enrichment can't complete. */
async function markFailed(contactId: string): Promise<void> {
  'use step';
  await setContactStatus(contactId, 'failed');
}

/**
 * Durable enrichment pipeline: start the Apify actor, poll until it finishes,
 * then embed the profile into the contact-memory store. Survives restarts and
 * retries each step independently.
 */
export async function enrichContactWorkflow(contactId: string) {
  'use workflow';

  const runId = await startApifyRun(contactId);
  if (!runId) return; // Not configured — already marked failed.

  let finalStatus = 'RUNNING';
  for (let i = 0; i < MAX_POLLS; i++) {
    await sleep('15s');
    const status = await getApifyRunStatus(runId);
    if (status === 'SUCCEEDED') {
      finalStatus = status;
      break;
    }
    if (status === 'FAILED' || status === 'TIMED-OUT' || status === 'ABORTED') {
      finalStatus = status;
      break;
    }
  }

  if (finalStatus !== 'SUCCEEDED') {
    await markFailed(contactId);
    return;
  }

  await buildAndEmbed(contactId, runId);
}
