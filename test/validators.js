const chai = require('chai')
  , validators = require('./../src/validators');

chai.should();

describe('validators', () => {
  describe('isValidOffset()', () => {
    it('accepts a multiples of 20', () => {
      validators.isValidOffset(40).should.be.true;
      validators.isValidOffset(20).should.be.true;
      validators.isValidOffset(60).should.be.true;
    });

    it('accepts non-multiples of 20', () => {
      validators.isValidOffset(2).should.be.false;
      validators.isValidOffset(38).should.be.false;
    });

    it('accepts 0', () => {
      validators.isValidOffset(0).should.be.true;
    });

    it('rejects no argument', () => validators.isValidOffset().should.be.false);

    it ('rejects non-numeric strings', () => {
      validators.isValidOffset('sdf').should.be.false;
      validators.isValidOffset('').should.be.false;
    });

    it('accepts multiples of 20 as strings', () => {
      validators.isValidOffset('20').should.be.true;
      validators.isValidOffset('60').should.be.true;
      validators.isValidOffset('100').should.be.true;
    });
  });

  describe('isValidResponse()', () => {
    it("rejects an argument that doesn't have a 'body' key", () => {
      validators.isValidResponse({}).should.be.false;
      validators.isValidResponse().should.be.false;
      validators.isValidResponse(null).should.be.false;
      validators.isValidResponse('something').should.be.false;
    });

    it("rejects an argument that doesn't have a results key nested in it's 'body'", () => {
      validators.isValidResponse({body: {}}).should.be.false;
      validators.isValidResponse({body: null}).should.be.false;
      validators.isValidResponse({body: 'something'}).should.be.false;
    });

    context("invalid 'results'", () => [
      [['something', 'another thing'], 'an array with more than one element'],
      [[], 'an empty array'],
      ['something', 'a non-array']
    ].forEach(([invalidResults, descriptorFragment]) => it(
      `rejects an otherwise valid structure but with 'results' being ${descriptorFragment}`,
      () => validators.isValidResponse({body: {results: invalidResults}}).should.be.false
    )));

    it("accepts an argument with a key of 'body' which has an object with a key of 'results' which is a single-element array", () => {
      const validResults = ['something'];
      validators.isValidResponse({body: {results: validResults}}).should.be.true;
    });
  });

  describe('isValidApiKey()', () => {
    it('accepts a non-empty string', () => {
      validators.isValidApiKey('SOME_KEY').should.be.true;
    });

    context('invalid API keys', () => [
      ['', 'an empty string'],
      [2, 'a number'],
      [null, 'a null value'],
      [{}, 'an object']
    ].forEach(([invalidApiKey, descriptorFragment]) => it(
      `rejects ${descriptorFragment}`,
      () => validators.isValidApiKey(invalidApiKey).should.be.false
    )));
  });

  describe('isValidType()', () => {
    it("accepts a type if it's in the map", () => {
      validators.isValidType('some_type', new Set(['some_type'])).should.be.true;
    });

    it("rejects a type if it's not in the map", () => {
      validators.isValidType('another_type', new Set(['some_type'])).should.be.false;
    });
  });

  describe('isValidChamber()', () => {
    ['senate', 'house'].forEach((validChamber) => it(
      `accepts '${validChamber}'`,
      () => validators.isValidChamber(validChamber).should.be.true
    ));
    
    it('rejects anything else', () => {
      validators.isValidChamber('').should.be.false;
      validators.isValidChamber().should.be.false;
      validators.isValidChamber(null).should.be.false;
      validators.isValidChamber({}).should.be.false;
    });
  });

  describe('isValidCongress()', () => {
    context('without a lower limit', () => {
      it('accepts the current session and lower', () => {
        validators.isValidCongress(115).should.be.true;
        validators.isValidCongress(100).should.be.true;
      });

      it('rejects any sessions past the current congress', () => {
        validators.isValidCongress(116).should.be.false;
        validators.isValidCongress(200).should.be.false;
      });

      it('rejects non-numeric values', () => {
        validators.isValidCongress(null).should.be.false;
        validators.isValidCongress().should.be.false;
        validators.isValidCongress('an invalid session').should.be.false;
        validators.isValidCongress({}).should.be.false;
      });
    });

    context('with a lower limit', () => {
      it('rejects any sessions past the current congress', () => {
        validators.isValidCongress(116, 108).should.be.false;
        validators.isValidCongress(200, 108).should.be.false;
      });

      it('rejects sessions before the lower limit', () => {
        validators.isValidCongress(101, 108).should.be.false;
      });

      it('accepts a session after and including the lower limit', () => {
        validators.isValidCongress(108, 108).should.be.true;
      });
    });
  });

  describe('isValidBillId()', () => {
    it("accepts strings that begin with 'hr' followed by numbers", () => {
      validators.isValidBillId('hres123').should.be.true;
    });

    it("rejects anything that doesn't begin with 'hr' followed by numbers", () => {
      validators.isValidBillId('hr').should.be.false;
      validators.isValidBillId('123').should.be.false;
      validators.isValidBillId(123).should.be.false;
      validators.isValidBillId(null).should.be.false;
      validators.isValidBillId({}).should.be.false;
    });
  });
});
