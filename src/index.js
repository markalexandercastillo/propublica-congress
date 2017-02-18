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

const proto = {
  getRecentBills(chamber, recentBillType, {congress = this.congress, offset = 0} = {}) {
    if (!validators.isValidChamber(chamber)) return Promise.reject(new Error(`Received invalid chamber: ${stringify(chamber)}`));
    if (!validators.isValidCongress(congress)) return Promise.reject(new Error(`Received invalid congress: ${stringify(congress)}`));
    if (!validators.isValidType(recentBillType, recentBillTypes)) return Promise.reject(new Error(`Received invalid recent bill type: ${stringify(recentBillType)}`));
    const endpoint = `${congress}/${chamber}/bills/${recentBillType}`;
    return this.client.get(endpoint, offset);
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
