const {create, assign, keys} = Object
  , {stringify} = JSON
  , api = require('./api')
  , validators = require('./validators')
  , data = require('./data')
  , {CURRENT_CONGRESS} = require('./defaults');

/**
 * Runs validator functions on every value in argsMap
 *
 * @param {Object} argsMap
 * @returns {Promise}
 */
const validateArgs = argsMap => new Promise((resolve, reject) => {
  let error;
  keys(argsMap).some(name => {
    // if not already an array, coerce args into array to be spread later on. assumes first arg is
    // never actually an array
    const args = Array.isArray(argsMap[name])
      ? argsMap[name]
      : [argsMap[name]];

    // validator function name
    const validatorName = name.match(/(Type|MemberId)/)
      ? `isValid${name.match(/(Type|MemberId)/)[0]}`
      : `isValid${name[0].toUpperCase()}${name.slice(1)}`;

    // for a descriptive error message
    const descriptor = name
      .replace(/[A-Z]/g, letter => ` ${letter.toLowerCase()}`)
      .trim()
      .replace(/id:/, letter => letter.toUpperCase());

    // run validation function
    if (!validators[validatorName](...args)) {
      return error = new Error(`Received invalid ${descriptor}: ${stringify(args[0])}`);
    }
  });

  error ? reject(error) : resolve();
});

const proto = assign({}, data, {
  /**
   * Resolves to biographical and Congressional role information for a particular member of Congress
   *
   * @param {String} memberId
   * @returns {Promise}
   */
  getMember(memberId) {
    return validateArgs({memberId})
      .then(() => this.api.get(`members/${memberId}`));
  },
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
    return validateArgs({
      chamber,
      committeeId,
      congress: [congress, 110]
    }).then(() => this.api.get(`${congress}/${chamber}/committees/${committeeId}`, offset));
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
    return validateArgs({
      state,
      congress: [congress, 107]
    }).then(() => this.api.get(`${congress}/nominees/state/${state}`));
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
    return validateArgs({chamber, year, month})
      .then(() => this.api.get(`${chamber}/votes/${year}/${month}`));
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
    return validateArgs({
      rollCallNumber,
      sessionNumber,
      chamber,
      congress: [congress, {house: 102, senate: 101}[chamber]]
    }).then(() => this.api.get(`${congress}/${chamber}/sessions/${sessionNumber}/votes/${rollCallNumber}`));
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
    return validateArgs({
      memberId,
      memberBillType: [memberBillType, data.memberBillTypes]
    }).then(() => this.api.get(`members/${memberId}/bills/${memberBillType}`, offset));
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
    return validateArgs({state, district})
      .then(() => this.api.get(`members/house/${state}/${district}/current`));
  },
  /**
   * Resolves to the current members of the senate for the given state
   *
   * @see https://propublica.github.io/congress-api-docs/#get-current-members-by-state-district
   * @param {any} state
   * @returns {Promise}
   */
  getCurrentSenators(state) {
    return validateArgs({state})
      .then(() => this.api.get(`members/senate/${state}/current`));
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
    return validateArgs({
      chamber,
      congress: [congress, 111]
    }).then(() => this.api.get(`${congress}/${chamber}/members/leaving`, offset));
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
    return validateArgs({
      chamber,
      voteType: [voteType, data.voteTypes],
      congress: [congress, {senate: 101, house: 102}[chamber]]
    }).then(() => this.api.get(`${congress}/${chamber}/votes/${voteType}`, offset));
  },
  /**
   * Resolves to Senate votes on presidential nominations
   *
   * @see https://propublica.github.io/congress-api-docs/#get-senate-nomination-votes
   * @param {Object} [{congress = this.congress, offset = 0}={}]
   * @returns {Promise}
   */
  getSenateNominationVotes({congress = this.congress, offset = 0} = {}) {
    return validateArgs({congress: [congress, 101]})
      .then(() => this.api.get(`${congress}/nominations`, offset));
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
    return validateArgs({
      congress: [congress, 107],
      nomineeType: [nomineeType, data.nomineeTypes]
    }).then(() => this.api.get(`${congress}/nominees/${nomineeType}`));
  },
  /**
   * Resolves to party membership counts for all states (current Congress only)
   *
   * @see https://propublica.github.io/congress-api-docs/#get-state-party-counts
   * @returns {Promise}
   */
  getPartyCounts() {
    return this.api.get('states/members/party');
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
    return validateArgs({
      chamber,
      congress: [congress, 110]
    }).then(() => this.api.get(`${congress}/${chamber}/committees`, offset));
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
    return validateArgs({
      chamber,
      firstMemberId,
      secondMemberId,
      memberComparisonType: [memberComparisonType, data.memberComparisonTypes],
      congress: [congress, {senate: 101, house: 102}[chamber]]
    }).then(() => {
      const endpoint = `members/${firstMemberId}/${memberComparisonType}/${secondMemberId}/${congress}/${chamber}`;
      return this.api.get(endpoint, offset);
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
    return validateArgs({memberId})
      .then(() => this.api.get(`members/${memberId}/votes`, offset));
  },
  /**
   * Resolves to a list of the most recent new members of the current Congress.
   *
   * @see https://propublica.github.io/congress-api-docs/#get-new-members
   * @param {Object} [{offset = 0}={}]
   * @returns {Promise}
   */
  getNewMembers({offset = 0} = {}) {
    return this.api.get('members/new', offset);
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
    return validateArgs({
      chamber,
      congress: [congress, {senate: 80, house: 102}[chamber]]
    }).then(() => this.api.get(`${congress}/${chamber}/members`, offset));
  },
  /**
   * Resolves to additional details about a particular bill of the given type.
   *
   * @see https://propublica.github.io/congress-api-docs/#get-a-subjects-amendments-and-related-bills-for-a-specific-bill
   * @see https://propublica.github.io/congress-api-docs/#get-cosponsors-for-a-specific-bill
   * @param {String} billId
   * @param {String} additionalBillDetailType 'subjects', 'amendments', 'related', or 'cosponsors'
   * @param {Object} [{congress = this.congress, offset = 0}={}]
   * @returns {Promise}
   */
  getAdditionalBillDetails(billId, additionalBillDetailType, {congress = this.congress, offset = 0} = {}) {
    return validateArgs({
      billId,
      congress: [congress, 105],
      additionalBillDetailType: [additionalBillDetailType, data.additionalBillDetailTypes]
    }).then(() => this.api.get(`${congress}/bills/${billId}/${additionalBillDetailType}`, offset));
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
    return validateArgs({
      billId,
      congress: [congress, 105]
    }).then(() => this.api.get(`${congress}/bills/${billId}`));
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
    return validateArgs({
      chamber,
      congress: [congress, 105],
      recentBillType: [recentBillType, data.recentBillTypes]
    }).then(() => this.api.get(`${congress}/${chamber}/bills/${recentBillType}`, offset));
  }
});

module.exports = {
  /**
   * Factory for ProPublica Congress API wrapper object
   *
   * @param {String} key ProPublica API key
   * @param {Number} [congress=CURRENT_CONGRESS] Reference congress to be used as the default
   *                                             congress for any methods that take a congress
   * @returns {Object}
   */
  create(key, congress = CURRENT_CONGRESS) {
    if (congress && !validators.isValidCongress(congress)) {
      throw new Error(`Received invalid congress: ${stringify(congress)}`);
    }
    return assign(create(proto), {
      congress,
      api: api.create(key)
    });
  }
};
