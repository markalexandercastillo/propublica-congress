const {replace, when, verify, object, matchers: {
  anything,
  argThat
}} = require('testdouble');

require('chai').use(require('chai-as-promised')).should();

describe('pro-publica-congress', () => {
  let clientModule, validators, createPpc;
  beforeEach(() => {
    clientModule = replace('./../src/client');
    validators = replace('./../src/validators');
    createPpc = require('./../src/index').create;

    // validation invocations pass by default
    when(validators.isValidCongress(anything())).thenReturn(true);
    when(validators.isValidChamber(anything())).thenReturn(true);
    when(validators.isValidType(anything(), anything())).thenReturn(true);
  });

  describe('create()', () => {
    it("sets a 'congress' property to the given argument", () => createPpc('SOME_KEY', 115).congress.should.equal(115));

    it('throws with an invalid congress', () => {
      when(validators.isValidCongress(116)).thenReturn(false);
      (() => createPpc('SOME_KEY', 116)).should.throw(Error, 'Received invalid congress:');
    });

    it("sets a 'client' property to a client created with the given key argument", () => {
      const expectedClient = {};
      when(clientModule.create('SOME_KEY')).thenReturn(expectedClient);
      createPpc('SOME_KEY', 115).client.should.equal(expectedClient);
    });
  });

  describe('instance methods', () => {
    let ppc, client;
    beforeEach(() => {
      client = object(['get']);
      when(clientModule.create(anything())).thenReturn(client);
      ppc = createPpc('SOME_KEY', 115);
    });

    describe('.getRecentBills()', () => {
      it('sets the default congress as the first element of the endpoint', () => {
        ppc.getRecentBills('some_chamber', 'some_recent_bill_type');
        verify(client.get(argThat(endpoint => endpoint.split('/')[0] === '115'), anything()));
      });

      it('sets the given congress as the first element of the endpoint', () => {
        ppc.getRecentBills('some_chamber', 'some_recent_bill_type', {congress: 114});
        verify(client.get(argThat(endpoint => endpoint.split('/')[0] === '114'), anything()));
      });

      it('sets the given chamber as the second element of the endpoint', () => {
        ppc.getRecentBills('some_chamber', 'some_recent_bill_type');
        verify(client.get(argThat(endpoint => endpoint.split('/')[1] === 'some_chamber'), anything()));
      });

      it("sets 'bills' as the third element of the endpoint", () => {
        ppc.getRecentBills('some_chamber', 'some_recent_bill_type');
        verify(client.get(argThat(endpoint => endpoint.split('/')[2] === 'bills'), anything()));
      });

      it('sets the given recent bill type as the fourth element of the endpoint', () => {
        ppc.getRecentBills('some_chamber', 'some_recent_bill_type');
        verify(client.get(argThat(endpoint => endpoint.split('/')[3] === 'some_recent_bill_type'), anything()));
      });

      it('sets the offset to 0 by default', () => {
        ppc.getRecentBills('some_chamber', 'some_recent_bill_type');
        verify(client.get(anything(), 0));
      });

      it('sets the given offset', () => {
        ppc.getRecentBills('some_chamber', 'some_recent_bill_type', {offset: 20});
        verify(client.get(anything(), 20));
      });

      it('rejects with an invalid chamber', () => {
        when(validators.isValidChamber('some_chamber')).thenReturn(false);
        ppc.getRecentBills('some_chamber', 'some_recent_bill_type').should.be.rejectedWith(Error, 'Received invalid chamber:');
      });

      it('rejects with an invalid congress', () => {
        when(validators.isValidCongress(114)).thenReturn(false);
        ppc.getRecentBills('some_chamber', 'some_recent_bill_type', {congress: 114}).should.be.rejectedWith(Error, 'Received invalid congress:');
      });

      it('validates against recent bill types', () => {
        ppc.getRecentBills('some_chamber', 'some_recent_bill_type');
        verify(validators.isValidType('some_recent_bill_type', new Set([
          'introduced',
          'updated',
          'passed',
          'major'
        ])));
      });

      it('rejects with an invalid recent bill type', () => {
        when(validators.isValidType('some_recent_bill_type', anything())).thenReturn(false);
        ppc.getRecentBills('some_chamber', 'some_recent_bill_type').should.be.rejectedWith(Error, 'Received invalid recent bill type:');
      });
    });
  });
});

