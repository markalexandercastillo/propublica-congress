const {replace, when, matchers: {anything}} = require('testdouble');

require('chai').use(require('chai-as-promised')).should();

describe('pro-publica-congress', () => {
  let client, validators, createPpc;
  beforeEach(() => {
    client = replace('./../src/client');
    validators = replace('./../src/validators');
    createPpc = require('./../src/index').create;
    when(validators.isValidCongress(anything())).thenReturn(true);
  });

  describe('create()', () => {
    it("sets a 'congress' property to the given argument", () => createPpc('SOME_KEY', 115).congress.should.equal(115));

    it('throws with an invalid congress', () => {
      when(validators.isValidCongress(116)).thenReturn(false);
      (() => createPpc('SOME_KEY', 116)).should.throw(Error, 'Received invalid congress:');
    });

    it("sets a 'client' property to a client created with the given key argument", () => {
      const expectedClient = {};
      when(client.create('SOME_KEY')).thenReturn(expectedClient);
      createPpc('SOME_KEY', 115).client.should.equal(expectedClient);
    });
  });
});

