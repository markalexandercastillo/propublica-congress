/**
 * Low-level client to the ProPublica congress API. Encapsulates behavior
 * common to all API interactions.
 */

const http = require('./http')
  , {create, assign} = Object;

const defaults = {
  VERSION: '1',
  HOST: 'https://api.propublica.org'
};

const proto = {
  /**
   * HTTP get to the API
   * @param  {String} endpoint   API endpoint fragment eg. 'members/new'
   * @param  {Number} [offset=0]
   * @return {Promise}
   */
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
  /**
   * Factory function for getting client instances
   * @param  {options.String} [version='1']
   * @param  {options.String} [host='https://api.propublica.org']
   * @param  {options.String} key                                 API Key
   * @return {Object}
   */
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
