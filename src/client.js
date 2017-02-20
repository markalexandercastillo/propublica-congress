/**
 * Low-level client to the ProPublica congress API. Encapsulates behavior
 * common to all API interactions.
 */

const {create, assign} = Object
  , {stringify} = JSON
  , http = require('./http')
  , validators = require('./validators');

const VERSION = '1';
const HOST = 'https://api.propublica.org';

const proto = {
  /**
   * HTTP get to the API
   * @param  {String} endpoint   API endpoint fragment eg. 'members/new'
   * @param  {Number} [offset=0]
   * @return {Promise}
   */
  get(endpoint, offset = 0) {
    if (!validators.isValidOffset(offset)) {
      return Promise.reject(new Error(`Received invalid offset: ${stringify(offset)}`));
    }

    const headers = {['X-API-Key']: this.key};
    const body = offset ? {offset} : {};
    return http.get(
      `${HOST}/congress/v${VERSION}/${endpoint}.json`,
      assign({headers, json: true}, {body})
    ).then(({body}) => body);
  }
};

module.exports = {
  /**
   * Factory function for getting client instances
   * @param  {String} key ProPublica API Key
   * @return {Object}
   */
  create(key) {
    if (!validators.isValidApiKey(key)) {
      throw Error(`Received invalid API key: ${stringify(key)}`);
    }

    return assign(create(proto), {
      key
    });
  }
};
