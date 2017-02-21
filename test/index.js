const {replace, when, verify, object, matchers: {
  anything,
  argThat
}} = require('testdouble');

require('chai').use(require('chai-as-promised')).should();

// aliases to verify and when with the ignoreExtraArgs config option set
const ignoringWhen = fakeInvocation => when(fakeInvocation, {ignoreExtraArgs: true});
const ignoringVerify = fakeInvocation => verify(fakeInvocation, {ignoreExtraArgs: true});

describe('pro-publica-congress', () => {
  let clientModule, validators, createPpc;
  beforeEach(() => {
    clientModule = replace('./../src/client');
    validators = replace('./../src/validators');
    createPpc = require('./../src/index').create;

    Object.keys(validators)
      .filter(methodName => methodName.indexOf('isValid') === 0)
      .forEach(methodName => {
        // validation invocations pass by default
        ignoringWhen(validators[methodName]())
          .thenReturn(true);

        // validation invocations with the first argument beginning with '{invalid-' will return false
        ignoringWhen(validators[methodName](argThat(arg => `${arg}`.indexOf('{invalid-') > -1)))
          .thenReturn(false);
      });
  });

  describe('create()', () => {
    it(
      "sets a 'congress' property to the given argument",
      () => createPpc('PROPUBLICA_API_KEY', '{congress}').congress.should.equal('{congress}')
    );

    it('throws with an invalid congress', () => {
      (() => createPpc('PROPUBLICA_API_KEY', '{invalid-congress}'))
        .should.throw(Error, 'Received invalid congress:');
    });

    it("sets a 'client' property to a client created with the given key argument", () => {
      const expectedClient = {};
      when(clientModule.create('PROPUBLICA_API_KEY'))
        .thenReturn(expectedClient);

      createPpc('PROPUBLICA_API_KEY', '{congress}').client
        .should.equal(expectedClient);
    });
  });

  describe('instance methods', () => {
    let ppc, client;
    beforeEach(() => {
      client = object(['get']);
      when(clientModule.create(anything()))
        .thenReturn(client);

      ignoringWhen(client.get())
        .thenResolve({});

      ppc = createPpc('PROPUBLICA_API_KEY', '{congress}');
    });

    describe('.getRecentBills()', () => {
      it("performs a request to an endpoint resembling '{congress}/{chamber}/bills/{recent-bill-type}'", () => {
        return ppc.getRecentBills('{chamber}', '{recent-bill-type}')
          .then(() => ignoringVerify(client.get(
            '{congress}/{chamber}/bills/{recent-bill-type}'
          )));
      });

      it("performs request to the endpoint respecting the given congress", () => {
        return ppc.getRecentBills('{chamber}', '{recent-bill-type}', {congress: '{different-congress}'})
          .then(() => ignoringVerify(client.get(
            '{different-congress}/{chamber}/bills/{recent-bill-type}'
          )));
      });

      it('sets the offset to 0 by default', () => {
        return ppc.getRecentBills('{chamber}', '{recent-bill-type}')
          .then(() => verify(client.get(
            anything(),
            0
          )));
      });

      it('sets the given offset', () => {
        return ppc.getRecentBills('{chamber}', '{recent-bill-type}', {offset: '{offset}'})
          .then(() => verify(client.get(
            anything(),
            '{offset}'
          )));
      });

      it('rejects with an invalid chamber', () => {
        return ppc.getRecentBills('{invalid-chamber}', '{recent-bill-type}')
          .should.be.rejectedWith(Error, 'Received invalid chamber:');
      });

      it('rejects with an invalid congress', () => {
        return ppc.getRecentBills('{chamber}', '{recent-bill-type}', {congress: '{invalid-congress}'})
          .should.be.rejectedWith(Error, 'Received invalid congress:');
      });

      it('validates against the 105th congress as the earliest', () => {
        return ppc.getRecentBills('{chamber}', '{recent-bill-type}')
          .then(() => verify(validators.isValidCongress(
            anything(),
            105
          )));
      });

      it('validates against recent bill types', () => {
        const expectedTypeSet = new Set([
          'introduced',
          'updated',
          'passed',
          'major'
        ]);
        return ppc.getRecentBills('{chamber}', '{recent-bill-type}')
          .then(() => verify(validators.isValidType(
            '{recent-bill-type}',
            expectedTypeSet
          )));
      });

      it('rejects with an invalid recent bill type', () => {
        return ppc.getRecentBills('{chamber}', '{invalid-recent-bill-type}')
          .should.be.rejectedWith(Error, 'Received invalid recent bill type:');
      });
    });

    describe('.getBill()', () => {
      it("performs a request to an endpoint resembling '{congress}/bills/{bill-id}'", () => {
        return ppc.getBill('{bill-id}')
          .then(() => ignoringVerify(client.get(
            '{congress}/bills/{bill-id}'
          )));
      });

      it("performs request to the endpoint respecting the given congress", () => {
        return ppc.getBill('{bill-id}', {congress: '{different-congress}'})
          .then(() => ignoringVerify(client.get(
            '{different-congress}/bills/{bill-id}'
          )));
      });

      it('rejects with an invalid congress', () => {
        return ppc.getBill('{bill-id}', {congress: '{invalid-congress}'})
          .should.be.rejectedWith(Error, 'Received invalid congress:');
      });

      it('validates against the 105th congress as the earliest', () => {
        return ppc.getBill('{bill-id}')
          .then(() => verify(validators.isValidCongress(
            anything(),
            105
          )));
      });

      it('rejects with an invalid bill ID', () => {
        return ppc.getBill('{invalid-bill-id}')
          .should.be.rejectedWith(Error, 'Received invalid bill ID:');
      });
    });

    describe('.getAdditionalBillDetails()', () => {
      it("performs a request to an endpoint resembling '{congress}/bills/{bill-id}/{additional-bill-detail-type}'", () => {
        return ppc.getAdditionalBillDetails('{bill-id}', '{additional-bill-detail-type}')
          .then(() => ignoringVerify(client.get(
            '{congress}/bills/{bill-id}/{additional-bill-detail-type}'
          )));
      });

      it("performs request to the endpoint respecting the given congress", () => {
        return ppc.getAdditionalBillDetails('{bill-id}', '{additional-bill-detail-type}', {congress: '{different-congress}'})
          .then(() => ignoringVerify(client.get(
            '{different-congress}/bills/{bill-id}/{additional-bill-detail-type}'
          )));
      });

      it('rejects with an invalid congress', () => {
        return ppc.getAdditionalBillDetails('{bill-id}', '{additional-bill-detail-type}', {congress: '{invalid-congress}'})
          .should.be.rejectedWith(Error, 'Received invalid congress:');
      });

      it('validates against the 105th congress as the earliest', () => {
        return ppc.getAdditionalBillDetails('{bill-id}', '{additional-bill-detail-type}')
          .then(() => verify(validators.isValidCongress(
            anything(),
            105
          )));
      });

      it('rejects with an invalid bill ID', () => {
        return ppc.getAdditionalBillDetails('{invalid-bill-id}', '{additional-bill-detail-type}')
          .should.be.rejectedWith(Error, 'Received invalid bill ID:');
      });

      it('validates against recent bill types', () => {
        const expectedAdditionalBillDetailTypes = new Set([
          'subjects',
          'amendments',
          'related',
          'cosponsors'
        ]);
        return ppc.getAdditionalBillDetails('{bill-id}', '{additional-bill-detail-type}')
          .then(() => verify(validators.isValidType(
            '{additional-bill-detail-type}',
            expectedAdditionalBillDetailTypes
          )));
      });

      it('rejects with an invalid recent bill type', () => {
        return ppc.getAdditionalBillDetails('{bill-id}', '{invalid-additional-bill-detail-type}')
          .should.be.rejectedWith(Error, 'Received invalid additional bill detail type:');
      });

      it('sets the offset to 0 by default', () => {
        return ppc.getAdditionalBillDetails('{bill-id}', '{additional-bill-detail-type}')
          .then(() => verify(client.get(
            anything(),
            0
          )));
      });

      it('sets the given offset', () => {
        return ppc.getAdditionalBillDetails('{bill-id}', '{additional-bill-detail-type}', {offset: '{offset}'})
          .then(() => verify(client.get(
            anything(),
            '{offset}'
          )));
      });
    });
    
    describe('.getMemberList()', () => {
      it("performs a request to an endpoint resembling '{congress}/{chamber}/members'", () => {
        return ppc.getMemberList('{chamber}')
          .then(() => ignoringVerify(client.get(
            '{congress}/{chamber}/members'
          )));
      });

      it("performs request to the endpoint respecting the given congress", () => {
        return ppc.getMemberList('{chamber}', {congress: '{different-congress}'})
          .then(() => ignoringVerify(client.get(
            '{different-congress}/{chamber}/members'
          )));
      });

      it('sets the offset to 0 by default', () => {
        return ppc.getMemberList('{chamber}')
          .then(() => verify(client.get(
            anything(),
            0
          )));
      });

      it('sets the given offset', () => {
        return ppc.getMemberList('{chamber}', {offset: '{offset}'})
          .then(() => verify(client.get(
            anything(),
            '{offset}'
          )));
      });

      it('rejects with an invalid chamber', () => {
        return ppc.getMemberList('{invalid-chamber}')
          .should.be.rejectedWith(Error, 'Received invalid chamber:');
      });

      it('validates against the 102nd congress as the earliest for the house', () => {
        return ppc.getMemberList('house')
          .then(() => verify(validators.isValidCongress(
            anything(),
            102
          )));
      });

      it('reject on house lists before the 102nd congress', () => {
        return ppc.getMemberList('house', {congress: '{invalid-congress}'})
          .should.be.rejectedWith(Error, 'Received invalid congress:');
      });

      it('reject on senate lists before the 80th congress', () => {
        return ppc.getMemberList('senate', {congress: '{invalid-congress}'})
          .should.be.rejectedWith(Error, 'Received invalid congress:');
      });

      it('validates against the 80th congress as the earliest for the senate', () => {
        return ppc.getMemberList('senate')
          .then(() => verify(validators.isValidCongress(
            anything(),
            80
          )));
      });
    });

    describe('.getNewMembers()', () => {
      it("performs a request to an endpoint resembling 'members/new'", () => {
        return ppc.getNewMembers()
          .then(() => ignoringVerify(client.get(
            'members/new'
          )));
      });

      it('sets the offset to 0 by default', () => {
        return ppc.getNewMembers()
          .then(() => verify(client.get(
            anything(),
            0
          )));
      });

      it('sets the given offset', () => {
        return ppc.getNewMembers({offset: '{offset}'})
          .then(() => verify(client.get(
            anything(),
            '{offset}'
          )));
      });
    });

    describe('.getVotesByMember()', () => {
      it("performs a request to an endpoint resembling 'members/{member-id}/votes'", () => {
        return ppc.getVotesByMember('{member-id}')
          .then(() => ignoringVerify(client.get(
            'members/{member-id}/votes'
          )));
      });

      it('rejects with an invalid member ID', () => {
        return ppc.getVotesByMember('{invalid-member-id}')
          .should.be.rejectedWith(Error, 'Received invalid member ID:');
      });

      it('sets the offset to 0 by default', () => {
        return ppc.getVotesByMember('{member-id}')
          .then(() => verify(client.get(
            anything(),
            0
          )));
      });

      it('sets the given offset', () => {
        return ppc.getVotesByMember('{member-id}', {offset: '{offset}'})
          .then(() => verify(client.get(
            anything(),
            '{offset}'
          )));
      });
    });

    describe('.getMemberComparison()', () => {
      /**
       * Helper to minimize repeating this multi-line invocation. Wraps around the call to 
       * ppc.getMemberComparison using an options hash whose keys map to the arguments of the method
       * the required parameters have default values set which may or may not be referenced in a
       * test. They may also be overridden for the purposes of the test.
       * 
       * @param {Object} [{
       *         firstMemberId = '{member-id}',
       *         secondMemberId = '{second-member-id}',
       *         chamber = '{chamber}',
       *         memberComparisonType = '{member-comparison-type}',
       *         congress,
       *         offset
       *       }={}] 
       * @returns 
       */
      function getMemberComparison({
        firstMemberId = '{member-id}',
        secondMemberId = '{second-member-id}',
        chamber = '{chamber}',
        memberComparisonType = '{member-comparison-type}',
        congress,
        offset
      } = {}) {
        return ppc.getMemberComparison(
          firstMemberId,
          secondMemberId,
          chamber,
          memberComparisonType,
          Object.assign({}, congress ? {congress} : {}, offset ? {offset} : {})
        );
      }

      it("performs request to an endpoint resembling 'members/{first-member-id}/{member-comparison-type}/{second-member-id}/{congress}/{chamber}'", () => {
        return getMemberComparison()
          .then(() => ignoringVerify(client.get(
            'members/{member-id}/{member-comparison-type}/{second-member-id}/{congress}/{chamber}'
          )));
      });

      it("performs request to an endpoint respecting the given congress", () => {
        return getMemberComparison({congress: '{different-congress}'})
          .then(() => ignoringVerify(client.get(
            'members/{member-id}/{member-comparison-type}/{second-member-id}/{different-congress}/{chamber}'
          )));
      });

      it('sets the offset to 0 by default', () => {
        return getMemberComparison()
          .then(() => verify(client.get(
            anything(),
            0
          )));
      });

      it('sets the given offset', () => {
        return getMemberComparison({offset: '{offset}'})
          .then(() => verify(client.get(
            anything(),
            '{offset}'
          )));
      });

      it('rejects with an invalid first member ID', () => {
        return getMemberComparison({firstMemberId: '{invalid-member-id}'})
          .should.be.rejectedWith(Error, 'Received invalid member ID:');
      });

      it('rejects with an invalid second member ID', () => {
        return getMemberComparison({secondMemberId: '{invalid-second-member-id}'})
          .should.be.rejectedWith(Error, 'Received invalid member ID:');
      });

      it('rejects with an invalid chamber', () => {
        return getMemberComparison({chamber: '{invalid-chamber}'})
          .should.be.rejectedWith(Error, 'Received invalid chamber:');
      });

      it('validates against the 101st congress as the earliest for the senate', () => {
        return getMemberComparison({chamber: 'senate'})
          .then(() => verify(validators.isValidCongress(
            anything(),
            101
          )));
      });

      it('validates against the 102nd congress as the earliest for the house', () => {
        return getMemberComparison({chamber: 'house'})
          .then(() => verify(validators.isValidCongress(
            anything(),
            102
          )));
      });

      it('rejects with representative comparisons before the 102nd congress', () => {
        return getMemberComparison({chamber: 'house', congress: '{invalid-congress}'})
          .should.be.rejectedWith(Error, 'Received invalid congress:');
      });

      it('rejects with senator comparisons before the 101st congress', () => {
        return getMemberComparison({chamber: 'senate', congress: '{invalid-congress}'})
          .should.be.rejectedWith(Error, 'Received invalid congress:');
      });

      it('validates against member comparison types', () => {
        const expectedTypeSet = new Set([
          'bills',
          'votes',
        ]);
        return getMemberComparison()
          .then(() => verify(validators.isValidType(
            '{member-comparison-type}',
            expectedTypeSet
          )));
      });

      it('rejects with an invalid member comparison type', () => {
        return getMemberComparison({memberComparisonType: '{invalid-member-comparison-type}'})
          .should.be.rejectedWith(Error, 'Received invalid member comparison type:');
      });
    });

    describe('.getCurrentSenators()', () => {
      it.skip("performs a request to an endpoint resembling 'members/senate/{state}/current'", () => {
        return ppc.getCurrentSenators('{state}')
          .then(() => ignoringVerify(client.get(
            'members/senate/{state}/current'
          )));
      });

      it.skip('rejects with an invalid state', () => {
        return ppc.getCurrentSenators('{invalid-state}')
          .should.be.rejectedWith(Error, 'Received invalid state:');
      });
    });

    describe('.getCurrentRepresentatives()', () => {
      it.skip("performs a request to an endpoint resembling 'members/house/{state}/{district}/current'", () => {
        return ppc.getCurrentSenators('{state}', '{district}')
          .then(() => ignoringVerify(client.get(
            'members/house/{state}/{district}/current'
          )));
      });

      it.skip('rejects with an invalid state', () => {
        return ppc.getCurrentSenators('{invalid-state}', '{district}')
          .should.be.rejectedWith(Error, 'Received invalid state:');
      });

      it.skip('rejects with an invalid district', () => {
        return ppc.getCurrentSenators('{state}', '{invalid-district}')
          .should.be.rejectedWith(Error, 'Received invalid district:');
      });
    });

    describe('.getLeavingMembers()', () => {
      it("performs a request to an endpoint resembling '{congress}/{chamber}/members/leaving'", () => {
        return ppc.getLeavingMembers('{chamber}')
          .then(() => ignoringVerify(client.get(
            '{congress}/{chamber}/members/leaving'
          )));
      });

      it("performs request to an endpoint respecting the given congress", () => {
        return ppc.getLeavingMembers('{chamber}', {congress: '{different-congress}'})
          .then(() => ignoringVerify(client.get(
            '{different-congress}/{chamber}/members/leaving'
          )));
      });

      it('validates against the 111th congress as the earliest', () => {
        return ppc.getLeavingMembers('{chamber}')
          .then(() => verify(validators.isValidCongress(
            anything(),
            111
          )));
      });

      it('rejects with an invalid congress', () => {
        return ppc.getLeavingMembers('{invalid-congress}', {congress: '{invalid-congress}'})
          .should.be.rejectedWith(Error, 'Received invalid congress:');
      });

      it('rejects with an invalid chamber', () => {
        return ppc.getLeavingMembers('{invalid-chamber}')
          .should.be.rejectedWith(Error, 'Received invalid chamber:');
      });

      it('sets the offset to 0 by default', () => {
        return ppc.getLeavingMembers('{chamber}')
          .then(() => verify(client.get(
            anything(),
            0
          )));
      });

      it('sets the given offset', () => {
        return ppc.getLeavingMembers('{chamber}', {offset: '{offset}'})
          .then(() => verify(client.get(
            anything(),
            '{offset}'
          )));
      });
    });

    describe('.getBillsByMember()', () => {
      it.skip("performs a request to an endpoint resembling 'members/{member-id}/bills/{member-bill-type}'", () => {
        return ppc.getBillsByMember('{member-id}', '{member-bill-type}')
          .then(() => ignoringVerify(client.get(
            'members/{member-id}/bills/{member-bill-type}'
          )));
      });

      it.skip('validates against member bill types', () => {
        const expectedTypes = new Set([
          'introduced',
          'updated'
        ]);
        return ppc.getBillsByMember('{member-id}', '{member-bill-type}')
          .then(() => verify(validators.isValidType(
            '{member-bill-type}',
            expectedTypes
          )));
      });

      it.skip('rejects with an invalid member bill type', () => {
        return ppc.getBillsByMember('{member-id}', '{member-bill-type}');
      });

      it.skip('rejects with an invalid member ID', () => {
        return ppc.getBillsByMember('{invalid-member-id}', '{member-bill-type}');
      });

      it.skip('sets the offset to 0 by default', () => {
        return ppc.getRecentBills('{chamber}', '{recent-bill-type}')
          .then(() => verify(client.get(
            anything(),
            0
          )));
      });

      it.skip('sets the given offset', () => {
        return ppc.getRecentBills('{chamber}', '{recent-bill-type}', {offset: '{offset}'})
          .then(() => verify(client.get(
            anything(),
            '{offset}'
          )));
      });
    });

    describe('.getRollCallVotes()', () => {
      it.skip("performs a request to an endpoint resembling '{congress}/{chamber}/sessions/{session-number}/votes/{roll-call-number}'", () => {
        return ppc.getRollCallVotes('{chamber}', '{session-number}', '{roll-call-number}')
          .then(() => ignoringVerify(client.get(
            '{congress}/{chamber}/sessions/{session-number}/votes/{roll-call-number}'
          )));
      });

      it.skip("performs request to an endpoint respecting the given congress", () => {
        return ppc.getRollCallVotes('{chamber}', '{session-number}', '{roll-call-number}', {congress: '{different-congress}'})
          .then(() => ignoringVerify(client.get(
            '{different-congress}/{chamber}/sessions/{session-number}/votes/{roll-call-number}'
          )));
      });

      it.skip('validates against the 102nd congress as the earliest for the house', () => {
        return ppc.getRollCallVotes('house', '{session-number}', '{roll-call-number}', {congress: '{different-congress}'})
          .then(() => verify(validators.isValidCongress(
            anything(),
            102
          )));
      });

      it.skip('validates against the 101st congress as the earliest for the senate', () => {
        return ppc.getRollCallVotes('senate', '{session-number}', '{roll-call-number}', {congress: '{different-congress}'})
          .then(() => verify(validators.isValidCongress(
            anything(),
            101
          )));
      });

      it.skip('rejects with an invalid congress', () => {
        return ppc.getRollCallVotes('senate', '{session-number}', '{roll-call-number}', {congress: '{invalid-congress}'})
          .should.be.rejectedWith(Error, 'Received invalid congress:');
      });

      it.skip('rejects with an invalid chamber', () => {
        return ppc.getRollCallVotes('{invalid-chamber}', '{session-number}', '{roll-call-number}')
          .should.be.rejectedWith(Error, 'Received invalid chamber:');
      });

      it.skip('rejects with an invalid session number', () => {
        return ppc.getRollCallVotes('{chamber}', '{invalid-session-number}', '{roll-call-number}')
          .should.be.rejectedWith(Error, 'Received invalid session number:');
      });

      it.skip('rejects with an invalid roll call number', () => {
        return ppc.getRollCallVotes('{chamber}', '{session-number}', '{invalid-roll-call-number}')
          .should.be.rejectedWith(Error, 'Received invalid roll call number:');
      });
    });

    describe('.getVotesByDate()', () => {
      it.skip("performs a request to an endpoint resembling '{chamber}/votes/{year}/{month}'", () => {
        return ppc.getVotesByDate('{chamber}', '{year}', '{month}')
          .then(() => ignoringVerify(client.get(
            '{chamber}/votes/{year}/{month}'
          )));
      });

      it.skip('rejects with an invalid chamber', () => {
        return ppc.getVotesByDate('{invalid-chamber}', '{year}', '{month}')
          .should.be.rejectedWith(Error, 'Received invalid chamber:');
      });

      it.skip('rejects with an invalid year', () => {
        return ppc.getVotesByDate('{chamber}', '{invalid-year}', '{month}')
          .should.be.rejectedWith(Error, 'Received invalid year: ');
      });

      it.skip('rejects with an invalid month', () => {
        return ppc.getVotesByDate('{chamber}', '{year}', '{invalid-month}')
          .should.be.rejectedWith(Error, 'Received invalid month: ');
      });
    });

    describe('.getVotes()', () => {
      it("performs a request to an endpoint resembling '{congress}/{chamber}/votes/{vote-type}'", () => {
        return ppc.getVotes('{chamber}', '{vote-type}')
          .then(() => ignoringVerify(client.get(
            '{congress}/{chamber}/votes/{vote-type}'
          )));
      });

      it("performs request to an endpoint respecting the given congress", () => {
        return ppc.getVotes('{chamber}', '{vote-type}', {congress: '{different-congress}'})
          .then(() => ignoringVerify(client.get(
            '{different-congress}/{chamber}/votes/{vote-type}'
          )));
      });

      it('validates against the 102nd congress as the earliest for the house', () => {
        return ppc.getVotes('house', '{vote-type}')
          .then(() => verify(validators.isValidCongress(
            anything(),
            102
          )));
      });

      it('validates against the 101st congress as the earliest for the senate', () => {
        return ppc.getVotes('senate', '{vote-type}')
          .then(() => verify(validators.isValidCongress(
            anything(),
            101
          )));
      });

      it('rejects with an invalid congress', () => {
        ppc.getVotes('{chamber}', '{vote-type}', {congress: '{invalid-congress}'})
          .should.be.rejectedWith(Error, 'Received invalid congress:');
      });

      it('rejects with an invalid chamber', () => {
        return ppc.getVotes('{invalid-chamber}', '{vote-type}')
          .should.be.rejectedWith(Error, 'Received invalid chamber:');
      });

      it('validates against vote types', () => {
        const expectedTypes = new Set([
          'missed',
          'party',
          'loneno',
          'perfect'
        ]);
        return ppc.getVotes('{chamber}', '{vote-type}')
          .then(() => verify(validators.isValidType(
            '{vote-type}',
            expectedTypes
          )));
      });

      it('rejects with an invalid vote type', () => {
        return ppc.getVotes('{chamber}', '{invalid-vote-type}')
          .should.be.rejectedWith(Error, 'Received invalid vote type:');
      });

      it('sets the offset to 0 by default', () => {
        return ppc.getVotes('{chamber}', '{vote-type}')
          .then(() => verify(client.get(
            anything(),
            0
          )));
      });

      it('sets the given offset', () => {
        return ppc.getVotes('{chamber}', '{vote-type}', {offset: '{offset}'})
          .then(() => verify(client.get(
            anything(),
            '{offset}'
          )));
      });
    });

    describe('.getSenateNominationVotes()', () => {
      it("performs a request to an endpoint resembling '{congress}/nominations'", () => {
        return ppc.getSenateNominationVotes()
          .then(() => ignoringVerify(client.get(
            '{congress}/nominations'
          )));
      });

      it("performs request to an endpoint respecting the given congress", () => {
        return ppc.getSenateNominationVotes({congress: '{different-congress}'})
          .then(() => ignoringVerify(client.get(
            '{different-congress}/nominations'
          )));
      });

      it('validates against the 101st congress as the earliest', () => {
        return ppc.getSenateNominationVotes()
          .then(() => verify(validators.isValidCongress(
            anything(),
            101
          )));
      });

      it('rejects with an invalid congress', () => {
        return ppc.getSenateNominationVotes({congress: '{invalid-congress}'})
          .should.be.rejectedWith(Error, 'Received invalid congress:');
      });

      it('sets the offset to 0 by default', () => {
        return ppc.getSenateNominationVotes()
          .then(() => verify(client.get(
            anything(),
            0
          )));
      });

      it('sets the given offset', () => {
        return ppc.getSenateNominationVotes({offset: '{offset}'})
          .then(() => verify(client.get(
            anything(),
            '{offset}'
          )));
      });
    });

    describe('.getNominees()', () => {
      it("performs a request to an endpoint resembling '{congress}/nominees/{nominee-type}'", () => {
        return ppc.getNominees('{nominee-type}')
          .then(() => ignoringVerify(client.get(
            '{congress}/nominees/{nominee-type}'
          )));
      });

      it("performs request to an endpoint respecting the given congress", () => {
        return ppc.getNominees('{nominee-type}', {congress: '{different-congress}'})
          .then(() => ignoringVerify(client.get(
            '{different-congress}/nominees/{nominee-type}'
          )));
      });

      it('validates against the 107st congress as the earliest', () => {
        return ppc.getNominees('{nominee-type}')
          .then(() => verify(validators.isValidCongress(
            anything(),
            107
          )));
      });

      it('rejects with an invalid congress', () => {
        return ppc.getNominees('{nominee-type}', {congress: '{invalid-congress}'})
          .should.be.rejectedWith(Error, 'Received invalid congress:');
      });

      it('validates against nominee types', () => {
        const expectedTypes = new Set([
          'received',
          'updated',
          'confirmed',
          'withdrawn'
        ]);
        return ppc.getNominees('{nominee-type}')
          .then(() => verify(validators.isValidType(
            '{nominee-type}',
            expectedTypes
          )));
      });

      it('rejects with an invalid nominee type', () => {
        return ppc.getNominees('{invalid-nominee-type}')
          .should.be.rejectedWith(Error, 'Received invalid nominee type:');
      });
    });

    describe('.getNomineesByState()', () => {
      it.skip("performs a request to an endpoint resembling '{congress}/nominees/state/{state}'", () => {
        return ppc.getNomineesByState('{state}')
          .then(() => ignoringVerify(client.get(
            '{congress}/nominees/state/{state}'
          )));
      });

      it.skip("performs request to an endpoint respecting the given congress", () => {
        return ppc.getNomineesByState('{state}', {congress: '{different-congress}'})
          .then(() => ignoringVerify(client.get(
            '{different-congress}/nominees/state/{state}'
          )));
      });

      it.skip('validates against the 107st congress as the earliest', () => {
        return ppc.getNomineesByState('{state}')
          .then(() => verify(validators.isValidCongress(
            anything(),
            107
          )));
      });

      it.skip('rejects with an invalid congress', () => {
        return ppc.getNomineesByState('{state}', {congress: '{invalid-congress}'})
          .should.be.rejectedWith(Error, 'Received invalid congress:');
      });

      it.skip('rejects with an invalid state', () => {
        return ppc.getNomineesByState('{invalid-state}')
          .should.be.rejectedWith(Error, 'Received invalid state:');
      });
    });

    describe('.getPartyCounts()', () => {
      it("performs a request to an endpoint resembling 'states/members/party'", () => {
        return ppc.getPartyCounts()
          .then(() => ignoringVerify(client.get(
            'states/members/party'
          )));
      });
    });

    describe('.getCommittees()', () => {
      it("performs a request to an endpoint resembling '{congress}/{chamber}/committees'", () => {
        return ppc.getCommittees('{chamber}')
          .then(() => ignoringVerify(client.get(
            '{congress}/{chamber}/committees'
          )));
      });

      it("performs request to an endpoint respecting the given congress", () => {
        return ppc.getCommittees('{chamber}', {congress: '{different-congress}'})
          .then(() => ignoringVerify(client.get(
            '{different-congress}/{chamber}/committees'
          )));
      });
    
      it('validates against the 110th congress as the earliest', () => {
        return ppc.getCommittees('{chamber}')
          .then(() => verify(validators.isValidCongress(
            anything(),
            110
          )));
      });
    
      it('rejects with an invalid congress', () => {
        return ppc.getCommittees('{chamber}', {congress: '{invalid-congress}'})
          .should.be.rejectedWith(Error, 'Received invalid congress:');
      });
    
      it('rejects with an invalid chamber', () => {
        return ppc.getCommittees('{invalid-chamber}')
          .should.be.rejectedWith(Error, 'Received invalid chamber:');
      });

      it('sets the offset to 0 by default', () => {
        return ppc.getCommittees('{chamber}')
          .then(() => verify(client.get(
            anything(),
            0
          )));
      });

      it('sets the given offset', () => {
        return ppc.getCommittees('{chamber}', {offset: '{offset}'})
          .then(() => verify(client.get(
            anything(),
            '{offset}'
          )));
      });
    });

    describe('.getCommitteeMembers()', () => {
      it.skip("performs a request to an endpoint resembling '{congress}/{chamber}/committees/{committee-id}'", () => {
        return ppc.getCommitteeMembers('{chamber}', '{committee-id}')
          .then(() => ignoringVerify(client.get(
            '{congress}/{chamber}/committees/{committee-id}'
          )));
      });

      it.skip("performs request to an endpoint respecting the given congress", () => {
        return ppc.getCommitteeMembers('{chamber}', '{committee-id}', {congress: '{different-congress}'})
          .then(() => ignoringVerify(client.get(
            '{different-congress}/{chamber}/committees/{committee-id}'
          )));
      });

      it.skip('validates against the 110th congress as the earliest', () => {
        return ppc.getCommitteeMembers('{chamber}', '{committee-id}')
          .then(() => verify(validators.isValidCongress(
            anything(),
            110
          )));
      });

      it.skip('rejects with an invalid congress', () => {
        return ppc.getCommitteeMembers('{chamber}', '{committee-id}', {congress: '{invalid-congress}'})
          .should.be.rejectedWith(Error, 'Received invalid congress:');
      });

      it.skip('rejects with an invalid chamber', () => {
        return ppc.getCommitteeMembers('{invalid-chamber}', '{committee-id}')
          .should.be.rejectedWith(Error, 'Received invalid chamber:');
      });

      it.skip('rejects with an invalid committee ID', () => {
        return ppc.getCommitteeMembers('{chamber}', '{invalid-committee-id}')
          .should.be.rejectedWith(Error, 'Received invalid committee ID:');
      });

      it.skip('sets the offset to 0 by default', () => {
        return ppc.getCommitteeMembers('{chamber}', '{committee-id}')
          .then(() => verify(client.get(
            anything(),
            0
          )));
      });

      it.skip('sets the given offset', () => {
        return ppc.getCommitteeMembers('{chamber}', '{committee-id}', {offset: '{offset}'})
          .then(() => verify(client.get(
            anything(),
            '{offset}'
          )));
      });
    });
  });
});

