const algoliasearch = require('algoliasearch').liteClient;

const client = algoliasearch('IWRC4DU88U', 'd1a426a7fa5ac8f219208cdbc3aa1e77');

async function test() {
  try {
    const { results } = await client.search({
      requests: [
        {
          indexName: 'books',
          query: 'planet',
          hitsPerPage: 20,
          removeWordsIfNoResults: 'allOptional',
        },
      ],
    });
    const hits = results[0].hits;
    console.log("Total hits from Algolia:", hits.length);
    hits.forEach(h => console.log("- " + h.title));
  } catch (err) {
    console.error(err);
  }
}

test();
