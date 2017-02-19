const {create, assign} = Object
  , {stringify} = JSON
  , client = require('./client')
  , validators = require('./validators')
  ;

const recentBillTypes = new Set([
  'introduced',
  'updated',
  'passed',
  'major'
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

const proto = {
  /**
   * Resolves to details about a particular bill, including actions taken and votes.
   * 
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
