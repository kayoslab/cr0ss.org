const management = require('contentful-management');
const spaceImport = require('contentful-import');
const exportFile = require('./export.json');
const countries = require('./countries.json');

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
//   .catch((e: any) => console.error(e));

const client = management.createClient({
  accessToken: CONTENTFUL_MANAGEMENT_TOKEN,
});

client.getSpace(CONTENTFUL_SPACE_ID).then((space: any) => {
  space.getEnvironment('master').then((environment: any) => {
    environment.getEntries().then((entries: any) => {
      var entryIds = entries.items.map((entry: any) => entry.fields.id['en-US']);
      var localCountries = countries.filter((country: any) => !entryIds.includes(country.id));

      localCountries.forEach(async (country: any) => {
        if (!country.id || !country.title || !country.d) {
          console.error('Invalid country data', country);
          return;
        }
  
        if (entryIds.includes(country.id)) {
          console.log('Country already exists', country.title);
          return
        }
  
        environment.createEntry('country', {
          fields: {
            id: {
              'en-US': country.id,
            },
            name: {
              'en-US': country.title,
            },
            visited: {
              'en-US': false,
            },
            path: {
              'en-US': country.d,
            },
          },
        })
        .then(async (entry: any) => {
          console.log('Country created', country.title);
          // entry.publish();
        })
        .catch(async () => {
          console.error
        });
      });
    });
  });
});
