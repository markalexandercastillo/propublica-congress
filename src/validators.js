/**
 * Whether the argument is a valid offset to send to the ProPublica API
 * @param {String|Number} offset
 * @return {Boolean}
 */
function isValidOffset(offset) {
  return (offset % 20) === 0 && offset !== '';
}

/**
 * Whether the given response data has a valid structure
 * @param  {Object}  response
 * @return {Boolean}
 */
function isValidResponse(response) {
  return !!response
    && !!response.body
    && !!response.body.results
    && Array.isArray(response.body.results)
    && response.body.results.length === 1;
}

/**
 * Whether the API key is valid (for trying to use)
 * @param  {String}  apiKey
 * @return {Boolean}
 */
function isValidApiKey(apiKey) {
  return (typeof apiKey === 'string' || apiKey instanceof String)
    && apiKey.length > 0;
}

module.exports = {
  isValidOffset,
  isValidResponse,
  isValidApiKey
};
