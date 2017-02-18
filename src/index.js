const {create, assign} = Object
  , {stringify} = JSON
  , client = require('./client')
  , validators = require('./validators')
  ;

const proto = {
  getRecentBills(chamber, recentBillType, {congress = this.congress, offset = 0} = {}) {
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
