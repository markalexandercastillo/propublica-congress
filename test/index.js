const {replace, when} = require('testdouble');

require('chai').use(require('chai-as-promised')).should();

describe('pro-publica-congress', () => {
  let client, createPpc;
  beforeEach(() => {
    client = replace('./../src/client');
    createPpc = require('./../src/index').create;
  });

  describe('create()', () => {
    it("sets a 'congress' property to the given argument", () => createPpc('SOME_KEY', 115).congress.should.equal(115));

    it("sets a 'client' property to a client created with the given key argument", () => {
      const expectedClient = {};
      when(client.create('SOME_KEY')).thenReturn(expectedClient);
      createPpc('SOME_KEY', 115).client.should.equal(expectedClient);
    });
  });
});

