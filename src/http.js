/**
 * Extremely thin wrapper around got
 */

const got = require('got');

function get(url, {headers = {}, query = {}, json = false} = {}) {
  return got.get(url, {
    headers,
    query,
    json
  });
}

module.exports = {
  get
};
