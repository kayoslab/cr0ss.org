/**
 * Provisions the `portfolioProject` content model in Contentful and seeds it
 * with the projects that previously lived hardcoded in app/projects/page.tsx.
 *
 * Run with:
 *   CONTENTFUL_SPACE_ID=XXX CONTENTFUL_MANAGEMENT_TOKEN=CFPAT-XXX pnpm setup:portfolio
 *
 * Idempotent: skips the content type and any entry slugs that already exist.
 */

import { createClient } from 'contentful-management';

const { CONTENTFUL_SPACE_ID, CONTENTFUL_MANAGEMENT_TOKEN, CONTENTFUL_ENVIRONMENT } =
  process.env;

if (!CONTENTFUL_SPACE_ID || !CONTENTFUL_MANAGEMENT_TOKEN) {
  throw new Error(
    [
      'Parameters missing...',
      'Run as follows:',
      'CONTENTFUL_SPACE_ID=XXX CONTENTFUL_MANAGEMENT_TOKEN=CFPAT-XXX pnpm setup:portfolio',
    ].join('\n')
  );
}

const CONTENT_TYPE_ID = 'portfolioProject';
const environmentId = CONTENTFUL_ENVIRONMENT || 'master';

const client = createClient(
  { accessToken: CONTENTFUL_MANAGEMENT_TOKEN },
  { type: 'plain', defaults: { spaceId: CONTENTFUL_SPACE_ID, environmentId } }
);

interface SeedProject {
  slug: string;
  title: string;
  summary: string;
  url: string;
  external: boolean;
  order: number;
}

const seedProjects: SeedProject[] = [
  {
    slug: 'signal-intelligence',
    title: 'Signal Intelligence',
    summary:
      'A browser-based self-audit that reveals what a device and browser expose before a user logs into any website.',
    url: 'https://signal.cr0ss.org',
    external: true,
    order: 1,
  },
  {
    slug: '404-museum',
    title: '404 Museum',
    summary:
      'Every page refresh reveals a fake abandoned website from an alternate internet timeline. Each generated website feels like something that genuinely could have existed.',
    url: 'https://404.cr0ss.org',
    external: true,
    order: 2,
  },
  {
    slug: 'latency-cathedral',
    title: 'Latency Cathedral',
    summary:
      'Uses live network timings (ping, resource load, packet jitter) to generate gothic structures in WebGL. Every network condition creates a different cathedral.',
    url: 'https://latency.cr0ss.org',
    external: true,
    order: 3,
  },
  {
    slug: 'eavi',
    title: 'EAVI',
    summary:
      'An ephemeral audiovisual installation in the browser. Each visit becomes a one-off composition shaped by your environment, time and motion — then disappears, leaving no trace.',
    url: 'https://eavi.cr0ss.org',
    external: true,
    order: 4,
  },
  {
    slug: 'migration-readiness-assessment',
    title: 'Migration Readiness Assessment',
    summary:
      'A diagnostic framework for engineering leaders and CTOs to evaluate whether their organisation is ready for platform modernisation. It surfaces misalignments across six readiness domains using statistical validation and NLP-driven qualitative analysis.',
    url: 'https://github.com/kayoslab/Migration-Readiness-Assessment',
    external: true,
    order: 5,
  },
  {
    slug: 'dashboard',
    title: 'Dashboard',
    summary:
      'A quantified-self dashboard that tracks daily habits, coffee and caffeine metabolism, workouts, running stats, and travel across countries — with an insights engine that discovers statistical correlations between metrics.',
    url: '/dashboard',
    external: false,
    order: 6,
  },
  {
    slug: 'coffee',
    title: 'Coffee',
    summary:
      'A curated journal of specialty coffees documenting origin, roaster, processing method, variety, tasting notes, SCA scores, and brewing recipes — each with an interactive map pinpointing where the beans were grown.',
    url: '/coffee',
    external: false,
    order: 7,
  },
];

async function ensureContentType() {
  try {
    await client.contentType.get({ contentTypeId: CONTENT_TYPE_ID });
    console.log(`ℹ️  Content type '${CONTENT_TYPE_ID}' already exists — skipping.`);
    return;
  } catch {
    // Not found — create it below.
  }

  console.log(`Creating content type '${CONTENT_TYPE_ID}'...`);
  await client.contentType.createWithId(
    { contentTypeId: CONTENT_TYPE_ID },
    {
      name: 'Portfolio Project',
      description: 'A project shown on the /portfolio page.',
      displayField: 'title',
      fields: [
        { id: 'title', name: 'Title', type: 'Symbol', required: true, localized: false },
        {
          id: 'slug',
          name: 'Slug',
          type: 'Symbol',
          required: true,
          localized: false,
          validations: [{ unique: true }],
        },
        { id: 'summary', name: 'Summary', type: 'Text', required: true, localized: false },
        {
          id: 'description',
          name: 'Description',
          type: 'RichText',
          required: false,
          localized: false,
        },
        { id: 'url', name: 'URL', type: 'Symbol', required: false, localized: false },
        {
          id: 'external',
          name: 'External',
          type: 'Boolean',
          required: false,
          localized: false,
        },
        { id: 'order', name: 'Order', type: 'Integer', required: false, localized: false },
        {
          id: 'heroImage',
          name: 'Hero Image',
          type: 'Link',
          linkType: 'Asset',
          required: false,
          localized: false,
        },
      ],
    }
  );

  const created = await client.contentType.get({ contentTypeId: CONTENT_TYPE_ID });
  await client.contentType.publish({ contentTypeId: CONTENT_TYPE_ID }, created);
  console.log(`✅ Content type '${CONTENT_TYPE_ID}' created and published.`);
}

async function seedEntries() {
  const existing = await client.entry.getMany({
    query: { content_type: CONTENT_TYPE_ID, limit: 1000 },
  });
  const existingSlugs = new Set(
    existing.items
      .map((e) => (e.fields.slug as { 'en-US'?: string } | undefined)?.['en-US'])
      .filter(Boolean)
  );

  for (const project of seedProjects) {
    if (existingSlugs.has(project.slug)) {
      console.log(`ℹ️  Entry '${project.slug}' already exists — skipping.`);
      continue;
    }
    try {
      const entry = await client.entry.create(
        { contentTypeId: CONTENT_TYPE_ID },
        {
          fields: {
            title: { 'en-US': project.title },
            slug: { 'en-US': project.slug },
            summary: { 'en-US': project.summary },
            url: { 'en-US': project.url },
            external: { 'en-US': project.external },
            order: { 'en-US': project.order },
          },
        }
      );
      await client.entry.publish({ entryId: entry.sys.id }, entry);
      console.log(`✅ Published '${project.slug}'.`);
    } catch (error) {
      console.error(`❌ Failed to seed '${project.slug}':`, error);
    }
  }
}

async function main() {
  await ensureContentType();
  await seedEntries();
  console.log('\n🎉 Portfolio content model is ready.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
