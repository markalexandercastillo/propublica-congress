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

  describe('isValidMemberId()', () => {
    it('accepts a capital letter followed by 6 numbers', () => {
      validators.isValidMemberId('K000388').should.be.true;
    });

    it('rejects everything else', () => {
      validators.isValidMemberId('k000388').should.be.false;
      validators.isValidMemberId('K00038').should.be.false;
      validators.isValidMemberId('KK000388').should.be.false;
      validators.isValidMemberId(123).should.be.false;
      validators.isValidMemberId(null).should.be.false;
      validators.isValidMemberId({}).should.be.false;
    });
  });
});
