const http = require('./http')
  , {create, assign} = Object;

const defaults = {
  VERSION: '1',
  HOST: 'https://api.propublica.org'
};

const proto = {
  get(endpoint, offset = 0) {
    const headers = {['X-API-Key']: this.key};
    const body = offset ? {offset} : {};
    return http.get(
      `${this.host}/congress/v${this.version}/${endpoint}.json`,
      assign({headers, json: true}, {body})
      // pluck out relevant data from the body probably from having to
      // support xml
    ).then(response => response.body.results[0]);
  }
};

module.exports = {
  defaults,
  create({
    version = defaults.VERSION,
    host = defaults.HOST,
    key
  }) {
    return assign(create(proto), {
      version,
      host,
      key
    });
  }
};
