const chai = require('chai')
, validators = require('./../src/validators');

chai.should();

describe('validators', () => {
  describe('.isValidOffset()', () => {
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

  describe('.isValidResponse()', () => {
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

    context("invalid 'results'", () => {
      [
        {
          invalidResults: ['something', 'another thing'],
          descriptorFragment: 'an array with more than one element'
        },
        {
          invalidResults: [],
          descriptorFragment: 'an empty array'
        },
        {
          invalidResults: 'something',
          descriptorFragment: 'a non-array'
        }
      ].forEach(({invalidResults, descriptorFragment}) => it(
        `rejects an otherwise valid structure but with 'results' being ${descriptorFragment}`,
        () => validators.isValidResponse({body: {results: invalidResults}}).should.be.false
      ));
    });

    it("accepts an argument with a key of 'body' which has an object with a key of 'results' which is a single-element array", () => {
      const validResults = ['something'];
      validators.isValidResponse({body: {results: validResults}}).should.be.true;
    });
  });

  describe('.isValidApiKey()', () => {
    it('accepts a non-empty string', () => {
      validators.isValidApiKey('SOME_KEY').should.be.true;
    });

    context('invalid API keys', () => {
      [
        {
          invalidApiKey:  '',
          descriptorFragment: 'an empty string'
        },
        {
          invalidApiKey:  2,
          descriptorFragment: 'a number'
        },
        {
          invalidApiKey:  null,
          descriptorFragment: 'a null value'
        },
        {
          invalidApiKey:  {},
          descriptorFragment: 'an object'
        }
      ].forEach(({invalidApiKey, descriptorFragment}) => it(
        `rejects ${descriptorFragment}`,
        () => validators.isValidApiKey(invalidApiKey).should.be.false
      ));
    });
  });
});
