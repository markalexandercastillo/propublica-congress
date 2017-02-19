const {replace, when, verify, object, matchers: {
  anything,
  argThat
}} = require('testdouble');

require('chai').use(require('chai-as-promised')).should();

const ignoreExtraArgs = true;

describe('pro-publica-congress', () => {
  let clientModule, validators, createPpc;
  beforeEach(() => {
    clientModule = replace('./../src/client');
    validators = replace('./../src/validators');
    createPpc = require('./../src/index').create;

    // validation invocations pass by default
    when(validators.isValidCongress(), {ignoreExtraArgs}).thenReturn(true);
    when(validators.isValidChamber(), {ignoreExtraArgs}).thenReturn(true);
    when(validators.isValidType(), {ignoreExtraArgs}).thenReturn(true);
    when(validators.isValidBillId(), {ignoreExtraArgs}).thenReturn(true);
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
      when(client.get(), {ignoreExtraArgs}).thenResolve({});
      ppc = createPpc('SOME_KEY', 115);
    });

    describe('.getRecentBills()', () => {
      it('sets the default congress as the first element of the endpoint', () => {
        return ppc.getRecentBills('some_chamber', 'some_recent_bill_type')
          .then(() => verify(client.get(argThat(endpoint => endpoint.split('/')[0] === '115')), {ignoreExtraArgs}));
      });

      it('sets the given congress as the first element of the endpoint', () => {
        return ppc.getRecentBills('some_chamber', 'some_recent_bill_type', {congress: 114})
          .then(() => verify(client.get(argThat(endpoint => endpoint.split('/')[0] === '114')), {ignoreExtraArgs}));
      });

      it('sets the given chamber as the second element of the endpoint', () => {
        return ppc.getRecentBills('some_chamber', 'some_recent_bill_type')
          .then(() => verify(client.get(argThat(endpoint => endpoint.split('/')[1] === 'some_chamber')), {ignoreExtraArgs}));
      });

      it("sets 'bills' as the third element of the endpoint", () => {
        return ppc.getRecentBills('some_chamber', 'some_recent_bill_type')
          .then(() => verify(client.get(argThat(endpoint => endpoint.split('/')[2] === 'bills')), {ignoreExtraArgs}));
      });

      it('sets the given recent bill type as the fourth element of the endpoint', () => {
        return ppc.getRecentBills('some_chamber', 'some_recent_bill_type')
          .then(() => verify(client.get(argThat(endpoint => endpoint.split('/')[3] === 'some_recent_bill_type')), {ignoreExtraArgs}));
      });

      it('sets the offset to 0 by default', () => {
        return ppc.getRecentBills('some_chamber', 'some_recent_bill_type')
          .then(() => verify(client.get(anything(), 0)));
      });

      it('sets the given offset', () => {
        return ppc.getRecentBills('some_chamber', 'some_recent_bill_type', {offset: 20})
          .then(() => verify(client.get(anything(), 20)));
      });

      it('rejects with an invalid chamber', () => {
        when(validators.isValidChamber('some_chamber')).thenReturn(false);
        return ppc.getRecentBills('some_chamber', 'some_recent_bill_type').should.be.rejectedWith(Error, 'Received invalid chamber:');
      });

      it('rejects with an invalid congress', () => {
        when(validators.isValidCongress(114), {ignoreExtraArgs}).thenReturn(false);
        return ppc.getRecentBills('some_chamber', 'some_recent_bill_type', {congress: 114}).should.be.rejectedWith(Error, 'Received invalid congress:');
      });

      it('validates against the 105th congress as the earliest', () => {
        return ppc.getRecentBills('some_chamber', 'some_recent_bill_type')
          .then(() => verify(validators.isValidCongress(anything(), 105)));
      });

      it('validates against recent bill types', () => {
        return ppc.getRecentBills('some_chamber', 'some_recent_bill_type')
          .then(() => verify(validators.isValidType('some_recent_bill_type', new Set([
            'introduced',
            'updated',
            'passed',
            'major'
          ]))));
      });

      it('rejects with an invalid recent bill type', () => {
        when(validators.isValidType('some_recent_bill_type'), {ignoreExtraArgs}).thenReturn(false);
        return ppc.getRecentBills('some_chamber', 'some_recent_bill_type').should.be.rejectedWith(Error, 'Received invalid recent bill type:');
      });
    });

    describe('.getBill()', () => {
      it('sets the default congress as the first element of the endpoint', () => {
        return ppc.getBill('some_bill_id')
          .then(() => verify(client.get(argThat(endpoint => endpoint.split('/')[0] === '115')), {ignoreExtraArgs}));
      });

      it('sets the given congress as the first element of the endpoint', () => {
        return ppc.getBill('some_bill_id', {congress: 114})
          .then(() => verify(client.get(argThat(endpoint => endpoint.split('/')[0] === '114')), {ignoreExtraArgs}));
      });

      it("sets 'bills' as the second element of the endpoint", () => {
        return ppc.getBill('some_bill_id')
          .then(() => verify(client.get(argThat(endpoint => endpoint.split('/')[1] === 'bills')), {ignoreExtraArgs}));
      });

      it('sets the given bill ID as the third element of the endpoint', () => {
        return ppc.getBill('some_bill_id')
          .then(() => verify(client.get(argThat(endpoint => endpoint.split('/')[2] === 'some_bill_id')), {ignoreExtraArgs}));
      });

      it('rejects with an invalid congress', () => {
        when(validators.isValidCongress(114), {ignoreExtraArgs}).thenReturn(false);
        return ppc.getBill('some_bill_id', {congress: 114}).should.be.rejectedWith(Error, 'Received invalid congress:');
      });

      it('validates against the 105th congress as the earliest', () => {
        return ppc.getBill('some_bill_id')
          .then(() => verify(validators.isValidCongress(anything(), 105)));
      });

      it('rejects with an invalid bill ID', () => {
        when(validators.isValidBillId('some_bill_id')).thenReturn(false);
        return ppc.getBill('some_bill_id').should.be.rejectedWith(Error, 'Received invalid bill ID:');
      });
    });

    describe('.getAdditionalBillDetails()', () => {
      it('sets the default congress as the first element of the endpoint', () => {
        return ppc.getAdditionalBillDetails('some_bill_id', 'some_additional_bill_detail_type')
          .then(() => verify(client.get(argThat(endpoint => endpoint.split('/')[0] === '115')), {ignoreExtraArgs}));
      });

      it('sets the given congress as the first element of the endpoint', () => {
        return ppc.getAdditionalBillDetails('some_bill_id', 'some_additional_bill_detail_type', {congress: 114})
          .then(() => verify(client.get(argThat(endpoint => endpoint.split('/')[0] === '114')), {ignoreExtraArgs}));
      });

      it("sets 'bills' as the second element of the endpoint", () => {
        return ppc.getAdditionalBillDetails('some_bill_id', 'some_additional_bill_detail_type')
          .then(() => verify(client.get(argThat(endpoint => endpoint.split('/')[1] === 'bills')), {ignoreExtraArgs}));
      });

      it('sets the given bill ID as the third element of the endpoint', () => {
        return ppc.getAdditionalBillDetails('some_bill_id', 'some_additional_bill_detail_type')
          .then(() => verify(client.get(argThat(endpoint => endpoint.split('/')[2] === 'some_bill_id')), {ignoreExtraArgs}));
      });

      it('sets the given additional bill detail type as the fourth element of the endpoint', () => {
        return ppc.getAdditionalBillDetails('some_bill_id', 'some_additional_bill_detail_type')
          .then(() => verify(client.get(argThat(endpoint => endpoint.split('/')[3] === 'some_additional_bill_detail_type')), {ignoreExtraArgs}));
      });

      it('rejects with an invalid congress', () => {
        when(validators.isValidCongress(114), {ignoreExtraArgs}).thenReturn(false);
        return ppc.getAdditionalBillDetails('some_bill_id', 'some_additional_bill_detail_type', {congress: 114}).should.be.rejectedWith(Error, 'Received invalid congress:');
      });

      it('validates against the 105th congress as the earliest', () => {
        return ppc.getAdditionalBillDetails('some_bill_id', 'some_additional_bill_detail_type')
          .then(() => verify(validators.isValidCongress(anything(), 105)));
      });

      it('rejects with an invalid bill ID', () => {
        when(validators.isValidBillId('some_bill_id')).thenReturn(false);
        return ppc.getAdditionalBillDetails('some_bill_id', 'some_additional_bill_detail_type').should.be.rejectedWith(Error, 'Received invalid bill ID:');
      });

      it('validates against recent bill types', () => {
        return ppc.getAdditionalBillDetails('some_bill_id', 'some_additional_bill_detail_type')
          .then(() => verify(validators.isValidType('some_additional_bill_detail_type', new Set([
            'subjects',
            'amendments',
            'related',
            'cosponsors'
          ]))));
      });

      it('rejects with an invalid recent bill type', () => {
        when(validators.isValidType('some_additional_bill_detail_type'), {ignoreExtraArgs}).thenReturn(false);
        return ppc.getAdditionalBillDetails('some_bill_id', 'some_additional_bill_detail_type').should.be.rejectedWith(Error, 'Received invalid additional bill detail type:');
      });

      it('sets the offset to 0 by default', () => {
        return ppc.getAdditionalBillDetails('some_bill_id', 'some_additional_bill_detail_type')
          .then(() => verify(client.get(anything(), 0)));
      });

      it('sets the given offset', () => {
        return ppc.getAdditionalBillDetails('some_bill_id', 'some_additional_bill_detail_type', {offset: 20})
          .then(() => verify(client.get(anything(), 20)));
      });
    })
  });
});

