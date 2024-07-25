const management = require('contentful-management');
const spaceImport = require('contentful-import');
const exportFile = require('./export.json');
const countries = require('./countries.json');
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
//   .catch((e: any) => console.error(e));

const client = management.createClient({
  accessToken: CONTENTFUL_MANAGEMENT_TOKEN,
});

client.getSpace(CONTENTFUL_SPACE_ID).then((space: any) => {
  space.getEnvironment('master').then((environment: any) => {
    environment.getEntries({'content_type': 'country', 'limit': '1000'}).then(async (entries: any) => {

      // entries.items.forEach((entry: any) => {
      //   entry.unpublish();
      //   entry.delete();
      // });
      // return;
      var entryIds = entries.items.map((entry: any) => entry.fields.id['en-US']);
      var localCountries = countries.filter((country: any) => !entryIds.includes(country.id));

      console.log('Countries to create', localCountries.length);
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
              'en-US': visitedCountries.includes(country.id),
            },
            data: {
              'en-US': '{ "path": "' + country.d + '" }',
            }
          },
        })
        .then(async (entry: any) => {
          entry.publish()
          .then(() => {
            console.log('Country published', country.title);
          })
          .catch(() => {
            console.log('Country created', country.title);
            console.error
          });
        })
        .catch(async () => {
          console.error
        });
      });
    });
  });
});
