/**
 * Whether the argument is a valid offset to send to the ProPublica API
 * @param {Number} offset
 */
function isValidOffset(offset) {
  return (offset % 20) === 0 && offset !== '';
}

module.exports = {
  isValidOffset
};
