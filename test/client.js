const {replace, when, verify, matchers: {
  anything,
  contains,
  argThat
}} = require('testdouble')
  , URL = require('url');

require('chai').use(require('chai-as-promised')).should();

const ignoreExtraArgs = true;

describe('client', () => {
  let http, createClient;
  beforeEach(() => {
    http = replace('./../src/http');
    createClient = require('./../src/client').create;
  });

  describe('create()', () => {
    it(
      "sets .key to the given key",
      () => createClient('SOME_KEY').key.should.equal('SOME_KEY')
    );

    it(
      'throws with an invalid key',
      () => (() => createClient()).should.throw(Error, 'Received invalid API key:')
    );
  });

  describe('.get()', () => {
    let client;
    beforeEach(() => {
      client = createClient('SOME_KEY');
      when(http.get(), {ignoreExtraArgs}).thenResolve({body: {results: ['']}});
    });

    it("sets the 'X-API-Key' header with the given key", () => {
      client.get('some/endpoint');
      verify(http.get(
        anything(),
        contains({headers: {'X-API-Key': 'SOME_KEY'}})
      ));
    });

    it("expects a JSON response", () => {
      client.get('some/endpoint');
      verify(http.get(
        anything(),
        contains({json: true})
      ));
    });

    it("sets an offset from the second argument", () => {
      client.get('some/endpoint', 20);
      verify(http.get(
        anything(),
        contains({body: {offset: 20}})
      ));
    });

    it("performs the request to the ProPublica API host", () => {
      client.get('some/endpoint');
      verify(http.get(
        argThat(url => url.indexOf('https://api.propublica.org') === 0),
        anything()
      ));
    });


    it("performs the request to version 1 of ProPublica's Congres API", () => {
      client.get('some/endpoint');
      verify(http.get(
        argThat(url => URL.parse(url).path.indexOf('/congress/v1/') === 0),
        anything()
      ));
    });

    it("performs the request to the JSON variant of the endpoint", () => {
      client.get('some/endpoint');
      verify(http.get(
        argThat(url => url.substr(-'some/endpoint.json'.length) === 'some/endpoint.json'),
        anything()
      ));
    });

    it("resolves to the first element of the 'results' key of the response body", () => {
      when(http.get(), {ignoreExtraArgs}).thenResolve({body: {results: ['relevantData']}});
      client.get('some/endpint').should.become('relevantData');
    });

    it("rejects if the response came back with an invalid response structure", () => {
      when(http.get(), {ignoreExtraArgs}).thenResolve('invalid response structure');
      client.get('some/endpoint').should.be.rejectedWith(Error, 'Received invalid response structure:');
    });

    it('rejects if given an invalid offset value', () => {
      client.get('some/endpoint', 'an invalid offset').should.be.rejectedWith(Error, 'Received invalid offset:');
    });
  });
});
