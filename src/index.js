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

function isValidChamber(chamber) {
  return new Promise((resolve, reject) => validators.isValidChamber(chamber)
    ? resolve(true)
    : reject(new Error(`Received invalid chamber: ${stringify(chamber)}`))
  );
}

function isValidCongress(session, earliestSession) {
  return new Promise((resolve, reject) => validators.isValidCongress(session, earliestSession)
    ? resolve(true)
    : reject(new Error(`Received invalid congress: ${stringify(session)}`))
  );
}

function isValidType(type, typeSet, descriptor) {
  return new Promise((resolve, reject) => validators.isValidType(type, typeSet)
    ? resolve(true)
    : reject(new Error(`Received invalid ${descriptor}: ${stringify(type)}`))
  );
}

const proto = {
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
      isValidChamber(chamber),
      isValidCongress(congress, 105),
      isValidType(recentBillType, recentBillTypes, 'recent bill type')
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
