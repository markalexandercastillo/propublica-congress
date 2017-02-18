const {create, assign} = Object
  , client = require('./client')
  ;

const proto = {
};

module.exports = {
  create(key, congress) {
    return assign(create(proto), {
      congress,
      client: client.create(key)
    });
  }
};
