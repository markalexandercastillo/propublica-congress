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
      "sets .key to the given 'key' option",
      () => createClient({key: 'SOME_KEY'}).key.should.equal('SOME_KEY')
    );

    context('default properties', () => {
      it(
        "sets .version to '1'",
        () => createClient({key: 'SOME_KEY'}).version.should.equal('1')
      );

      it(
        "sets .host to 'https://api.propublica.org'",
        () => createClient({key: 'SOME_KEY'}).host.should.equal('https://api.propublica.org')
      );
    });

    it(
      "sets .host to the given 'host' option",
      () => createClient({
        key: 'SOME_KEY',
        host: 'https://somehost.org'
      }).host.should.equal('https://somehost.org')
    );

    it(
      "sets .version to the given 'version' option",
      () => createClient({
        key: 'SOME_KEY',
        version: '2'
      }).version.should.equal('2')
    );
  });

  describe('.get()', () => {
    let client;
    beforeEach(() => {
      client = createClient({
        key: 'SOME_KEY',
        version: '2',
        host: 'https://somehost.org'
      });

      td.when(http.get(), {ignoreExtraArgs: true})
        .thenResolve({body: {results: []}});
    });

    it("sets the 'X-API-Key' header with the given 'key' option", () => {
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

    it("performs the request to .host", () => {
      client.get('some/endpoint');
      td.verify(http.get(
        td.matchers.argThat(url => url.indexOf('https://somehost.org') === 0),
        td.matchers.anything()
      ));
    });


    it("performs the request with the first path element set to 'congress'", () => {
      client.get('some/endpoint');
      td.verify(http.get(
        td.matchers.argThat(url => {
          return URL.parse(url).path.substr(1).split('/')[0] === 'congress';
        }),
        td.matchers.anything()
      ));
    });

    it("performs the request with the first path element set to .version prefixed with 'v'", () => {
      client.get('some/endpoint');
      td.verify(http.get(
        td.matchers.argThat(url => {
          return URL.parse(url).path.substr(1).split('/')[1] === 'v2';
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
