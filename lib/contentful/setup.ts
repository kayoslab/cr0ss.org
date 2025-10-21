import * as management from 'contentful-management';
import countries from './countries.json';
const visitedCountries = ["DE", "AT", "IT", "ES", "FR", "PT", "HR", "FI", "GB", "EG", "TH", "US", "LU", "BE", "NL", "PL", "MT", "GR", "GP"];
const { CONTENTFUL_SPACE_ID, CONTENTFUL_MANAGEMENT_TOKEN } = process.env;

if (!CONTENTFUL_SPACE_ID || !CONTENTFUL_MANAGEMENT_TOKEN) {
  throw new Error(
    [
      'Parameters missing...',
      'Please run the setup command as follows',
      'CONTENTFUL_SPACE_ID=XXX CONTENTFUL_MANAGEMENT_TOKEN=CFPAT-XXX npm run setup',
    ].join('\n')
  );
}

// spaceImport({
//   spaceId: CONTENTFUL_SPACE_ID,
//   managementToken: CONTENTFUL_MANAGEMENT_TOKEN,
//   content: exportFile,
// })
//   .then(() => console.log('The content model of your space is set up!'))
//   .catch((e: unknown) => console.error(e));

interface ContentfulClient {
  getSpace: (spaceId: string) => Promise<ContentfulSpace>;
}

interface ContentfulSpace {
  getEnvironment: (env: string) => Promise<ContentfulEnvironment>;
}

interface ContentfulEntry {
  fields: {
    id: { 'en-US': string };
    [key: string]: unknown;
  };
  publish: () => Promise<void>;
  [key: string]: unknown;
}

interface ContentfulEntries {
  items: ContentfulEntry[];
}

interface ContentfulEnvironment {
  getEntries: (options: { content_type: string; limit: string }) => Promise<ContentfulEntries>;
  createEntry: (contentType: string, fields: unknown) => Promise<ContentfulEntry>;
}

interface CountryData {
  id: string;
  title: string;
  d: string;
}

const client = management.createClient({
  accessToken: CONTENTFUL_MANAGEMENT_TOKEN,
}) as ContentfulClient;

client.getSpace(CONTENTFUL_SPACE_ID).then((space) => {
  space.getEnvironment('master').then((environment) => {
    environment.getEntries({'content_type': 'country', 'limit': '1000'}).then(async (entries) => {

      // entries.items.forEach((entry) => {
      //   entry.unpublish();
      //   entry.delete();
      // });
      // return;
      const entryIds = entries.items.map((entry) => entry.fields.id['en-US']);
      const localCountries = (countries as CountryData[]).filter((country) => !entryIds.includes(country.id));

      for (const country of localCountries) {
        if (!country.id || !country.title || !country.d) {
          continue;
        }

        if (entryIds.includes(country.id)) {
          continue;
        }

        try {
          const entry = await environment.createEntry('country', {
            fields: {
              id: {
                'en-US': country.id,
              },
              name: {
                'en-US': country.title,
              },
              visited: {
                'en-US': visitedCountries.includes(country.id),
              },
              data: {
                'en-US': '{ "path": "' + country.d + '" }',
              }
            },
          });

          try {
            await entry.publish();
            console.log('Country published', country.title);
          } catch (publishError) {
            console.log('Country created but not published', country.title);
            console.error('Publish error:', publishError);
          }
        } catch (createError) {
          console.error('Failed to create country', country.title, createError);
        }
      }
    });
  });
});
