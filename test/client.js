const {replace, when, verify, matchers: {
  anything,
  contains,
  argThat
}} = require('testdouble')
  , URL = require('url');

require('chai').use(require('chai-as-promised')).should();

// aliases to verify and when with the ignoreExtraArgs config option set to true
const ignoringWhen = fakeInvocation => when(fakeInvocation, {ignoreExtraArgs: true});
const ignoringVerify = fakeInvocation => verify(fakeInvocation, {ignoreExtraArgs: true});

describe('client', () => {
  let http, createClient, validators;
  beforeEach(() => {
    http = replace('./../src/http');
    validators = replace('./../src/validators');
    createClient = require('./../src/client').create;

    // validation invocations pass by default
    ignoringWhen(validators.isValidOffset())
      .thenReturn(true);

    ignoringWhen(validators.isValidApiKey())
      .thenReturn(true);
  });

  describe('create()', () => {
    it(
      "sets .key to the given key",
      () => createClient('SOME_KEY').key.should.equal('SOME_KEY')
    );

    it('throws with an invalid key', () => {
      when(validators.isValidApiKey(anything()))
        .thenReturn(false);

      (() => createClient())
        .should.throw(Error, 'Received invalid API key:');
    });
  });

  describe('.get()', () => {
    let client;
    beforeEach(() => {
      client = createClient('SOME_KEY');

      ignoringWhen(http.get())
        .thenResolve({});
    });

    it("sets the 'X-API-Key' header with the given key", () => {
      return client.get('some/endpoint')
        .then(() => verify(http.get(
          anything(),
          contains({headers: {'X-API-Key': 'SOME_KEY'}})
        )));
    });

    it("expects a JSON response", () => {
      return client.get('some/endpoint')
        .then(() => verify(http.get(
          anything(),
          contains({json: true})
        )));
    });

    it("sets an offset from the second argument", () => {
      return client.get('some/endpoint', 20)
        .then(() => verify(http.get(
          anything(),
          contains({body: {offset: 20}})
        )));
    });

    it("performs the request to the ProPublica API host", () => {
      return client.get('some/endpoint')
        .then(() => ignoringVerify(http.get(
          argThat(url => url.indexOf('https://api.propublica.org') === 0)
        )));
    });

    it("performs the request to version 1 of ProPublica's Congres API", () => {
      return client.get('some/endpoint')
        .then(() => ignoringVerify(http.get(
          argThat(url => URL.parse(url).path.indexOf('/congress/v1/') === 0)
        )));
    });

    it("performs the request to the JSON variant of the endpoint", () => {
      return client.get('some/endpoint')
        .then(() => ignoringVerify(http.get(
          argThat(url => url.substr(-'some/endpoint.json'.length) === 'some/endpoint.json')
        )));
    });

    it('rejects if given an invalid offset value', () => {
      when(validators.isValidOffset('an invalid offset'))
        .thenReturn(false);

      return client.get('some/endpoint', 'an invalid offset')
        .should.be.rejectedWith(Error, 'Received invalid offset:');
    });
  });
});
