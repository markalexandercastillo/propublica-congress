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
 * Whether the given type is in the given typeMap
 * @param  {String}  type
 * @param  {Object}  [typeMap={}] Expected to be an object with const-style
 *                                keys (capital, underscored)
 * @return {Boolean}
 */
function isValidType(type, typeMap = {}) {
  return (typeof type === 'string' || type instanceof String)
    && !!Object.keys(typeMap).length
    && !!typeMap[type.toUpperCase()];
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
  isValidType,
  isValidOffset,
  isValidResponse,
  isValidApiKey
};
