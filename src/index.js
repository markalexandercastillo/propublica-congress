const {create, assign} = Object
  , {stringify} = JSON
  , client = require('./client')
  , validators = require('./validators');

const recentBillTypes = new Set([
  'introduced',
  'updated',
  'passed',
  'major'
]);

const additionalBillDetailTypes = new Set([
  'subjects',
  'amendments',
  'related',
  'cosponsors'
]);

const memberComparisonTypes = new Set([
  'bills',
  'votes'
]);

const nomineeTypes = new Set([
  'received',
  'updated',
  'confirmed',
  'withdrawn'
]);

const voteTypes = new Set([
  'missed',
  'party',
  'loneno',
  'perfect'
]);

const memberBillTypes = new Set([
  'introduced',
  'updated'
]);

function validateChamber(chamber) {
  return new Promise((resolve, reject) => validators.isValidChamber(chamber)
    ? resolve()
    : reject(new Error(`Received invalid chamber: ${stringify(chamber)}`))
  );
}

function validateCongress(session, earliestSession) {
  return new Promise((resolve, reject) => validators.isValidCongress(session, earliestSession)
    ? resolve()
    : reject(new Error(`Received invalid congress: ${stringify(session)}`))
  );
}

function validateType(type, typeSet, descriptor) {
  return new Promise((resolve, reject) => validators.isValidType(type, typeSet)
    ? resolve()
    : reject(new Error(`Received invalid ${descriptor}: ${stringify(type)}`))
  );
}

function validateBillId(billId) {
  return new Promise((resolve, reject) => validators.isValidBillId(billId)
    ? resolve()
    : reject(new Error(`Received invalid bill ID: ${stringify(billId)}`))
  );
}

function validateMemberId(memberId) {
  return new Promise((resolve, reject) => validators.isValidMemberId(memberId)
    ? resolve()
    : reject(new Error(`Received invalid member ID: ${stringify(memberId)}`))
  );
}

function validateState(state) {
  return new Promise((resolve, reject) => validators.isValidState(state)
    ? resolve()
    : reject(new Error(`Received invalid state: ${stringify(state)}`))
  );
}

function validateDistrict(district) {
  return new Promise((resolve, reject) => validators.isValidDistrict(district)
    ? resolve()
    : reject(new Error(`Received invalid district: ${stringify(district)}`))
  );
}

function validateSessionNumber(sessionNumber) {
  return new Promise((resolve, reject) => validators.isValidSessionNumber(sessionNumber)
    ? resolve()
    : reject(new Error(`Received invalid session number: ${stringify(sessionNumber)}`))
  );
}

function validateRollCallNumber(rollCallNumber) {
  return new Promise((resolve, reject) => validators.isValidRollCallNumber(rollCallNumber)
    ? resolve()
    : reject(new Error(`Received invalid roll call number: ${stringify(rollCallNumber)}`))
  );
}

function validateYear(year) {
  return new Promise((resolve, reject) => validators.isValidYear(year)
    ? resolve()
    : reject(new Error(`Received invalid year: ${stringify(year)}`))
  );
}

function validateMonth(month) {
  return new Promise((resolve, reject) => validators.isValidMonth(month)
    ? resolve()
    : reject(new Error(`Received invalid month: ${stringify(month)}`))
  );
}

function validateCommitteeId(committeeId) {
  return new Promise((resolve, reject) => validators.isValidCommitteeId(committeeId)
    ? resolve()
    : reject(new Error(`Received invalid committee ID: ${stringify(committeeId)}`))
  );
}

const proto = {
  /**
   * Resolves to the members of a particular committee
   * 
   * @see https://propublica.github.io/congress-api-docs/#get-committees-and-committee-memberships
   * @param {String} chamber 
   * @param {String} committeeId 
   * @param {Object} [{congress = this.congress, offset = 0}={}] 
   * @returns {Promise}
   */
  getCommitteeMembers(chamber, committeeId, {congress = this.congress, offset = 0} = {}) {
    return Promise.all([
      validateChamber(chamber),
      validateCongress(congress, 110),
      validateCommitteeId(committeeId)
    ]).then(() => this.client.get(`${congress}/${chamber}/committees/${committeeId}`, offset));
  },
  /**
   * Resolves to a list of presidential civilian nominations of individuals from a specific state.
   *
   * @see https://propublica.github.io/congress-api-docs/#get-nominees-by-state
   * @param {String} state
   * @param {Object} [{congress = this.congress}={}] 
   * @returns {Promise}
   */
  getNomineesByState(state, {congress = this.congress} = {}) {
    return Promise.all([
      validateState(state),
      validateCongress(congress, 107)
    ]).then(() => this.client.get(`${congress}/nominees/state/${state}`));
  },
  /**
   * Resolves to all votes in a particular month.
   * 
   * @see https://propublica.github.io/congress-api-docs/#get-votes-by-date
   * @param {String} chamber 
   * @param {String} year 
   * @param {String} month 
   * @returns {Promise}
   */
  getVotesByDate(chamber, year, month) {
    return Promise.all([
      validateChamber(chamber),
      validateYear(year),
      validateMonth(month)
    ]).then(() => this.client.get(`${chamber}/votes/${year}/${month}`))
  },
  /**
   * Resolves to a specific roll-call vote, including a complete list of member positions.
   * 
   * @see https://propublica.github.io/congress-api-docs/#get-a-specific-roll-call-vote
   * @param {String} chamber 'senate' or 'house'
   * @param {Number} sessionNumber 1 or 2
   * @param {Number} rollCallNumber 
   * @param {Object} [{congress = this.congress}={}] 
   * @returns {Promise}
   */
  getRollCallVotes(chamber, sessionNumber, rollCallNumber, {congress = this.congress} = {}) {
    return Promise.all([
      validateRollCallNumber(rollCallNumber),
      validateSessionNumber(sessionNumber),
      validateChamber(chamber).then(() => validateCongress(congress, {house: 102, senate: 101}[chamber]))
    ]).then(() => this.client.get(`${congress}/${chamber}/sessions/${sessionNumber}/votes/${rollCallNumber}`));
  },
  /**
   * Resolves to the 20 bills most recently introduced or updated by a particular member. Results
   * can include more than one Congress.
   * 
   * @see https://propublica.github.io/congress-api-docs/#get-recent-bills-by-a-specific-member
   * @param {String} memberId 
   * @param {String} memberBillType 'introduced' or 'updated'
   * @param {Object} [{offset = 0}={}] 
   * @returns {Promise}
   */
  getBillsByMember(memberId, memberBillType, {offset = 0} = {}) {
    return Promise.all([
      validateMemberId(memberId),
      validateType(memberBillType, memberBillTypes, 'member bill type')
    ]).then(() => this.client.get(`members/${memberId}/bills/${memberBillType}`, offset));
  },
  /**
   * Resolves to the current members of the house of representatives for the given state and
   * district
   * 
   * @see https://propublica.github.io/congress-api-docs/#get-current-members-by-state-district
   * @param {String} state 
   * @param {Number} district 
   * @returns {Promise}
   */
  getCurrentRepresentatives(state, district) {
    return Promise.all([
      validateState(state),
      validateDistrict(district)
    ]).then(() => this.client.get(`members/house/${state}/${district}/current`));
  },
  /**
   * Resolves to the current members of the senate for the given state
   * 
   * @see https://propublica.github.io/congress-api-docs/#get-current-members-by-state-district
   * @param {any} state 
   * @returns {Promise}
   */
  getCurrentSenators(state) {
    return validateState(state)
      .then(() => this.client.get(`members/senate/${state}/current`));
  },
  /**
   * Resolves to a list of members who have left the Senate or House or have announced plans to do
   * so.
   * 
   * @see https://propublica.github.io/congress-api-docs/#get-members-leaving-office
   * @param {String} chamber 
   * @param {Object} [{congress = this.congress, offset = 0}={}] 
   * @returns {Promise}
   */
  getLeavingMembers(chamber, {congress = this.congress, offset = 0} = {}) {
    return Promise.all([
      validateCongress(congress, 111),
      validateChamber(chamber)
    ]).then(() => this.client.get(`${congress}/${chamber}/members/leaving`, offset));
  },
  /**
   * You can get vote information in four categories: missed votes, party votes, lone no votes and
   * perfect votes. Missed votes provides information about the voting attendance of each member of
   * a specific chamber and congress. Party votes provides information about how often each member
   * of a specific chamber and congress votes with a majority of his or her party. Lone no votes
   * provides information lists members in a specific chamber and congress who were the only members
   * to vote No on a roll call vote, and how often that happened. Perfect votes lists members in a
   * specific chamber and congress who voted Yes or No on every vote for which he or she was
   * eligible.
   * 
   * @see https://propublica.github.io/congress-api-docs/#get-votes-by-type
   * @param {String} chamber 
   * @param {String} voteType 
   * @param {Object} [{congress = this.congress, offset = 0}={}] 
   * @returns {Promise}
   */
  getVotes(chamber, voteType, {congress = this.congress, offset = 0} = {}) {
    return Promise.all([
      validateType(voteType, voteTypes, 'vote type'),
      validateChamber(chamber).then(() => validateCongress(congress, {senate: 101, house: 102}[chamber]))
    ]).then(() => this.client.get(`${congress}/${chamber}/votes/${voteType}`, offset));
  },
  /**
   * Resolves to Senate votes on presidential nominations
   * 
   * @see https://propublica.github.io/congress-api-docs/#get-senate-nomination-votes
   * @param {Object} [{congress = this.congress, offset = 0}={}] 
   * @returns {Promise}
   */
  getSenateNominationVotes({congress = this.congress, offset = 0} = {}) {
    return validateCongress(congress, 101)
      .then(() => this.client.get(`${congress}/nominations`, offset));
  },
  /**
   * Resolves to lists of presidential nominations for civilian positions
   * 
   * @see https://propublica.github.io/congress-api-docs/#get-recent-nominations-by-category
   * @param {String} nomineeType 
   * @param {Object} [{congress = this.congress}={}] 
   * @returns {Promise}
   */
  getNominees(nomineeType, {congress = this.congress} = {}) {
    return Promise.all([
      validateCongress(congress, 107),
      validateType(nomineeType, nomineeTypes, 'nominee type')
    ]).then(() => this.client.get(`${congress}/nominees/${nomineeType}`));
  },
  /**
   * Resolves to party membership counts for all states (current Congress only)
   *
   * @see https://propublica.github.io/congress-api-docs/#get-state-party-counts
   * @returns {Promise}
   */
  getPartyCounts() {
    return this.client.get('states/members/party');
  },
  /**
   * Resolves to a list of Senate or House committees.
   *
   * @see https://propublica.github.io/congress-api-docs/#get-committees-and-committee-memberships
   * @param {String} chamber 
   * @param {Object} [{congress = this.congress, offset = 0}={}] 
   * @returns {Promise}
   */
  getCommittees(chamber, {congress = this.congress, offset = 0} = {}) {
    return Promise.all([
      validateCongress(congress, 110),
      validateChamber(chamber)
    ]).then(() => this.client.get(`${congress}/${chamber}/committees`, offset));
  },
  /**
   * Resolves to a comparison of bill sponsorship or vote positions between two members who served
   * in the same Congress and chamber.
   * 
   * @see https://propublica.github.io/congress-api-docs/#compare-two-members-vote-positions
   * @see https://propublica.github.io/congress-api-docs/#compare-two-members-39-bill-sponsorships
   * @param {String} firstMemberId 
   * @param {String} secondMemberId 
   * @param {String} chamber 'house' or 'senate'
   * @param {String} memberComparisonType 'bills' or 'votes'
   * @param {Object} [{congress = this.congress, offset = 0}={}] 
   * @returns {Promise}
   */
  getMemberComparison(firstMemberId, secondMemberId, chamber, memberComparisonType, {congress = this.congress, offset = 0} = {}) {
    return Promise.all([
      validateMemberId(firstMemberId),
      validateMemberId(secondMemberId),
      validateType(memberComparisonType, memberComparisonTypes, 'member comparison type'),
      validateChamber(chamber).then(() => validateCongress(congress, {senate: 101, house: 102}[chamber]))
    ]).then(() => {
      const endpoint = `members/${firstMemberId}/${memberComparisonType}/${secondMemberId}/${congress}/${chamber}`;
      return this.client.get(endpoint, offset);
    });
  },
  /**
   * Resolves to the most recent vote positions for a specific member of the House of
   * Representatives or Senate
   * 
   * @see https://propublica.github.io/congress-api-docs/#get-a-specific-member-39-s-vote-positions
   * @param {String} memberId 
   * @param {Object} [{offset = 0}={}] 
   * @returns {Promise}
   */
  getVotesByMember(memberId, {offset = 0} = {}) {
    return validateMemberId(memberId)
      .then(() => this.client.get(`members/${memberId}/votes`, offset));
  },
  /**
   * Resolves to a list of the most recent new members of the current Congress.
   * 
   * @see https://propublica.github.io/congress-api-docs/#get-new-members
   * @param {Object} [{offset = 0}={}] 
   * @returns {Promise}
   */
  getNewMembers({offset = 0} = {}) {
    return this.client.get('members/new', offset);
  },
  /**
   * Resolves to a list of members of a particular chamber in a particular Congress.
   * 
   * @see https://propublica.github.io/congress-api-docs/#lists-of-members
   * @param {String} chamber 'senate' or 'house'
   * @param {Object} [{congress = this.congress, offset = 0}={}] 
   * @returns {Promise}
   */
  getMemberList(chamber, {congress = this.congress, offset = 0} = {}) {
    return validateChamber(chamber)
      .then(() => validateCongress(congress, {senate: 80, house: 102}[chamber]))
      .then(() => this.client.get(`${congress}/${chamber}/members`, offset));
  },
  /**
   * Resolves to additional details about a particular bill of the given type.
   * 
   * @see https://propublica.github.io/congress-api-docs/#get-a-subjects-amendments-and-related-bills-for-a-specific-bill
   * @see https://propublica.github.io/congress-api-docs/#get-cosponsors-for-a-specific-bill
   * @param {String} billId
   * @param {String} additionalBillDetailType 'subjects', 'amendments', 'related', or 'cosponsors'
   * @param {Object} [{congress = this.congress, offset = 0}={}] 
   * @returns 
   */
  getAdditionalBillDetails(billId, additionalBillDetailType, {congress = this.congress, offset = 0} = {}) {
    return Promise.all([
      validateCongress(congress, 105),
      validateBillId(billId),
      validateType(additionalBillDetailType, additionalBillDetailTypes, 'additional bill detail type')
    ]).then(() => this.client.get(`${congress}/bills/${billId}/${additionalBillDetailType}`, offset));
  },
  /**
   * Resolves to details about a particular bill, including actions taken and votes.
   * 
   * @see https://propublica.github.io/congress-api-docs/#get-a-specific-bill
   * @param {String} billId 
   * @param {Object} [{congress = this.congress}={}] 
   * @returns {Promise}
   */
  getBill(billId, {congress = this.congress} = {}) {
    return Promise.all([
      validateCongress(congress, 105),
      validateBillId(billId)
    ]).then(() => this.client.get(`${congress}/bills/${billId}`));
  },
  /**
   * Resolves to summaries of the 20 most recent bills by type. For the current Congress,
   * “recent bills” can be one of four types. For previous Congresses, “recent bills” means the last
   * 20 bills of that Congress.
   * 
   * @see https://propublica.github.io/congress-api-docs/#get-recent-bills
   * @param {String} chamber 'senate' or 'house'
   * @param {String} recentBillType
   * @param {Object} [{congress = this.congress, offset = 0}={}] 
   * @returns {Promise}
   */
  getRecentBills(chamber, recentBillType, {congress = this.congress, offset = 0} = {}) {
    return Promise.all([
      validateChamber(chamber),
      validateCongress(congress, 105),
      validateType(recentBillType, recentBillTypes, 'recent bill type')
    ]).then(() => this.client.get(`${congress}/${chamber}/bills/${recentBillType}`, offset));
  }
};

module.exports = {
  create(key, congress) {
    if (congress && !validators.isValidCongress(congress)) {
      throw new Error(`Received invalid congress: ${stringify(congress)}`);
    }
    return assign(create(proto), {
      congress,
      client: client.create(key)
    });
  }
};
