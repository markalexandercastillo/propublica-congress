/**
 * Whether the argument is a valid offset to send to the ProPublica API
 * @param {Number} offset
 */
function isValidOffset(offset) {
  return !!parseInt(offset) && (offset % 20) === 0;
}

module.exports = {
  isValidOffset
};
