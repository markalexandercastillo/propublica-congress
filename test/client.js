const td = require('testdouble')
  , URL = require('url')
  , chai = require('chai');

chai.use(require('chai-as-promised')).should();

describe('client', () => {
  let http, createClient;
  beforeEach(() => {
    http = td.replace('./../src/http');
    createClient = require('./../src/client').create;
  });

  describe('create()', () => {
    it(
      "sets .key to the given key",
      () => createClient('SOME_KEY').key.should.equal('SOME_KEY')
    );
  });

  describe('.get()', () => {
    let client;
    beforeEach(() => {
      client = createClient('SOME_KEY');

      td.when(http.get(), {ignoreExtraArgs: true})
        .thenResolve({body: {results: []}});
    });

    it("sets the 'X-API-Key' header with the given key", () => {
      client.get('some/endpoint');
      td.verify(http.get(td.matchers.anything(), td.matchers.contains({
        headers: {'X-API-Key': 'SOME_KEY'}
      })));
    });

    it("expects a JSON response", () => {
      client.get('some/endpoint');
      td.verify(http.get(td.matchers.anything(), td.matchers.contains({
        json: true
      })));
    });

    it("sets an offset from the second argument", () => {
      client.get('some/endpoint', 20);
      td.verify(http.get(td.matchers.anything(), td.matchers.contains({
        body: {offset: 20}
      })));
    });

    it("performs the request to the ProPublica API host", () => {
      client.get('some/endpoint');
      td.verify(http.get(
        td.matchers.argThat(url => url.indexOf('https://api.propublica.org') === 0),
        td.matchers.anything()
      ));
    });


    it("performs the request to version 1 of ProPublica's Congres API", () => {
      client.get('some/endpoint');
      td.verify(http.get(
        td.matchers.argThat(url => {
          return URL.parse(url).path.indexOf('/congress/v1/') === 0;
        }),
        td.matchers.anything()
      ));
    });

    it("performs the request to the JSON variant of the endpoint", () => {
      client.get('some/endpoint');
      td.verify(http.get(
        td.matchers.argThat(url => {
          return url.substr(-'some/endpoint.json'.length) === 'some/endpoint.json';
        }),
        td.matchers.anything()
      ));
    });

    it("resolves to the first element of the 'results' key of the response body", () => {
      td.when(http.get(), {ignoreExtraArgs: true})
        .thenResolve({body: {results: ['relevantData']}});

      client.get('some/endpint').should.eventually.equal('relevantData');
    });
  });
});
